export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof import("./nav-icons").navIcons;
  variant?: "sub" | "sub2";
  brick?: boolean;
};

export type NavGroup = {
  groupLabel?: string;
  subgroupLabel?: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    groupLabel: "Mon budget",
    items: [{ href: "/mon-budget", label: "Mon budget", icon: "budget" }],
  },
  {
    groupLabel: "Investir",
    items: [
      { href: "/investir/profil", label: "Profil investisseur", icon: "profil", brick: true },
      { href: "/investir/analyser", label: "Analyse d'un bien", icon: "analyser", brick: true },
      { href: "/investir/travaux", label: "Estimatif des travaux", icon: "travaux", brick: true, variant: "sub" },
      { href: "/investir/carnet", label: "Carnet de visite", icon: "carnet", brick: true, variant: "sub" },
    ],
  },
  {
    groupLabel: "Gestion immobilière",
    items: [
      { href: "/gerer/alertes", label: "Alertes", icon: "alertes" },
      { href: "/gerer/nouveau-bien", label: "Rentrer un nouveau bien", icon: "nouveau" },
    ],
  },
];

// Le sous-groupe "Biens propres" (un lien par bien détenu en nom propre) et le nom affiché
// pour la SCI sont propres à chaque foyer — construits dynamiquement dans Sidebar.tsx à
// partir de vraies données, pas listés ici en dur.
export const sciNavItems: NavItem[] = [
  { href: "/gerer/sci/journal", label: "Journal comptable", icon: "journal", variant: "sub2" },
  { href: "/gerer/sci/comptes-courants", label: "Comptes courants", icon: "comptes", variant: "sub2" },
  { href: "/gerer/sci/documents", label: "Documents", icon: "documents", variant: "sub2" },
  { href: "/gerer/sci/immeuble", label: "Immeuble", icon: "immeuble", variant: "sub2" },
  { href: "/gerer/sci/appartements", label: "Logements", icon: "appartement", variant: "sub2" },
];
