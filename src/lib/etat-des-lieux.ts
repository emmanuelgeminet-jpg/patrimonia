import {
  createLayout,
  drawSectionTitle,
  drawParagraph,
  drawField,
  drawFieldsGrid,
  drawTable,
  drawBadgeOrLogo,
  finish,
  ensureSpace,
  INK,
  INK_SOFT,
  type PdfLayout,
} from "@/lib/pdf-layout";
import { ART_3_2_ETAT_DES_LIEUX } from "@/lib/legal-text";

export type EtatDesLieuxPartie = { nom: string; adresse: string };

export type EtatDesLieuxCompteurs = {
  electriciteNumero?: string | null;
  electriciteReleveHP?: string | null;
  electriciteReleveHC?: string | null;
  gazNumero?: string | null;
  gazReleve?: string | null;
  eauReleveFroide?: string | null;
  eauReleveChaude?: string | null;
};

export type EtatDesLieuxCles = {
  serruresPrincipales?: number | null;
  verrousHaut?: number | null;
  verrousBas?: number | null;
  clesImmeuble?: number | null;
  clesCave?: number | null;
  clesBoiteLettres?: number | null;
  clesPortail?: number | null;
  badges?: number | null;
  autresLibelle?: string | null;
  autresNombre?: number | null;
};

export type EtatPartiePrivative = "vide" | "encombree" | "non_visite";
export const ETAT_PARTIE_PRIVATIVE_LABELS: Record<EtatPartiePrivative, string> = {
  vide: "Vide",
  encombree: "Encombrée",
  non_visite: "Non visitée",
};

export type PartiePrivative = { applicable: boolean; numero?: string | null; etat: EtatPartiePrivative | null; observations?: string | null };

export type EtatDesLieuxPartiesPrivatives = {
  cave: PartiePrivative;
  parking: PartiePrivative;
  balconTerrasse: PartiePrivative;
  jardin: PartiePrivative;
  autreLibelle?: string | null;
  autre: PartiePrivative;
};

export type EtatElement = "N" | "BE" | "EU" | "ME";
export const ETAT_ELEMENT_LABELS: Record<EtatElement, string> = {
  N: "Neuf",
  BE: "Bon état",
  EU: "État d'usage",
  ME: "Mauvais état",
};

export type EtatDesLieuxElement = { cle: string; label: string; etat: EtatElement | null; observations?: string | null };
export type EtatDesLieuxPieceType = "entree" | "cuisine" | "sdb_douche" | "wc" | "sejour" | "chambre" | "autre";

export const ROOM_TYPE_LABELS: Record<EtatDesLieuxPieceType, string> = {
  entree: "Entrée",
  cuisine: "Cuisine",
  sdb_douche: "Salle de bain / douche",
  wc: "WC",
  sejour: "Séjour",
  chambre: "Chambre",
  autre: "Autre pièce",
};

export type EtatDesLieuxPiece = { id: string; nom: string; type: EtatDesLieuxPieceType; elements: EtatDesLieuxElement[] };

function elementsUniversels(): EtatDesLieuxElement[] {
  return [
    { cle: "sol", label: "Sol (carrelage / lino / moquette / parquet)", etat: null },
    { cle: "murs", label: "Murs (peinture / papier peint / crépi / faïence)", etat: null },
    { cle: "plafond", label: "Plafond (peinture / papier peint / crépi / dalles)", etat: null },
    { cle: "ouvrants", label: "Portes / fenêtres / volets / persiennes", etat: null },
    { cle: "chauffage_vmc", label: "Chauffage / ventilation / climatisation", etat: null },
    { cle: "electricite", label: "Éclairage / interrupteurs / prises", etat: null },
  ];
}

/** Les éléments à cocher varient selon le type de pièce, fidèle au modèle papier (cuisine/SDB/WC
 *  ont des lignes spécifiques à la place du générique "Meubles / équipements"). */
export function elementsParDefaut(type: EtatDesLieuxPieceType): EtatDesLieuxElement[] {
  const base = elementsUniversels();
  switch (type) {
    case "entree":
      return [...base, { cle: "acces", label: "Sonnette / interphone / alarme", etat: null }, { cle: "meubles", label: "Meubles / équipements", etat: null }];
    case "cuisine":
      return [...base, { cle: "evier", label: "Évier / robinetterie", etat: null }, { cle: "cuisson", label: "Plaques de cuisson / four / hotte", etat: null }];
    case "sdb_douche":
      return [...base, { cle: "sanitaires", label: "Baignoire / douche / lavabo / robinetterie", etat: null }];
    case "wc":
      return [...base, { cle: "sanitaires_wc", label: "Sanitaires / lavabo / robinetterie", etat: null }];
    default:
      return [...base, { cle: "meubles", label: "Meubles / équipements", etat: null }];
  }
}

export type EtatDesLieuxDonnees = {
  bailleur: EtatDesLieuxPartie;
  locataire: EtatDesLieuxPartie;
  mandataire?: EtatDesLieuxPartie | null;
  logoStyle?: string | null;
  compteurs: EtatDesLieuxCompteurs;
  cles: EtatDesLieuxCles;
  partiesPrivatives: EtatDesLieuxPartiesPrivatives;
  chauffageType?: "individuel" | "collectif" | null;
  chauffageNature?: string | null;
  eauChaudeType?: "individuelle" | "collective" | null;
  eauChaudeNature?: string | null;
  pieces: EtatDesLieuxPiece[];
  observationsGenerales?: string | null;
  lieuSignature: string;
};

export type EtatDesLieuxMeta = {
  bienAdresse: string;
  lotNom: string;
  type: "entree" | "sortie";
  dateEtatDesLieux: string;
  dateEtatEntree?: string | null;
};

function formatDateFr(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function nb(n: number | null | undefined): string {
  return n != null ? String(n) : "—";
}

async function drawEnTete(layout: PdfLayout, donnees: EtatDesLieuxDonnees, meta: EtatDesLieuxMeta) {
  const badgeR = 26;
  const badgeCx = layout.left + badgeR;
  const badgeCy = layout.y - badgeR + 6;
  await drawBadgeOrLogo(layout, badgeCx, badgeCy, badgeR, donnees.bailleur.nom, donnees.logoStyle);
  const wordmarkX = layout.left + badgeR * 2 + 12;
  layout.page.drawText(donnees.bailleur.nom.toUpperCase(), { x: wordmarkX, y: badgeCy + 8, size: 13, font: layout.bold, color: INK });
  layout.y -= badgeR * 2 + 10;
  const titre = meta.type === "entree" ? "ÉTAT DES LIEUX D'ENTRÉE" : "ÉTAT DES LIEUX DE SORTIE";
  layout.page.drawText(titre, { x: layout.left, y: layout.y, size: 16, font: layout.bold, color: INK });
  layout.y -= 14;
  layout.page.drawText(
    "Établi conformément à l'article 3-2 de la loi n° 89-462 du 6 juillet 1989.",
    { x: layout.left, y: layout.y, size: 8, font: layout.italic, color: INK_SOFT }
  );
  layout.y -= 20;
}

/** Génère le PDF d'un état des lieux (entrée ou sortie) et le renvoie en octets. */
export async function genererEtatDesLieuxPdf(donnees: EtatDesLieuxDonnees, meta: EtatDesLieuxMeta): Promise<Uint8Array> {
  const layout = await createLayout(`État des lieux — ${meta.bienAdresse} — ${meta.lotNom}`);
  await drawEnTete(layout, donnees, meta);

  drawSectionTitle(layout, "Établi contradictoirement entre");
  drawField(layout, "Bailleur", `${donnees.bailleur.nom} — ${donnees.bailleur.adresse}`);
  drawField(layout, "Locataire" + (meta.type === "sortie" ? " (nouvelle adresse le cas échéant)" : ""), `${donnees.locataire.nom} — ${donnees.locataire.adresse}`);
  if (donnees.mandataire) {
    drawField(layout, "Mandataire", `${donnees.mandataire.nom} — ${donnees.mandataire.adresse}`);
  }
  drawFieldsGrid(layout, [
    { label: "Logement", value: `${meta.bienAdresse} — ${meta.lotNom}` },
    { label: "Date de l'état des lieux", value: formatDateFr(meta.dateEtatDesLieux) },
    ...(meta.type === "sortie" ? [{ label: "État des lieux d'entrée du", value: formatDateFr(meta.dateEtatEntree) }] : []),
  ]);
  drawParagraph(layout, ART_3_2_ETAT_DES_LIEUX, { size: 7.5 });

  drawSectionTitle(layout, "Relevés des compteurs individuels d'eau et d'énergie");
  drawFieldsGrid(layout, [
    { label: "Électricité — n° compteur", value: donnees.compteurs.electriciteNumero ?? "—" },
    { label: "Électricité — relevé HP", value: donnees.compteurs.electriciteReleveHP ?? "—" },
    { label: "Électricité — relevé HC", value: donnees.compteurs.electriciteReleveHC ?? "—" },
    { label: "Gaz — n° compteur", value: donnees.compteurs.gazNumero ?? "—" },
    { label: "Gaz — relevé", value: donnees.compteurs.gazReleve ?? "—" },
    { label: "Eau — relevé eau froide", value: donnees.compteurs.eauReleveFroide ?? "—" },
    { label: "Eau — relevé eau chaude", value: donnees.compteurs.eauReleveChaude ?? "—" },
  ]);

  drawSectionTitle(layout, "Clés et moyens d'accès");
  drawFieldsGrid(layout, [
    { label: "Serrure(s) principale(s)", value: nb(donnees.cles.serruresPrincipales) },
    { label: "Verrou(s) haut", value: nb(donnees.cles.verrousHaut) },
    { label: "Verrou(s) bas", value: nb(donnees.cles.verrousBas) },
    { label: "Clé(s) immeuble", value: nb(donnees.cles.clesImmeuble) },
    { label: "Clé(s) cave", value: nb(donnees.cles.clesCave) },
    { label: "Clé(s) boîte aux lettres", value: nb(donnees.cles.clesBoiteLettres) },
    { label: "Clé(s) portail", value: nb(donnees.cles.clesPortail) },
    { label: "Badge(s) / émetteur(s)", value: nb(donnees.cles.badges) },
  ]);
  if (donnees.cles.autresLibelle) {
    drawFieldsGrid(layout, [{ label: donnees.cles.autresLibelle, value: nb(donnees.cles.autresNombre) }]);
  }

  drawSectionTitle(layout, "Parties privatives");
  const partiesRows: [string, PartiePrivative][] = [
    ["Cave", donnees.partiesPrivatives.cave],
    ["Parking / box", donnees.partiesPrivatives.parking],
    ["Balcon / terrasse", donnees.partiesPrivatives.balconTerrasse],
    ["Jardin", donnees.partiesPrivatives.jardin],
    ...(donnees.partiesPrivatives.autreLibelle ? ([[donnees.partiesPrivatives.autreLibelle, donnees.partiesPrivatives.autre]] as [string, PartiePrivative][]) : []),
  ];
  const applicableRows = partiesRows.filter(([, p]) => p.applicable);
  if (applicableRows.length === 0) {
    drawParagraph(layout, "Sans objet — aucune partie privative annexe pour ce logement.", { size: 9 });
  } else {
    drawTable(
      layout,
      [
        { label: "Partie privative", width: 140 },
        { label: "N°", width: 60 },
        { label: "État", width: 90 },
        { label: "Observations", width: layout.right - layout.left - 290 },
      ],
      applicableRows.map(([label, p]) => [label, p.numero ?? "—", p.etat ? ETAT_PARTIE_PRIVATIVE_LABELS[p.etat] : "—", p.observations ?? "—"])
    );
  }

  drawSectionTitle(layout, "Équipements énergétiques et chauffage");
  drawFieldsGrid(layout, [
    { label: "Chauffage", value: [donnees.chauffageType === "collectif" ? "Collectif" : donnees.chauffageType === "individuel" ? "Individuel" : "—", donnees.chauffageNature].filter(Boolean).join(" — ") },
    { label: "Eau chaude sanitaire", value: [donnees.eauChaudeType === "collective" ? "Collective" : donnees.eauChaudeType === "individuelle" ? "Individuelle" : "—", donnees.eauChaudeNature].filter(Boolean).join(" — ") },
  ]);

  for (const piece of donnees.pieces) {
    const typeLabel = ROOM_TYPE_LABELS[piece.type];
    const titre = piece.nom.trim().toLowerCase() === typeLabel.toLowerCase() ? piece.nom : `${piece.nom} (${typeLabel})`;
    drawSectionTitle(layout, titre);
    drawTable(
      layout,
      [
        { label: "Élément", width: 190 },
        { label: "État", width: 70 },
        { label: "Observations", width: layout.right - layout.left - 260 },
      ],
      piece.elements.map((e) => [e.label, e.etat ? e.etat : "—", e.observations ?? "—"])
    );
  }

  if (donnees.observationsGenerales) {
    drawSectionTitle(layout, "Observations générales");
    drawParagraph(layout, donnees.observationsGenerales, { size: 9, color: INK });
  }

  drawSectionTitle(layout, "Signatures");
  const dateSignature = new Date().toLocaleDateString("fr-FR");
  drawParagraph(layout, `Fait le ${dateSignature} à ${donnees.lieuSignature}, en autant d'exemplaires que de parties.`, { size: 9, color: INK });
  layout.y -= 10;
  ensureSpace(layout, 70);
  const colWidth = (layout.right - layout.left) / (donnees.mandataire ? 3 : 2) - 10;
  const labels = ["LE BAILLEUR", "LE LOCATAIRE", ...(donnees.mandataire ? ["LE MANDATAIRE"] : [])];
  labels.forEach((label, i) => {
    const x = layout.left + i * (colWidth + 15);
    layout.page.drawText(label, { x, y: layout.y, size: 8.5, font: layout.bold, color: INK_SOFT });
  });
  layout.y -= 12;
  layout.y -= 3;
  labels.forEach((_, i) => {
    const x = layout.left + i * (colWidth + 15);
    layout.page.drawRectangle({ x, y: layout.y - 55, width: colWidth, height: 55, borderColor: INK_SOFT, borderWidth: 0.75 });
  });
  layout.y -= 65;

  return finish(layout);
}
