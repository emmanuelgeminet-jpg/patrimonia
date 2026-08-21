function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      {children}
    </svg>
  );
}

export const navIcons = {
  budget: (
    <Icon>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16" cy="14.5" r="1.3" />
    </Icon>
  ),
  profil: (
    <Icon>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5" />
    </Icon>
  ),
  analyser: (
    <Icon>
      <path d="M11 4a7 7 0 100 14 7 7 0 000-14z" />
      <path d="M21 21l-4.3-4.3" />
    </Icon>
  ),
  travaux: (
    <Icon>
      <path d="M12 2v20M2 12h20" />
    </Icon>
  ),
  carnet: (
    <Icon>
      <path d="M9 3h6l1 3h3v15H5V6h3z" />
      <path d="M9 11h6M9 15h6" />
    </Icon>
  ),
  nouveau: (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  bien: (
    <Icon>
      <rect x="4" y="3" width="16" height="18" />
    </Icon>
  ),
  sci: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </Icon>
  ),
  journal: (
    <Icon>
      <path d="M4 4h16v16H4z" />
      <path d="M4 9h16" />
    </Icon>
  ),
  comptes: (
    <Icon>
      <path d="M3 10h18M6 10V6h12v4M4 10v10h16V10" />
    </Icon>
  ),
  documents: (
    <Icon>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
    </Icon>
  ),
  immeuble: (
    <Icon>
      <rect x="4" y="3" width="16" height="18" />
    </Icon>
  ),
  appartement: (
    <Icon>
      <rect x="7" y="7" width="10" height="10" />
    </Icon>
  ),
  alertes: (
    <Icon>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </Icon>
  ),
};
