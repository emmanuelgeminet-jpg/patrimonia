import type { SupabaseClient } from "@supabase/supabase-js";

export type ParsedTransaction = {
  date: string; // YYYY-MM-DD
  libelle: string;
  montant_cents: number; // positif = encaissement, négatif = dépense
};

/**
 * Beaucoup d'exports bancaires français (CIC, Crédit Agricole, La Banque
 * Postale...) sont encodés en Windows-1252/Latin-1 plutôt qu'en UTF-8.
 * On tente l'UTF-8 en mode strict et on bascule automatiquement sur
 * Windows-1252 si ça échoue, pour rester indépendant de la banque.
 */
export function decodeFileContent(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

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

export type CategoryGroupe = "besoin" | "envie" | "epargne" | null;

export const DEFAULT_CATEGORIES: { nom: string; groupe: CategoryGroupe }[] = [
  // Dépenses
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
  // Revenus — groupe à null, le 50/30/20 ne porte que sur les dépenses
  { nom: "Salaire Emmanuel", groupe: null },
  { nom: "Salaire Thérèse", groupe: null },
  { nom: "Aides & prestations (CAF...)", groupe: null },
  { nom: "Revenus locatifs", groupe: null },
  { nom: "Autres revenus", groupe: null },
];

/** Crée les catégories par défaut qui n'existent pas encore pour ce foyer (idempotent). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureDefaultCategories(supabase: SupabaseClient<any>, householdId: string) {
  const { data: current } = await supabase
    .from("budget_categories")
    .select("nom")
    .eq("household_id", householdId);

  const existingNames = new Set((current ?? []).map((c: { nom: string }) => c.nom));
  const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.nom));

  if (missing.length > 0) {
    await supabase
      .from("budget_categories")
      .insert(missing.map((c) => ({ household_id: householdId, nom: c.nom, groupe: c.groupe })));
  }
}

export function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** "2024-03-25" -> "Mars 2024" */
export function formatMonthLabel(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  return `${MOIS_FR[monthIndex] ?? month} ${year}`;
}

/** Lundi de la semaine ISO contenant cette date, au format YYYY-MM-DD. */
export function getWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay(); // 0 = dimanche ... 6 = samedi
  const diffToMonday = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  return date.toISOString().slice(0, 10);
}

/** "2024-03-25" -> "Sem. du 25/03" */
export function formatWeekLabel(mondayDateStr: string): string {
  const [, month, day] = mondayDateStr.split("-");
  return `Sem. du ${day}/${month}`;
}

export type Granularite = "semaine" | "mois" | "annee";

export function bucketKey(dateStr: string, granularite: Granularite): string {
  if (granularite === "semaine") return getWeekStart(dateStr);
  if (granularite === "annee") return dateStr.slice(0, 4);
  return dateStr.slice(0, 7);
}

export function formatBucketLabel(key: string, granularite: Granularite): string {
  if (granularite === "semaine") return formatWeekLabel(key);
  if (granularite === "annee") return key;
  return formatMonthLabel(key);
}

/** Découpe une saisie libre ("voyage, remboursable") en tags normalisés, sans doublons. */
export function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(/[,;]/)) {
    const tag = part.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}
