/**
 * Blocs de texte légal fixes pour le bail et l'état des lieux — transcrits mot pour mot depuis
 * les formulaires-type Exacompta d'Emmanuel (contrat-type conforme au décret n° 2015-587 du 29
 * mai 2015, à la loi n° 2021-1104 du 22 août 2021 et au décret n° 2023-796 du 18 août 2023 ;
 * état des lieux conforme à l'article 3-2 de la loi n° 89-462 du 6 juillet 1989), pas reconstruits
 * depuis la mémoire du modèle — le texte réglementaire ne se paraphrase pas.
 */

export const CLAUSE_SOLIDARITE =
  "En cas de pluralité de locataires, ceux-ci sont tenus de manière solidaire et indivisible de toutes les obligations du bail.";

export const CLAUSE_RESOLUTOIRE_INTRO =
  "Il est expressément convenu que la présente location sera résiliée de plein droit sans aucune formalité judiciaire :";

export const CLAUSE_RESOLUTOIRE_POINTS = [
  "à défaut de paiement au terme convenu du loyer ou des charges, et six semaines après un commandement de payer demeuré infructueux,",
  "à défaut de versement du dépôt de garantie, et six semaines après un commandement de payer demeuré infructueux,",
  "à défaut de souscription d'une assurance contre les risques locatifs (sauf en cas de souscription par le Bailleur d'une assurance pour le compte du Locataire), et un mois après un commandement de payer demeuré infructueux,",
  "à défaut de respect de l'obligation d'user paisiblement des locaux loués, résultant de troubles de voisinage constatés par une décision de justice passée en force de chose jugée.",
];

export const DPE_SEUILS_MINIMUMS_INTRO =
  "Rappel : un logement décent doit respecter les critères minimaux de performance suivants :";

export const DPE_SEUILS_MINIMUMS_METROPOLE = [
  "En France métropolitaine :",
  "À compter du 1er janvier 2025, le niveau de performance minimal du logement correspond à la classe F du DPE ;",
  "À compter du 1er janvier 2028, le niveau de performance minimal du logement correspond à la classe E du DPE ;",
  "À compter du 1er janvier 2034, le niveau de performance minimal du logement correspond à la classe D du DPE.",
];

export const DPE_SEUILS_MINIMUMS_DOM = [
  "En Guadeloupe, en Martinique, en Guyane, à La Réunion et à Mayotte :",
  "À compter du 1er janvier 2028, le niveau de performance minimal du logement correspond à la classe F du DPE ;",
  "À compter du 1er janvier 2031, le niveau de performance minimal du logement correspond à la classe E du DPE.",
];

export const DPE_SEUILS_MINIMUMS_METHODE =
  "La consommation d'énergie finale et le niveau de performance du logement sont déterminés selon la méthode du diagnostic de performance énergétique mentionné à l'article L. 126-26 du code de la construction et de l'habitation.";

export const RENOUVELLEMENT_CONGE = [
  "En l'absence de proposition de renouvellement du contrat, celui-ci est, à son terme, reconduit tacitement pour 3 ou 6 ans et dans les mêmes conditions.",
  "Le locataire peut mettre fin au bail à tout moment, après avoir donné congé.",
  "Le bailleur, quant à lui, peut mettre fin au bail à son échéance et après avoir donné congé, soit pour reprendre le logement en vue de l'occuper lui-même ou une personne de sa famille, soit pour le vendre, soit pour un motif sérieux et légitime.",
];

export const HONORAIRES_RAPPEL = [
  "Il est rappelé les dispositions de l'article 5 (I) de la loi du 6 juillet 1989, alinéas 1 à 3 : la rémunération des personnes mandatées pour se livrer ou prêter leur concours à l'entremise ou à la négociation d'une mise en location d'un logement, tel que défini aux articles 2 et 25-3, est à la charge exclusive du bailleur, à l'exception des honoraires liés aux prestations mentionnées aux deuxième et troisième alinéas du présent I.",
  "Les honoraires des personnes mandatées pour effectuer la visite du preneur, constituer son dossier et rédiger un bail sont partagés entre le bailleur et le preneur. Le montant toutes taxes comprises imputé au preneur pour ces prestations ne peut excéder celui imputé au bailleur et demeure inférieur ou égal à un plafond par mètre carré de surface habitable de la chose louée fixé par voie réglementaire et révisable chaque année, dans des conditions définies par décret. Ces honoraires sont dus à la signature du bail.",
  "Les honoraires des personnes mandatées pour réaliser un état des lieux sont partagés entre le bailleur et le preneur. Le montant toutes taxes comprises imputé au locataire pour cette prestation ne peut excéder celui imputé au bailleur et demeure inférieur ou égal à un plafond par mètre carré de surface habitable de la chose louée fixé par voie réglementaire et révisable chaque année, dans des conditions définies par décret. Ces honoraires sont dus à compter de la réalisation de la prestation.",
];

export const DEPOT_GARANTIE_RAPPEL =
  "Pour la garantie de l'exécution des obligations du Locataire, il est prévu un dépôt de garantie ou une garantie autonome correspondant à un mois de loyer hors charges.";

// ----- Spécifique au bail meublé (articles 25-3 à 25-11 de la loi n° 89-462, "Titre Ier bis" —
// régime distinct du bail nu, décret n° 2015-981 du 31 juillet 2015 pour le mobilier) -----

export const RENOUVELLEMENT_CONGE_MEUBLE = [
  "Le présent contrat de location meublée est conclu pour une durée d'un an, reconduit tacitement à son terme dans les mêmes conditions, sauf congé délivré par l'une des parties (article 25-7 de la loi n° 89-462 du 6 juillet 1989).",
  "Le locataire peut mettre fin au bail à tout moment, moyennant un préavis d'un mois, quelle que soit la zone géographique du logement.",
  "Le bailleur, quant à lui, peut mettre fin au bail à son échéance et après avoir donné congé avec un préavis de trois mois, soit pour reprendre le logement en vue de l'occuper lui-même ou une personne de sa famille, soit pour le vendre, soit pour un motif légitime et sérieux.",
];

export const DEPOT_GARANTIE_RAPPEL_MEUBLE =
  "Pour la garantie de l'exécution des obligations du Locataire, il est prévu un dépôt de garantie correspondant au maximum à deux mois de loyer hors charges (article 25-6 de la loi n° 89-462 du 6 juillet 1989).";

/** Liste officielle et complète, décret n° 2015-981 du 31 juillet 2015 (article 25-4 de la loi
 *  du 6 juillet 1989) — l'absence d'un seul de ces éléments peut entraîner la requalification du
 *  bail meublé en bail nu (durée, dépôt de garantie et conditions de résiliation différents). */
export const MOBILIER_OBLIGATOIRE = [
  "Literie comprenant couette ou couverture",
  "Dispositif d'occultation des fenêtres dans les pièces destinées à servir de chambre",
  "Plaques de cuisson",
  "Four ou four à micro-ondes",
  "Réfrigérateur et congélateur, ou réfrigérateur équipé d'un compartiment à -6°C maximum",
  "Vaisselle nécessaire à la prise des repas",
  "Ustensiles de cuisine",
  "Table et sièges",
  "Étagères de rangement",
  "Luminaires",
  "Matériel d'entretien ménager adapté aux caractéristiques du logement",
];

export const INVENTAIRE_MOBILIER_RAPPEL =
  "Conformément aux articles 25-4 et 25-5 de la loi n° 89-462 du 6 juillet 1989, le logement meublé doit être équipé d'un mobilier en quantité et qualité suffisantes pour permettre au locataire d'y dormir, manger et vivre convenablement, dont la liste minimale est fixée par le décret n° 2015-981 du 31 juillet 2015. Un inventaire et un état détaillé du mobilier sont établis contradictoirement au moment de la remise et de la restitution des clés, selon les mêmes modalités que l'état des lieux.";

export const ART_3_2_ETAT_DES_LIEUX =
  "Conformément à l'article 3-2 de la loi n° 89-462 du 6 juillet 1989, l'état des lieux est établi de façon contradictoire par les parties ou par un tiers mandaté par elles dans les mêmes formes et en autant d'exemplaires que de parties lors de la remise et de la restitution des clés. Il porte sur l'ensemble des locaux et équipements d'usage privatif mentionnés au contrat de bail et dont le locataire a la jouissance exclusive. Le locataire peut demander au bailleur ou à son représentant de compléter l'état des lieux d'entrée dans un délai de dix jours à compter de son établissement. Pendant le premier mois de la période de chauffe, le locataire peut demander que l'état des lieux soit complété par l'état des éléments de chauffage.";
