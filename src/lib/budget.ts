export type ParsedTransaction = {
  date: string; // YYYY-MM-DD
  libelle: string;
  montant_cents: number; // positif = encaissement, négatif = dépense
};

const HEADER_ALIASES = {
  date: ["date"],
  libelle: ["libelle", "libellé", "label", "description", "intitule", "intitulé"],
  montant: ["montant", "amount", "valeur"],
  debit: ["debit", "débit"],
  credit: ["credit", "crédit"],
};

function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  return semicolonCount >= commaCount ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.map((c) => c.replace(/^"|"$/g, ""));
}

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .trim();
}

function findColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let cleaned = raw.replace(/[€\s]/g, "").trim();
  if (!cleaned) return null;
  // Format français "1234,56" -> "1234.56" (mais pas "1,234.56")
  if (/,\d{1,2}$/.test(cleaned) && !cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim();
  // YYYY-MM-DD
  let m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // DD/MM/YYYY ou DD-MM-YYYY
  m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    return `${m[3]}-${month}-${day}`;
  }
  return null;
}

export function parseCsv(rawContent: string): { transactions: ParsedTransaction[]; errors: string[] } {
  // Les exports bancaires commencent souvent par un BOM (marqueur d'encodage invisible)
  // qui, laissé en place, empêche de reconnaître la toute première colonne.
  const content = rawContent.charCodeAt(0) === 0xfeff ? rawContent.slice(1) : rawContent;
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  if (lines.length < 2) {
    return { transactions: [], errors: ["Le fichier ne contient pas assez de lignes."] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter);

  const dateCol = findColumn(headers, HEADER_ALIASES.date);
  const libelleCol = findColumn(headers, HEADER_ALIASES.libelle);
  const montantCol = findColumn(headers, HEADER_ALIASES.montant);
  const debitCol = findColumn(headers, HEADER_ALIASES.debit);
  const creditCol = findColumn(headers, HEADER_ALIASES.credit);

  if (dateCol === -1 || libelleCol === -1 || (montantCol === -1 && debitCol === -1 && creditCol === -1)) {
    return {
      transactions: [],
      errors: [
        "Colonnes non reconnues. Le fichier doit contenir au minimum : une colonne date, une colonne libellé, et une colonne montant (ou débit/crédit).",
      ],
    };
  }

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    if (cells.every((c) => c === "")) continue;

    const date = parseDate(cells[dateCol] ?? "");
    const libelle = (cells[libelleCol] ?? "").trim();

    let montant_cents: number | null = null;
    if (montantCol !== -1) {
      montant_cents = parseAmount(cells[montantCol] ?? "");
    } else {
      const debit = parseAmount(cells[debitCol] ?? "") ?? 0;
      const credit = parseAmount(cells[creditCol] ?? "") ?? 0;
      montant_cents = credit - Math.abs(debit);
    }

    if (!date || !libelle || montant_cents === null) {
      errors.push(`Ligne ${i + 1} ignorée (date, libellé ou montant illisible).`);
      continue;
    }

    transactions.push({ date, libelle, montant_cents });
  }

  return { transactions, errors };
}

const POSITIVE_HINTS = /\b(SALAIRE|VIREMENT RECU|VIR RECU|REMBOURSEMENT|REMISE|CREDIT)\b/i;

/**
 * Reconstruit des "cellules" par ligne à partir du texte PDF extrait avec un
 * séparateur de colonnes (cellSeparator), puis applique la même logique de
 * détection date/libellé/montant que le CSV. Best-effort : la mise en page
 * varie d'une banque à l'autre, d'où le bouton "inverser" pour corriger le
 * sens dépense/recette a posteriori.
 */
export function parsePdfText(text: string): { transactions: ParsedTransaction[]; errors: string[] } {
  const lines = text.split(/\r?\n/);
  const transactions: ParsedTransaction[] = [];
  let skipped = 0;

  for (const rawLine of lines) {
    const cells = rawLine.split("\t").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    const dateIndex = cells.findIndex((c) => parseDate(c) !== null);
    if (dateIndex === -1) continue;
    const date = parseDate(cells[dateIndex]);
    if (!date) continue;

    const amountCells: { index: number; cents: number }[] = [];
    for (let i = dateIndex + 1; i < cells.length; i++) {
      const amount = parseAmount(cells[i]);
      if (amount !== null) amountCells.push({ index: i, cents: amount });
    }
    if (amountCells.length === 0) continue;

    const libelle = cells.slice(dateIndex + 1, amountCells[0].index).join(" ").trim();
    if (!libelle) {
      skipped++;
      continue;
    }

    let montant_cents: number;
    if (amountCells.length >= 2) {
      // Convention la plus courante : colonne débit puis colonne crédit.
      const debit = Math.abs(amountCells[0].cents);
      const credit = Math.abs(amountCells[1].cents);
      montant_cents = credit - debit;
    } else {
      const isPositive = POSITIVE_HINTS.test(libelle);
      montant_cents = isPositive ? Math.abs(amountCells[0].cents) : -Math.abs(amountCells[0].cents);
    }

    transactions.push({ date, libelle, montant_cents });
  }

  const errors: string[] = [];
  if (skipped > 0) errors.push(`${skipped} ligne(s) avec un montant repéré mais sans libellé ignorée(s).`);
  if (transactions.length === 0) {
    errors.push(
      "Aucune ligne de transaction reconnue dans ce PDF — la mise en page de ta banque n'est peut-être pas prise en charge. Essaie l'export CSV si ta banque le propose, c'est plus fiable."
    );
  }
  return { transactions, errors };
}

export const DEFAULT_CATEGORIES: { nom: string; groupe: "besoin" | "envie" | "epargne" }[] = [
  { nom: "Alimentation", groupe: "besoin" },
  { nom: "Logement", groupe: "besoin" },
  { nom: "Transport", groupe: "besoin" },
  { nom: "Santé", groupe: "besoin" },
  { nom: "Assurances", groupe: "besoin" },
  { nom: "Impôts", groupe: "besoin" },
  { nom: "Abonnements & télécom", groupe: "besoin" },
  { nom: "Enfants", groupe: "besoin" },
  { nom: "Immobilier locatif", groupe: "besoin" },
  { nom: "Loisirs & plaisirs", groupe: "envie" },
  { nom: "Shopping", groupe: "envie" },
  { nom: "Restaurants & sorties", groupe: "envie" },
  { nom: "Épargne", groupe: "epargne" },
  { nom: "Investissement", groupe: "epargne" },
  { nom: "Non catégorisé", groupe: "envie" },
];

export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
