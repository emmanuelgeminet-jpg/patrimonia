import { formatEuros } from "@/lib/budget";
import {
  createLayout,
  drawSectionTitle,
  drawParagraph,
  drawField,
  drawFieldsGrid,
  drawChecklistLine,
  drawBadgeOrLogo,
  finish,
  ensureSpace,
  INK,
  INK_SOFT,
  type PdfLayout,
} from "@/lib/pdf-layout";
import {
  CLAUSE_SOLIDARITE,
  CLAUSE_RESOLUTOIRE_INTRO,
  CLAUSE_RESOLUTOIRE_POINTS,
  DPE_SEUILS_MINIMUMS_INTRO,
  DPE_SEUILS_MINIMUMS_METROPOLE,
  DPE_SEUILS_MINIMUMS_DOM,
  DPE_SEUILS_MINIMUMS_METHODE,
  RENOUVELLEMENT_CONGE,
  HONORAIRES_RAPPEL,
  DEPOT_GARANTIE_RAPPEL,
} from "@/lib/legal-text";

export type BailLocataire = { nom: string; email?: string | null };
export type BailMandataire = { nom: string; adresse: string; activite?: string | null; cartePro?: string | null };
export type BailGarant = { nom: string; adresse: string };

export type BailBailleur = {
  nom: string;
  adresse: string;
  estPersonneMorale: boolean;
  sciEntreParentsAllies?: boolean | null;
  siren?: string | null;
  gerantNom?: string | null;
  email?: string | null;
  logoStyle?: string | null;
  mandataire?: BailMandataire | null;
  garant?: BailGarant | null;
};

export const PERIODES_CONSTRUCTION: Record<string, string> = {
  avant_1949: "avant 1949",
  "1949_1974": "1949 à 1974",
  "1975_1989": "1975 à 1989",
  "1990_2005": "1990 à 2005",
  depuis_2005: "depuis 2005",
};

export type BailLogement = {
  adresse: string;
  batiment?: string | null;
  etage?: string | null;
  porte?: string | null;
  identifiantFiscal?: string | null;
  immeubleCollectif: boolean;
  copropriete: boolean;
  periodeConstruction?: string | null;
  surfaceHabitableM2?: number | null;
  nombrePiecesPrincipales?: number | null;
  autresParties: {
    grenier?: boolean;
    combleAmenage?: boolean;
    combleNonAmenage?: boolean;
    terrasse?: boolean;
    balcon?: boolean;
    loggia?: boolean;
    jardin?: boolean;
    autre?: string | null;
  };
  equipements: { cuisineEquipee?: boolean; installationsSanitaires?: boolean; autre?: string | null };
  chauffageType?: "individuel" | "collectif" | null;
  chauffageModalites?: string | null;
  eauChaudeType?: "individuelle" | "collective" | null;
  eauChaudeModalites?: string | null;
  dpeClasse?: string | null;
};

export type BailDestination = { usage: "habitation" | "mixte"; profession?: string | null };
export type BailAccessoiresPrivatifs = { caveNumero?: string | null; parkingNumero?: string | null; garageNumero?: string | null };
export type BailAccessoiresCommuns = {
  garageVelo?: boolean;
  ascenseur?: boolean;
  espacesVerts?: boolean;
  airesJeux?: boolean;
  laverie?: boolean;
  localPoubelles?: boolean;
  gardiennage?: boolean;
  autre?: string | null;
};
export type BailTic = { television?: string | null; internet?: string | null };

export type BailDuree = {
  datePriseEffet: string;
  dureeAnnees: 3 | 6 | null;
  dureeReduiteMois?: number | null;
  dureeReduiteJustification?: string | null;
};

export type BailLoyer = {
  montantInitialCents: number;
  zoneTendue: boolean;
  loyerReferenceApplicable: boolean;
  loyerReferenceM2Cents?: number | null;
  loyerReferenceMajoreM2Cents?: number | null;
  complementLoyerCents?: number | null;
  complementLoyerJustification?: string | null;
  dernierLocataireMontantCents?: number | null;
  dernierLocataireDateVersement?: string | null;
  dernierLocataireDateDerniereRevision?: string | null;
  revisionJourMois?: string | null;
  revisionTrimestreIrl?: string | null;
};

export type BailCharges = { mode: "provisions" | "periodique" | "forfait"; montantCents: number };
export type BailPartageEconomiesCharges = { montantCents: number; dureeRestanteMois?: number | null; dateSignature?: string | null; travaux?: string | null };
export type BailAssuranceColocataires = { souscrite: boolean; montantAnnuelCents?: number | null };
export type BailPaiement = { jourPaiement: number; payableA: "bailleur" | "mandataire" };

export type BailTravaux = {
  ameliorationDecence?: string | null;
  majorationNature?: string | null;
  majorationModalites?: string | null;
  majorationDelai?: string | null;
  majorationMontantCents?: number | null;
  diminutionNature?: string | null;
  diminutionModalites?: string | null;
  diminutionDelai?: string | null;
  diminutionMontantCents?: number | null;
  diminutionDureeMois?: number | null;
};

export type BailGarantie = { montantCents: number; type: "depot_garantie" | "garantie_autonome" };
export type BailHonorairesRepartition = { poste: string; bailleurCents: number; locataireCents: number };
export type BailHonoraires = {
  concoursAgence: boolean;
  visiteDossierRedactionM2Cents?: number | null;
  etatDesLieuxM2Cents?: number | null;
  repartition: BailHonorairesRepartition[];
};

export type BailAnnexes = {
  reglementCopropriete: boolean;
  dossierDiagnosticTechnique: boolean;
  noticeInformation: boolean;
  etatDesLieux: boolean;
  autorisationMiseEnLocation: boolean;
  referencesLoyersVoisinage: boolean;
};

export type BailDonnees = {
  bailleur: BailBailleur;
  locataires: BailLocataire[];
  logement: BailLogement;
  destination: BailDestination;
  accessoiresPrivatifs: BailAccessoiresPrivatifs;
  accessoiresCommuns: BailAccessoiresCommuns;
  tic: BailTic;
  duree: BailDuree;
  loyer: BailLoyer;
  charges: BailCharges;
  partageEconomiesCharges?: BailPartageEconomiesCharges | null;
  assuranceColocataires?: BailAssuranceColocataires | null;
  paiement: BailPaiement;
  depensesEnergetiquesMontantAnnuelCents?: number | null;
  depensesEnergetiquesAnneeReference?: string | null;
  travaux: BailTravaux;
  garantie: BailGarantie;
  honoraires: BailHonoraires;
  autresConditions?: string | null;
  annexes: BailAnnexes;
  lieuSignature: string;
};

export type BailMeta = { bienAdresse: string; lotNom: string; typeBail: "non_meuble" | "meuble" };

// ----- Conversion d'un montant en toutes lettres (mention obligatoire du contrat-type) -----

const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt", ""];

function deuxChiffresEnLettres(n: number): string {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7 || d === 9) {
    const base = d === 7 ? "soixante" : "quatre-vingt";
    return `${base}-${UNITES[10 + u]}`;
  }
  const dizaineWord = DIZAINES[d];
  if (u === 0) return d === 8 ? `${dizaineWord}s` : dizaineWord;
  if (u === 1 && d !== 8) return `${dizaineWord} et un`;
  return `${dizaineWord}-${UNITES[u]}`;
}

function troisChiffresEnLettres(n: number): string {
  const c = Math.floor(n / 100);
  const reste = n % 100;
  if (c === 0) return deuxChiffresEnLettres(reste);
  const centMot = c === 1 ? "cent" : `${UNITES[c]} cent`;
  if (reste === 0) return c > 1 ? `${centMot}s` : centMot;
  return `${centMot} ${deuxChiffresEnLettres(reste)}`;
}

function entierEnLettres(n: number): string {
  if (n === 0) return "zéro";
  if (n < 1000) return troisChiffresEnLettres(n);
  const milliers = Math.floor(n / 1000);
  const reste = n % 1000;
  const millierMot = milliers === 1 ? "mille" : `${troisChiffresEnLettres(milliers)} mille`;
  return reste === 0 ? millierMot : `${millierMot} ${troisChiffresEnLettres(reste)}`;
}

/** Montant en toutes lettres (euros + centimes) — mention exigée par le contrat-type pour le
 *  montant total dû et le dépôt de garantie. */
export function montantEnLettres(cents: number): string {
  const euros = Math.floor(cents / 100);
  const centimes = cents % 100;
  let result = `${entierEnLettres(euros)} ${euros <= 1 ? "euro" : "euros"}`;
  if (centimes > 0) {
    result += ` et ${entierEnLettres(centimes)} ${centimes <= 1 ? "centime" : "centimes"}`;
  }
  return result;
}

function formatDateFr(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function oui(v: boolean | null | undefined): string {
  return v ? "Oui" : "Non";
}

async function drawEnTete(layout: PdfLayout, donnees: BailDonnees) {
  const badgeR = 26;
  const badgeCx = layout.left + badgeR;
  const badgeCy = layout.y - badgeR + 6;
  await drawBadgeOrLogo(layout, badgeCx, badgeCy, badgeR, donnees.bailleur.nom, donnees.bailleur.logoStyle);
  const wordmarkX = layout.left + badgeR * 2 + 12;
  layout.page.drawText(donnees.bailleur.nom.toUpperCase(), { x: wordmarkX, y: badgeCy + 8, size: 13, font: layout.bold, color: INK });
  layout.y -= badgeR * 2 + 10;
  layout.page.drawText("CONTRAT DE LOCATION POUR LOCAUX NON MEUBLÉS", { x: layout.left, y: layout.y, size: 16, font: layout.bold, color: INK });
  layout.y -= 14;
  layout.page.drawText(
    "Soumis au titre Ier de la loi n° 89-462 du 6 juillet 1989, conforme au décret n° 2015-587 du 29 mai 2015.",
    { x: layout.left, y: layout.y, size: 8, font: layout.italic, color: INK_SOFT }
  );
  layout.y -= 20;
}

/** Génère le PDF d'un bail de location (non meublé) et le renvoie en octets. */
export async function genererBailPdf(donnees: BailDonnees, meta: BailMeta): Promise<Uint8Array> {
  const layout = await createLayout(`Bail — ${meta.bienAdresse} — ${meta.lotNom}`);
  await drawEnTete(layout, donnees);

  // ----- Désignation des parties -----
  drawSectionTitle(layout, "Désignation des parties");
  drawField(layout, "Bailleur", donnees.bailleur.nom);
  drawField(layout, "Adresse du bailleur", donnees.bailleur.adresse);
  drawFieldsGrid(layout, [
    { label: "Personne morale", value: oui(donnees.bailleur.estPersonneMorale) },
    { label: "Adresse électronique", value: donnees.bailleur.email ?? "—" },
  ]);
  if (donnees.bailleur.estPersonneMorale && donnees.bailleur.sciEntreParentsAllies) {
    drawParagraph(layout, "Société civile constituée exclusivement entre parents et alliés jusqu'au 4e degré inclus.", { size: 8.5 });
  }
  if (donnees.bailleur.gerantNom) {
    drawFieldsGrid(layout, [{ label: "Gérant", value: donnees.bailleur.gerantNom }]);
  }
  if (donnees.bailleur.mandataire) {
    drawField(layout, "Mandataire", `${donnees.bailleur.mandataire.nom} — ${donnees.bailleur.mandataire.adresse}`);
    drawFieldsGrid(layout, [
      { label: "Activité du mandataire", value: donnees.bailleur.mandataire.activite ?? "—" },
      { label: "N° carte professionnelle", value: donnees.bailleur.mandataire.cartePro ?? "—" },
    ]);
  }
  if (donnees.bailleur.garant) {
    drawField(layout, "Garant", `${donnees.bailleur.garant.nom} — ${donnees.bailleur.garant.adresse}`);
  }
  for (const [i, locataire] of donnees.locataires.entries()) {
    drawFieldsGrid(layout, [
      { label: `Locataire ${i + 1}`, value: locataire.nom },
      { label: "Adresse électronique", value: locataire.email ?? "—" },
    ]);
  }

  // ----- Objet du contrat -----
  drawSectionTitle(layout, "Objet du contrat — A. Consistance du logement");
  drawField(layout, "Adresse du logement", meta.bienAdresse);
  drawFieldsGrid(layout, [
    { label: "Bâtiment / étage / porte", value: [donnees.logement.batiment, donnees.logement.etage, donnees.logement.porte].filter(Boolean).join(" / ") || "—" },
    { label: "Identifiant fiscal du logement", value: donnees.logement.identifiantFiscal ?? "—" },
    { label: "Immeuble collectif", value: oui(donnees.logement.immeubleCollectif) },
    { label: "Copropriété", value: oui(donnees.logement.copropriete) },
    { label: "Période de construction", value: donnees.logement.periodeConstruction ? PERIODES_CONSTRUCTION[donnees.logement.periodeConstruction] ?? "—" : "—" },
    { label: "Niveau de performance DPE", value: donnees.logement.dpeClasse ?? "—" },
    { label: "Surface habitable", value: donnees.logement.surfaceHabitableM2 != null ? `${donnees.logement.surfaceHabitableM2} m²` : "—" },
    { label: "Nombre de pièces principales", value: donnees.logement.nombrePiecesPrincipales != null ? String(donnees.logement.nombrePiecesPrincipales) : "—" },
  ]);
  drawChecklistLine(layout, [
    { label: "Grenier", checked: !!donnees.logement.autresParties.grenier },
    { label: "Comble aménagé", checked: !!donnees.logement.autresParties.combleAmenage },
    { label: "Comble non aménagé", checked: !!donnees.logement.autresParties.combleNonAmenage },
    { label: "Terrasse", checked: !!donnees.logement.autresParties.terrasse },
    { label: "Balcon", checked: !!donnees.logement.autresParties.balcon },
    { label: "Loggia", checked: !!donnees.logement.autresParties.loggia },
    { label: "Jardin", checked: !!donnees.logement.autresParties.jardin },
  ]);
  if (donnees.logement.autresParties.autre) drawParagraph(layout, `Autre : ${donnees.logement.autresParties.autre}`, { size: 8.5 });
  drawChecklistLine(layout, [
    { label: "Cuisine équipée", checked: !!donnees.logement.equipements.cuisineEquipee },
    { label: "Installations sanitaires", checked: !!donnees.logement.equipements.installationsSanitaires },
  ]);
  if (donnees.logement.equipements.autre) drawParagraph(layout, `Autre équipement : ${donnees.logement.equipements.autre}`, { size: 8.5 });
  drawFieldsGrid(layout, [
    { label: "Chauffage", value: donnees.logement.chauffageType === "collectif" ? "Collectif" : donnees.logement.chauffageType === "individuel" ? "Individuel" : "—" },
    { label: "Eau chaude sanitaire", value: donnees.logement.eauChaudeType === "collective" ? "Collective" : donnees.logement.eauChaudeType === "individuelle" ? "Individuelle" : "—" },
  ]);
  if (donnees.logement.chauffageModalites) drawParagraph(layout, `Modalités de répartition du chauffage collectif : ${donnees.logement.chauffageModalites}`, { size: 8.5 });
  if (donnees.logement.eauChaudeModalites) drawParagraph(layout, `Modalités de répartition de l'eau chaude collective : ${donnees.logement.eauChaudeModalites}`, { size: 8.5 });

  drawParagraph(layout, DPE_SEUILS_MINIMUMS_INTRO, { size: 7.5 });
  for (const line of [...DPE_SEUILS_MINIMUMS_METROPOLE, ...DPE_SEUILS_MINIMUMS_DOM]) drawParagraph(layout, line, { size: 7.5 });
  drawParagraph(layout, DPE_SEUILS_MINIMUMS_METHODE, { size: 7.5 });

  drawSectionTitle(layout, "B. Destination des locaux");
  drawFieldsGrid(layout, [{ label: "Usage", value: donnees.destination.usage === "mixte" ? `Mixte habitation / professionnel (${donnees.destination.profession ?? "—"})` : "Habitation" }]);

  drawSectionTitle(layout, "C. Locaux et équipements à usage privatif");
  drawFieldsGrid(layout, [
    { label: "Cave n°", value: donnees.accessoiresPrivatifs.caveNumero ?? "—" },
    { label: "Parking n°", value: donnees.accessoiresPrivatifs.parkingNumero ?? "—" },
    { label: "Garage n°", value: donnees.accessoiresPrivatifs.garageNumero ?? "—" },
  ]);

  drawSectionTitle(layout, "D. Locaux, équipements et accessoires à usage commun");
  drawChecklistLine(layout, [
    { label: "Garage à vélo", checked: !!donnees.accessoiresCommuns.garageVelo },
    { label: "Ascenseur", checked: !!donnees.accessoiresCommuns.ascenseur },
    { label: "Espaces verts", checked: !!donnees.accessoiresCommuns.espacesVerts },
    { label: "Aires et équipements de jeux", checked: !!donnees.accessoiresCommuns.airesJeux },
    { label: "Laverie", checked: !!donnees.accessoiresCommuns.laverie },
    { label: "Local poubelles", checked: !!donnees.accessoiresCommuns.localPoubelles },
    { label: "Gardiennage", checked: !!donnees.accessoiresCommuns.gardiennage },
  ]);
  if (donnees.accessoiresCommuns.autre) drawParagraph(layout, `Autre prestation ou service collectif : ${donnees.accessoiresCommuns.autre}`, { size: 8.5 });

  drawSectionTitle(layout, "E. Équipement d'accès aux TIC (télévision, internet)");
  drawFieldsGrid(layout, [
    { label: "Réception télévision", value: donnees.tic.television ?? "—" },
    { label: "Raccordement internet", value: donnees.tic.internet ?? "—" },
  ]);

  // ----- Date de prise d'effet et durée -----
  drawSectionTitle(layout, "Date de prise d'effet et durée du contrat");
  drawFieldsGrid(layout, [
    { label: "Date de prise d'effet", value: formatDateFr(donnees.duree.datePriseEffet) },
    { label: "Durée", value: donnees.duree.dureeAnnees ? `${donnees.duree.dureeAnnees} ans` : `Durée réduite — ${donnees.duree.dureeReduiteMois ?? "—"} mois` },
  ]);
  if (!donnees.duree.dureeAnnees && donnees.duree.dureeReduiteJustification) {
    drawParagraph(layout, `Motif de la durée réduite : ${donnees.duree.dureeReduiteJustification}`, { size: 8.5 });
  }
  for (const line of RENOUVELLEMENT_CONGE) drawParagraph(layout, line, { size: 7.5 });

  // ----- Conditions financières -----
  drawSectionTitle(layout, "Conditions financières — A. Loyer");
  drawFieldsGrid(layout, [
    { label: "Loyer mensuel initial", value: formatEuros(donnees.loyer.montantInitialCents) },
    { label: "Logement en zone tendue", value: oui(donnees.loyer.zoneTendue) },
  ]);
  if (donnees.loyer.zoneTendue) {
    drawFieldsGrid(layout, [
      { label: "Loyer de référence applicable", value: oui(donnees.loyer.loyerReferenceApplicable) },
      { label: "Loyer de référence /m²", value: donnees.loyer.loyerReferenceM2Cents != null ? formatEuros(donnees.loyer.loyerReferenceM2Cents) : "—" },
      { label: "Loyer de référence majoré /m²", value: donnees.loyer.loyerReferenceMajoreM2Cents != null ? formatEuros(donnees.loyer.loyerReferenceMajoreM2Cents) : "—" },
      { label: "Complément de loyer", value: donnees.loyer.complementLoyerCents != null ? formatEuros(donnees.loyer.complementLoyerCents) : "—" },
    ]);
    if (donnees.loyer.complementLoyerJustification) drawParagraph(layout, `Caractéristiques justifiant le complément de loyer : ${donnees.loyer.complementLoyerJustification}`, { size: 8.5 });
  }
  if (donnees.loyer.dernierLocataireMontantCents != null) {
    drawFieldsGrid(layout, [
      { label: "Dernier loyer appliqué (précédent locataire)", value: formatEuros(donnees.loyer.dernierLocataireMontantCents) },
      { label: "Versé le", value: formatDateFr(donnees.loyer.dernierLocataireDateVersement) },
      { label: "Dernière révision le", value: formatDateFr(donnees.loyer.dernierLocataireDateDerniereRevision) },
    ]);
  }
  drawFieldsGrid(layout, [
    { label: "Date de révision annuelle", value: donnees.loyer.revisionJourMois ?? "—" },
    { label: "Trimestre IRL de référence", value: donnees.loyer.revisionTrimestreIrl ?? "—" },
  ]);

  drawSectionTitle(layout, "B. Charges récupérables");
  const modeLabel = { provisions: "Provisions avec régularisation annuelle", periodique: "Paiement périodique sans provision", forfait: "Forfait de charges" }[donnees.charges.mode];
  drawFieldsGrid(layout, [
    { label: "Mode", value: modeLabel },
    { label: "Montant", value: formatEuros(donnees.charges.montantCents) },
  ]);

  if (donnees.partageEconomiesCharges) {
    drawSectionTitle(layout, "C. Participation pour le partage des économies de charges");
    drawFieldsGrid(layout, [
      { label: "Montant", value: formatEuros(donnees.partageEconomiesCharges.montantCents) },
      { label: "Durée restant à courir", value: donnees.partageEconomiesCharges.dureeRestanteMois != null ? `${donnees.partageEconomiesCharges.dureeRestanteMois} mois` : "—" },
      { label: "Date de signature", value: formatDateFr(donnees.partageEconomiesCharges.dateSignature) },
    ]);
    if (donnees.partageEconomiesCharges.travaux) drawParagraph(layout, `Travaux d'économie d'énergie concernés : ${donnees.partageEconomiesCharges.travaux}`, { size: 8.5 });
  }

  if (donnees.locataires.length > 1 && donnees.assuranceColocataires) {
    drawSectionTitle(layout, "D. Assurance pour le compte des colocataires souscrite par le bailleur");
    drawFieldsGrid(layout, [
      { label: "Souscrite", value: oui(donnees.assuranceColocataires.souscrite) },
      { label: "Montant annuel récupérable", value: donnees.assuranceColocataires.montantAnnuelCents != null ? formatEuros(donnees.assuranceColocataires.montantAnnuelCents) : "—" },
    ]);
  }

  drawSectionTitle(layout, "E. Modalités de paiement");
  const totalDuCents = donnees.loyer.montantInitialCents + donnees.charges.montantCents;
  drawField(layout, "Montant total dû (en toutes lettres)", `${formatEuros(totalDuCents)} (${montantEnLettres(totalDuCents)})`);
  drawFieldsGrid(layout, [
    { label: "Jour de paiement (chaque mois)", value: String(donnees.paiement.jourPaiement) },
    { label: "Payable à", value: donnees.paiement.payableA === "mandataire" ? "Au mandataire" : "Au bailleur" },
  ]);

  if (donnees.depensesEnergetiquesMontantAnnuelCents != null) {
    drawSectionTitle(layout, "G. Dépenses énergétiques (information)");
    drawFieldsGrid(layout, [
      { label: "Montant estimé annuel", value: formatEuros(donnees.depensesEnergetiquesMontantAnnuelCents) },
      { label: "Année de référence des prix", value: donnees.depensesEnergetiquesAnneeReference ?? "—" },
    ]);
  }

  // ----- Travaux -----
  const hasTravaux =
    donnees.travaux.ameliorationDecence ||
    donnees.travaux.majorationNature ||
    donnees.travaux.diminutionNature;
  if (hasTravaux) {
    drawSectionTitle(layout, "Travaux");
    if (donnees.travaux.ameliorationDecence) {
      drawParagraph(layout, `Travaux d'amélioration ou de mise en conformité effectués : ${donnees.travaux.ameliorationDecence}`, { size: 8.5 });
    }
    if (donnees.travaux.majorationNature) {
      drawParagraph(
        layout,
        `Majoration de loyer pour travaux du bailleur — nature : ${donnees.travaux.majorationNature} ; modalités : ${donnees.travaux.majorationModalites ?? "—"} ; délai : ${donnees.travaux.majorationDelai ?? "—"} ; montant : ${donnees.travaux.majorationMontantCents != null ? formatEuros(donnees.travaux.majorationMontantCents) : "—"}.`,
        { size: 8.5 }
      );
    }
    if (donnees.travaux.diminutionNature) {
      drawParagraph(
        layout,
        `Diminution de loyer pour travaux du locataire — nature : ${donnees.travaux.diminutionNature} ; modalités : ${donnees.travaux.diminutionModalites ?? "—"} ; délai : ${donnees.travaux.diminutionDelai ?? "—"} ; montant : ${donnees.travaux.diminutionMontantCents != null ? formatEuros(donnees.travaux.diminutionMontantCents) : "—"} pendant ${donnees.travaux.diminutionDureeMois ?? "—"} mois.`,
        { size: 8.5 }
      );
    }
  }

  // ----- Garanties -----
  drawSectionTitle(layout, "Garanties");
  drawParagraph(layout, DEPOT_GARANTIE_RAPPEL, { size: 8 });
  drawField(
    layout,
    donnees.garantie.type === "garantie_autonome" ? "Garantie autonome (en toutes lettres)" : "Dépôt de garantie (en toutes lettres)",
    `${formatEuros(donnees.garantie.montantCents)} (${montantEnLettres(donnees.garantie.montantCents)})`
  );

  // ----- Clauses -----
  if (donnees.locataires.length > 1) {
    drawSectionTitle(layout, "Clause de solidarité");
    drawParagraph(layout, CLAUSE_SOLIDARITE, { size: 8.5, color: INK });
  }
  drawSectionTitle(layout, "Clause résolutoire");
  drawParagraph(layout, CLAUSE_RESOLUTOIRE_INTRO, { size: 8.5, color: INK });
  for (const point of CLAUSE_RESOLUTOIRE_POINTS) drawParagraph(layout, `— ${point}`, { size: 8.5, color: INK });

  // ----- Honoraires de location -----
  if (donnees.honoraires.concoursAgence) {
    drawSectionTitle(layout, "Honoraires de location");
    for (const line of HONORAIRES_RAPPEL) drawParagraph(layout, line, { size: 7.5 });
    drawFieldsGrid(layout, [
      { label: "Plafond visite/dossier/rédaction (par m²)", value: donnees.honoraires.visiteDossierRedactionM2Cents != null ? formatEuros(donnees.honoraires.visiteDossierRedactionM2Cents) : "—" },
      { label: "Plafond état des lieux (par m²)", value: donnees.honoraires.etatDesLieuxM2Cents != null ? formatEuros(donnees.honoraires.etatDesLieuxM2Cents) : "—" },
    ]);
    if (donnees.honoraires.repartition.length) {
      ensureSpace(layout, 20);
      for (const r of donnees.honoraires.repartition) {
        drawFieldsGrid(layout, [
          { label: `${r.poste} — bailleur`, value: formatEuros(r.bailleurCents) },
          { label: `${r.poste} — locataire`, value: formatEuros(r.locataireCents) },
        ]);
      }
    }
  }

  // ----- Autres conditions particulières -----
  if (donnees.autresConditions) {
    drawSectionTitle(layout, "Autres conditions particulières");
    drawParagraph(layout, donnees.autresConditions, { size: 9, color: INK });
  }

  // ----- Annexes -----
  drawSectionTitle(layout, "Annexes");
  drawParagraph(layout, "Les parties reconnaissent avoir émis ou reçu :", { size: 8.5 });
  drawChecklistLine(layout, [
    { label: "Extrait du règlement de copropriété", checked: donnees.annexes.reglementCopropriete },
    { label: "Dossier de diagnostic technique", checked: donnees.annexes.dossierDiagnosticTechnique },
    { label: "Notice d'information (droits et obligations)", checked: donnees.annexes.noticeInformation },
    { label: "État des lieux", checked: donnees.annexes.etatDesLieux },
    { label: "Autorisation préalable de mise en location", checked: donnees.annexes.autorisationMiseEnLocation },
    { label: "Références de loyers du voisinage", checked: donnees.annexes.referencesLoyersVoisinage },
  ]);

  // ----- Signature -----
  drawSectionTitle(layout, "Signatures");
  const dateSignature = new Date().toLocaleDateString("fr-FR");
  drawParagraph(layout, `Fait le ${dateSignature} à ${donnees.lieuSignature}, en autant d'originaux que de parties, dont un remis à chaque signataire.`, { size: 9, color: INK });
  layout.y -= 10;
  ensureSpace(layout, 70);
  const colWidth = (layout.right - layout.left) / 2 - 10;
  layout.page.drawText("LE BAILLEUR OU SON MANDATAIRE", { x: layout.left, y: layout.y, size: 8.5, font: layout.bold, color: INK_SOFT });
  layout.page.drawText("LE(S) LOCATAIRE(S)", { x: layout.left + colWidth + 20, y: layout.y, size: 8.5, font: layout.bold, color: INK_SOFT });
  layout.y -= 12;
  layout.page.drawText('Signature(s) précédée(s) de la mention « Lu et approuvé »', { x: layout.left, y: layout.y, size: 7.5, font: layout.italic, color: INK_SOFT });
  layout.page.drawText('Signature(s) précédée(s) de la mention « Lu et approuvé »', { x: layout.left + colWidth + 20, y: layout.y, size: 7.5, font: layout.italic, color: INK_SOFT });
  layout.y -= 10;
  layout.page.drawRectangle({ x: layout.left, y: layout.y - 55, width: colWidth, height: 55, borderColor: INK_SOFT, borderWidth: 0.75 });
  layout.page.drawRectangle({ x: layout.left + colWidth + 20, y: layout.y - 55, width: colWidth, height: 55, borderColor: INK_SOFT, borderWidth: 0.75 });
  layout.y -= 65;

  return finish(layout);
}
