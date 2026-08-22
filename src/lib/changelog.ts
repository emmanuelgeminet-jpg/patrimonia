export type ChangelogEntry = { date: string; title: string; description: string };

/**
 * Historique des évolutions visibles de l'appli, à la main — pas de génération automatique
 * depuis git (les messages de commit sont techniques, pas destinés à Emmanuel/Pierre). Ajouter
 * une entrée en tête de liste à chaque fonctionnalité livrée.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-08-22",
    title: "Régularisation des charges",
    description: "Saisie détaillée des charges (poste, période couverte), surface/tantièmes par logement, et un écran qui calcule automatiquement la part de charges et le solde de chaque locataire sur une période — plus besoin de le faire à la main.",
  },
  {
    date: "2026-08-21",
    title: "Tests automatisés sur les calculs financiers",
    description: "Premier filet de sécurité automatique (emprunts, amortissements, bilan SCI, TRI, trésorerie...) — a permis de trouver et corriger une coquille sur le bail (71€ mal orthographié en toutes lettres).",
  },
  {
    date: "2026-08-21",
    title: "Export de sauvegarde des données",
    description: "Un bouton sur Mon compte télécharge toutes les données (foyer, SCI, biens, comptabilité, baux, quittances...) en un fichier JSON, à garder de son côté.",
  },
  {
    date: "2026-08-21",
    title: "Photo directe depuis mobile pour les justificatifs",
    description: "L'ajout d'un document (Documents SCI, journal, profil investisseur) propose l'appareil photo en priorité sur mobile, au lieu du sélecteur de fichier générique.",
  },
  {
    date: "2026-08-21",
    title: "Trésorerie prévisionnelle",
    description: "Projection du solde bancaire SCI sur les 12 prochains mois (loyers, mensualités de prêt, charges estimées) sur Vision globale.",
  },
  {
    date: "2026-08-21",
    title: "Écran Alertes",
    description: "Un seul endroit pour voir les loyers en attente, les DPE bientôt expirés et les fins de bail approchantes, sur tout le parc.",
  },
  {
    date: "2026-08-21",
    title: "Révision de loyer",
    description: "Calculatrice de révision (formule IRL) directement sur la fiche de chaque locataire, avec l'historique des révisions passées.",
  },
  {
    date: "2026-08-21",
    title: "Bail meublé",
    description: "Le générateur de bail propose maintenant un type meublé, avec l'inventaire du mobilier obligatoire (les 11 équipements légaux) en annexe.",
  },
  {
    date: "2026-08-21",
    title: "État des lieux interactif",
    description: "Génération d'un état des lieux d'entrée ou de sortie complet (compteurs, clés, pièces) en PDF, pour les logements en SCI comme en nom propre.",
  },
  {
    date: "2026-08-21",
    title: "Bail interactif",
    description: "Un vrai bail conforme, pré-rempli depuis les informations déjà connues, généré en PDF prêt à imprimer et signer.",
  },
  {
    date: "2026-08-21",
    title: "Espace documents pour les biens en nom propre",
    description: "Les mêmes dossiers (baux, états des lieux, diagnostics, assurances...) que pour la SCI, désormais aussi pour un bien détenu en nom propre.",
  },
  {
    date: "2026-08-21",
    title: "Correctif : archive des quittances",
    description: "Un échec silencieux qui empêchait parfois une quittance générée d'apparaître dans l'archive est corrigé — un message s'affiche désormais si jamais ça se reproduit.",
  },
  {
    date: "2026-08-20",
    title: "TRI réel pour l'analyse d'un bien",
    description: "Le taux de rentabilité interne est maintenant calculé avec une vraie hypothèse de revente, réglable par analyse.",
  },
  {
    date: "2026-08-20",
    title: "Appli installable + affichage mobile",
    description: "L'appli s'installe désormais sur l'écran d'accueil du téléphone, et tous les écrans s'adaptent correctement aux petits écrans.",
  },
  {
    date: "2026-08-20",
    title: "Bilan comptable SCI réel",
    description: "Compte de résultat et bilan calculés en direct depuis le journal (amortissements et emprunts inclus), plus besoin d'attendre le comptable pour une estimation.",
  },
];
