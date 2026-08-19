export type VisitItem = {
  label: string;
  note: React.ReactNode;
};

export type VisitTheme = {
  title: string;
  items: VisitItem[];
};

export const visitThemes: VisitTheme[] = [
  {
    title: "Urbanisme et administratif",
    items: [
      { label: "Certificat d'urbanisme", note: "Demandé en mairie — confirme la constructibilité et l'absence de servitude ou projet d'expropriation." },
      { label: "PLU (Plan Local d'Urbanisme)", note: "Zone, règles de hauteur, emprise au sol — utile si extension ou surélévation envisagée." },
      { label: "Zone ABF (Architecte des Bâtiments de France)", note: <>~32 % des logements français en zone protégée (périmètre 500 m autour d&apos;un monument historique, site classé/inscrit). Toute modification extérieure (façade, toiture, menuiseries) nécessite l&apos;avis de l&apos;ABF — <b>avis conforme</b> = s&apos;impose à la mairie, <b>avis simple</b> = consultatif. Délai d&apos;instruction allongé (3-4 mois au lieu de 2).</> },
      { label: "Conformité des travaux déjà réalisés", note: "Vérifier que les travaux visibles (extension, véranda, ouverture) ont bien fait l'objet d'un permis/déclaration préalable et d'une DAACT — un défaut de conformité retombe sur l'acheteur." },
      { label: "Litiges et contentieux en cours", note: "Voisinage, procédures judiciaires, désaccords de bornage — à demander explicitement au vendeur, rarement mentionné spontanément." },
      { label: "Servitudes", note: "Passage, vue, réseaux enterrés traversant la parcelle." },
      { label: "Historique du bien", note: "Depuis quand est-il en vente ? Pourquoi ? Sinistres déclarés en assurance sur les 5 dernières années (dégât des eaux, incendie) ?" },
    ],
  },
  {
    title: "Assainissement",
    items: [
      { label: "Raccordement tout-à-l'égout (collectif) ou individuel", note: <>Si collectif : réseau <b>unitaire</b> (eaux usées + pluviales mélangées) ou <b>séparatif</b> (deux réseaux distincts) — impacte les travaux de raccordement et les eaux de pluie.</> },
      { label: "Diagnostic SPANC (si assainissement individuel)", note: <>Obligatoire, doit dater de <b>moins de 3 ans</b>. Si non-conforme : mise en conformité obligatoire dans <b>l&apos;année suivant l&apos;achat</b> — chiffrer ce coût avant d&apos;acheter.</> },
      { label: "Obligation de raccordement si réseau collectif disponible", note: "Délai légal de 2 ans pour se raccorder si le tout-à-l'égout passe devant la parcelle et que l'installation est encore individuelle." },
    ],
  },
  {
    title: "Électricité",
    items: [
      { label: "Diagnostic électrique", note: <>Obligatoire si installation de <b>plus de 15 ans</b>, valable 3 ans.</> },
      { label: "Compteur Linky", note: "Présence ou non — le remplacement par Enedis est gratuit et le propriétaire ne peut pas s'y opposer légalement dans le cadre du déploiement national." },
      { label: "Tableau électrique aux normes", note: "Disjoncteur différentiel 30 mA, mise à la terre effective, notamment dans les pièces humides (cuisine, salle de bain)." },
      { label: "Puissance souscrite", note: "Adaptée à l'usage prévu (chauffage électrique, nombre de lots)." },
    ],
  },
  {
    title: "Gaz",
    items: [
      { label: "Diagnostic gaz", note: <>Obligatoire si installation de <b>plus de 15 ans</b>, valable 3 ans.</> },
      { label: "Mode d'alimentation", note: "Réseau de ville, citerne, ou cuve enterrée — vérifier l'état et la conformité si cuve." },
    ],
  },
  {
    title: "Chauffage",
    items: [
      { label: "Type de système et âge", note: "Gaz, électrique, fioul, pompe à chaleur, bois — l'âge conditionne le budget de remplacement à anticiper." },
      { label: "Contrat d'entretien annuel", note: "Obligatoire pour les chaudières gaz/fioul — demander les 3 dernières attestations d'entretien." },
      { label: "Cuve à fioul enterrée", note: "Risque de pollution des sols si ancienne ou non conforme — vérifier la réglementation locale et l'état." },
    ],
  },
  {
    title: "DPE — points pris en compte dans le calcul",
    items: [
      { label: "Isolation (murs, toiture, sol, combles)", note: "Poste le plus déterminant dans la note — demander si des travaux d'isolation ont déjà été réalisés (et les justificatifs)." },
      { label: "Vitrage et menuiseries", note: "Simple, double ou triple vitrage ; matériau (bois, PVC, alu) — fort impact sur la note et les déperditions." },
      { label: "Système de chauffage et production d'eau chaude", note: "Type et rendement — un chauffage électrique ancien pénalise fortement la note (méthode 2026 partiellement corrigée pour le chauffage électrique)." },
      { label: "Ventilation", note: "VMC simple flux, double flux, ou absence de ventilation mécanique." },
      { label: "Classe énergétique et conséquences locatives", note: <><b>Interdiction de location</b> : classe G depuis 2025, classe F dès 2028. Un DPE F ou G impose un <b>audit énergétique</b> obligatoire (maison individuelle ou immeuble en monopropriété — donc applicable à votre SCI). Le DPE est <b>opposable</b> depuis 2021 : une erreur engage la responsabilité du vendeur et du diagnostiqueur.</> },
    ],
  },
  {
    title: "Menuiseries et huisseries",
    items: [
      { label: "Type de vitrage", note: "Simple, double, triple — tester l'étanchéité à l'air (courant d'air au niveau des joints)." },
      { label: "Matériau et état", note: "Bois (entretien régulier), PVC (peu d'entretien), alu (déperditions si non rupteur de pont thermique)." },
      { label: "Volets", note: "Fonctionnement, état, motorisation le cas échéant." },
      { label: "⚠ En zone ABF", note: "Le remplacement de menuiseries est soumis à l'avis de l'ABF — matériaux et couleurs souvent imposés (bois plutôt que PVC)." },
    ],
  },
  {
    title: "Toiture — vigilance selon le type de couverture",
    items: [
      { label: "Ardoise naturelle (durée de vie 80-100 ans)", note: "Vérifier la fixation (clous rouillés/oxydés = risque de glissement), les fissures liées au gel/dégel, l'alignement général. Les termites peuvent nicher sous les ardoises (terre fine entre deux ardoises) — signe à ne pas négliger même si moins fréquent que dans la charpente." },
      { label: "Tuile mécanique (durée de vie 30-50 ans)", note: "Cassures, tuiles déplacées ou décalées, mousses et lichens (signe d'humidité stagnante)." },
      { label: "Tuile plate (durée de vie 50-100 ans)", note: "Poids nettement supérieur à la tuile mécanique — vérifier que la charpente est dimensionnée en conséquence." },
      { label: "Toit terrasse", note: "Étanchéité de la membrane, état des évacuations d'eaux pluviales — point de vigilance n°1, source fréquente d'infiltration." },
      { label: "Signes de mouvement de charpente", note: "Ligne de faîtage ondulée, rive qui s'écarte du mur pignon, tuiles/ardoises qui ont bougé sans tempête récente." },
      { label: "Zinguerie et gouttières", note: "Étanchéité des jonctions, état des descentes d'eaux pluviales." },
    ],
  },
  {
    title: "Charpente et parasites du bois",
    items: [
      { label: "État général du bois", note: "Taches sombres, gondolement, bois qui s'effrite ou se ramollit au toucher/à la pointe (s'enfonce = dégradation)." },
      { label: "Insectes xylophages (termites, capricornes, vrillettes)", note: "Petits trous ronds, sciure fine au sol des combles, galeries visibles, bois qui sonne creux." },
      { label: "Diagnostic termites", note: <>Obligatoire uniquement dans les communes couvertes par un <b>arrêté préfectoral</b> (carte sur Géorisques) — validité <b>6 mois seulement</b>, à recaler avec le calendrier de la vente.</> },
      { label: "Mérule", note: <>Champignon lignivore, aspect cotonneux blanc puis brun, odeur de moisi caractéristique — peut détruire une structure en <b>1 à 2 ans</b> en conditions favorables (humidité). Diagnostic généralement informatif (non obligatoire), mais vivement recommandé si signes d&apos;humidité en toiture ou cave.</> },
    ],
  },
  {
    title: "Structure et gros œuvre",
    items: [
      { label: "Fissures en façade", note: "Distinguer une fissure superficielle (fine, stable) d'une fissure structurelle (traverse le mur, s'élargit, en escalier) — particulièrement fréquent en zone argileuse (retrait-gonflement des argiles)." },
      { label: "Humidité", note: "Remontées capillaires en bas de mur, traces d'infiltration au plafond, odeur de moisi en cave/sous-sol." },
      { label: "Diagnostic amiante", note: <>Obligatoire si permis de construire <b>antérieur au 1er juillet 1997</b> — validité illimitée si absence constatée, 3 ans si présence.</> },
      { label: "Diagnostic plomb (CREP)", note: <>Obligatoire si construction <b>antérieure au 1er janvier 1949</b> — validité illimitée si absence, 1 an en cas de vente si présence détectée.</> },
    ],
  },
  {
    title: "Réseaux et environnement",
    items: [
      { label: "Eau", note: "Compteur individuel ou collectif, état du raccordement." },
      { label: "Éligibilité fibre / internet", note: "Critère de plus en plus déterminant pour la location." },
      { label: "État des Risques (ERP)", note: <>Inondation, mouvement de terrain, sismicité, pollution des sols — document obligatoire, validité <b>6 mois</b>.</> },
      { label: "Nuisances", note: "Bruit (route, voie ferrée), proximité d'antennes-relais ou de lignes à haute tension." },
    ],
  },
  {
    title: "Juridique et financier",
    items: [
      { label: "Taxe foncière", note: "Montant actuel et évolution des 3 dernières années." },
      { label: "Titre de propriété et bornage", note: "Vérifier l'absence d'hypothèque en cours non purgée." },
    ],
  },
];
