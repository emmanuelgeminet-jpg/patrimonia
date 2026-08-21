-- =====================================================================
-- PATRIMONIA — schéma de base de données (Phase 1)
-- À exécuter une fois dans Supabase : Dashboard > SQL Editor > New query
-- Colle tout ce fichier, puis clique "Run".
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- 1. FOYERS ET COMPTES UTILISATEURS
-- =====================================================================

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Un profil par utilisateur connecté (auth.users), rattaché à un foyer.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete restrict,
  display_name text,
  -- Copie de auth.users.email au moment de l'inscription (voir handle_new_user) — auth.users
  -- n'est pas requêtable depuis le client, donc dupliquée ici pour que l'admin puisse voir qui
  -- s'est inscrit sans accès à la base d'authentification elle-même.
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 2. SCI
-- =====================================================================

create table if not exists sci (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  siren text,
  -- Adresse du siège social — mention obligatoire du bailleur sur une quittance de loyer
  -- (article 21 de la loi du 6 juillet 1989).
  adresse text,
  -- Nom du gérant qui signe pour la SCI (une SCI signe par son représentant légal, pas par
  -- un associé quelconque — voir quittance.ts, bloc signature "Pour la SCI ..., le Gérant").
  gerant_nom text,
  -- Habillage visuel de la quittance PDF, propre à cette SCI (voir src/lib/quittance.ts) —
  -- vide/null = écusson générique (monogramme). Une donnée, pas du code câblé sur un nom de
  -- SCI en particulier : n'importe quelle SCI pourrait un jour avoir son propre style ici.
  logo_style text,
  capital_social_cents bigint,
  date_creation date,
  regime_fiscal text,
  -- Solde bancaire connu à une date de référence (reprise de la compta existante,
  -- ex. un fichier Excel tenu avant l'appli) — sert de base au calcul du solde
  -- courant dans le journal comptable, sans devoir ressaisir tout l'historique.
  solde_ouverture_cents bigint not null default 0,
  solde_ouverture_date date,
  -- Résultat comptable cumulé (certifié par le comptable) à la date solde_ouverture_date —
  -- même principe de reprise que solde_ouverture_cents, pour ne pas devoir reconstruire le
  -- détail des exercices passés. Le compte de résultat calculé par l'appli part de là.
  resultat_reporte_cents bigint not null default 0,
  created_at timestamptz not null default now()
);

-- Répartition des parts de la SCI entre foyers associés.
create table if not exists sci_associes (
  id uuid primary key default gen_random_uuid(),
  sci_id uuid not null references sci(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  parts integer not null default 0,
  pourcentage numeric(5,2),
  -- Solde du compte courant d'associé à la date de reprise (voir sci.solde_ouverture_date).
  solde_ouverture_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (sci_id, household_id)
);

-- =====================================================================
-- 3. BIENS, LOTS, LOCATAIRES
-- =====================================================================

create table if not exists biens (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('immeuble', 'maison', 'appartement_isole', 'garage', 'local_commercial')),
  owner_type text not null check (owner_type in ('propre', 'sci')),
  sci_id uuid references sci(id) on delete restrict,
  household_id uuid references households(id) on delete restrict,
  adresse text not null,
  code_postal text,
  ville text,
  date_acquisition date,
  prix_acquisition_cents bigint,
  nombre_lots integer,
  mode_detention text,
  mode_location text,
  regime_fiscal text,
  dpe_classe text check (dpe_classe in ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  dpe_date date,
  monopropriete boolean not null default true,
  numero_immatriculation_copropriete text,
  assurance_pno_compagnie text,
  assurance_pno_police text,
  -- Financement et charges d'un bien propre (hors SCI, qui a son propre journal comptable) :
  -- suivi simple, saisi à la main.
  credit_mensualite_cents bigint,
  assurance_mensuelle_cents bigint,
  charges_copro_annuelles_cents bigint,
  notes text,
  created_at timestamptz not null default now(),
  constraint bien_owner_coherent check (
    (owner_type = 'sci' and sci_id is not null and household_id is null) or
    (owner_type = 'propre' and household_id is not null and sci_id is null)
  )
);

create table if not exists lots (
  id uuid primary key default gen_random_uuid(),
  bien_id uuid not null references biens(id) on delete cascade,
  nom text not null,
  surface_m2 numeric(6,2),
  -- Estimation manuelle de la valeur vénale du lot — sert uniquement à calculer une
  -- rentabilité par appartement (loyers / valeur), pas de source officielle branchée.
  valeur_venale_cents bigint,
  created_at timestamptz not null default now()
);

create table if not exists locataires (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  nom text not null,
  email text,
  date_entree date,
  date_sortie date,
  loyer_hc_cents bigint not null default 0,
  charges_cents bigint not null default 0,
  depot_garantie_cents bigint,
  depot_garantie_date date,
  depot_garantie_mode text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 4. COMPTABILITÉ SCI
-- =====================================================================

-- Prêts bancaires de la SCI : conditions d'origine, saisies une fois — le capital restant
-- dû et la part d'intérêts/capital d'une mensualité à une date donnée se recalculent
-- ensuite tout seuls (formule d'annuité), pas besoin de reprise séparée.
create table if not exists sci_emprunts (
  id uuid primary key default gen_random_uuid(),
  sci_id uuid not null references sci(id) on delete cascade,
  bien_id uuid references biens(id) on delete set null,
  libelle text not null,
  capital_emprunte_cents bigint not null,
  taux_pct numeric(5,3) not null,
  duree_mois integer not null,
  date_debut date not null,
  -- Montant informatif de l'assurance emprunteur mensuelle — à saisir comme une écriture
  -- de charge à part dans le journal (pas rattachée à emprunt_id), ce champ ne sert qu'à
  -- vérifier que le bon montant est bien saisi chaque mois.
  assurance_emprunteur_cents bigint,
  created_at timestamptz not null default now()
);

-- Immobilisations amortissables de la SCI (un immeuble, ou un composant — toiture, gros
-- œuvre... si Emmanuel veut amortir par composants, plusieurs lignes par bien_id).
create table if not exists sci_immobilisations (
  id uuid primary key default gen_random_uuid(),
  sci_id uuid not null references sci(id) on delete cascade,
  bien_id uuid references biens(id) on delete set null,
  libelle text not null,
  valeur_amortissable_cents bigint not null,
  duree_annees numeric(5,2) not null,
  date_mise_en_service date not null,
  created_at timestamptz not null default now()
);

create table if not exists journal_ecritures (
  id uuid primary key default gen_random_uuid(),
  sci_id uuid not null references sci(id) on delete cascade,
  date date not null,
  type text not null check (type in ('encaissement', 'decaissement')),
  montant_cents bigint not null,
  libelle text not null,
  mode_paiement text,
  bien_id uuid references biens(id) on delete set null,
  lot_id uuid references lots(id) on delete set null,
  commentaire text,
  justificatif_path text,
  -- Catégorie de charge (prêt, taxe foncière, entretien...), pour la répartition par
  -- catégorie sur la fiche immeuble — optionnel, non contraint en base (liste proposée
  -- côté formulaire pour rester cohérente, mais on ne bloque pas une saisie différente).
  categorie_charge text,
  -- 'banque_sci' : mouvement réel sur le compte bancaire de la SCI (compte dans le solde
  -- bancaire). 'avance_associe' : payé personnellement par un associé (ex. CB perso) —
  -- n'apparaît pas sur le relevé de la SCI, donc exclu du solde bancaire, mais reste une
  -- vraie dépense de la SCI et alimente automatiquement son compte courant.
  financement text not null default 'banque_sci' check (financement in ('banque_sci', 'avance_associe')),
  -- Si renseigné, cette écriture alimente aussi le suivi des comptes courants d'associés
  -- (apport/avance/remboursement) pour le foyer désigné — voir comptes_courants_mouvements.journal_ecriture_id.
  associe_household_id uuid references households(id) on delete set null,
  associe_mouvement_type text check (associe_mouvement_type in ('apport', 'avance', 'remboursement')),
  -- Si renseigné, cette écriture EST la mensualité d'un emprunt SCI : sa part d'intérêts
  -- est comptée comme charge dans le compte de résultat (calculée depuis sci_emprunts,
  -- pas depuis ce montant), sa part de capital réduit juste la dette — donc le montant
  -- de cette écriture est exclu des charges "cash" pour ne pas compter deux fois.
  emprunt_id uuid references sci_emprunts(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ecriture_associe_coherent check (
    (associe_household_id is null and associe_mouvement_type is null) or
    (associe_household_id is not null and associe_mouvement_type is not null and (
      (financement = 'avance_associe' and associe_mouvement_type = 'avance') or
      (financement = 'banque_sci' and associe_mouvement_type in ('apport', 'remboursement'))
    ))
  ),
  constraint ecriture_emprunt_coherent check (
    emprunt_id is null or
    (financement = 'banque_sci' and type = 'decaissement' and associe_mouvement_type is null)
  )
);

create table if not exists comptes_courants_mouvements (
  id uuid primary key default gen_random_uuid(),
  sci_id uuid not null references sci(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  date date not null,
  type text not null check (type in ('apport', 'avance', 'remboursement')),
  montant_cents bigint not null,
  commentaire text,
  -- Renseigné quand ce mouvement a été créé automatiquement depuis une écriture du
  -- journal comptable ; supprimer l'écriture supprime alors ce mouvement avec elle.
  journal_ecriture_id uuid references journal_ecritures(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 5. MON BUDGET (foyer)
-- =====================================================================

create table if not exists budget_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  nom text not null,
  groupe text check (groupe in ('besoin', 'envie', 'epargne')),
  created_at timestamptz not null default now()
);

create table if not exists budget_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  date date not null,
  libelle text not null,
  montant_cents bigint not null,
  categorie_id uuid references budget_categories(id) on delete set null,
  mois_import text,
  source_fichier text,
  -- Étiquettes libres, en plus des catégories — pour re-regrouper des transactions selon
  -- ses propres critères (ex. "voyage été 2026", "à rembourser").
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 6. DOCUMENTS (métadonnées — fichiers réels dans Supabase Storage)
-- =====================================================================

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  dossier text not null,
  nom_fichier text not null,
  storage_path text not null,
  taille_octets bigint,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 6bis. SUGGESTIONS (boîte à idées — visible uniquement par les admins)
-- =====================================================================

create table if not exists feedback_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 7. PROFIL INVESTISSEUR (foyer)
-- =====================================================================

create table if not exists profil_investisseur (
  household_id uuid primary key references households(id) on delete cascade,
  objectif_libelle text,
  objectif_montant_cents bigint,
  composition_foyer text,
  regime_matrimonial text,
  donation_entre_epoux boolean,
  nb_enfants integer,
  ages_conjoints text,
  situation_professionnelle text,
  horizon_investissement text,
  objectif_principal text,
  appetence_risque text,
  capacite_apport text,
  epargne_precaution_cents bigint,
  revenu_salaire_1_cents bigint default 0,
  revenu_salaire_2_cents bigint default 0,
  revenu_independant_cents bigint default 0,
  revenu_foncier_cents bigint default 0,
  revenu_dividendes_cents bigint default 0,
  revenu_pensions_cents bigint default 0,
  revenu_caf_cents bigint default 0,
  revenu_autre_cents bigint default 0,
  residence_principale_valeur_cents bigint default 0,
  residence_secondaire_valeur_cents bigint default 0,
  biens_locatifs_valeur_cents bigint default 0,
  scpi_valeur_cents bigint default 0,
  -- Loyer mensuel visé pour un futur investissement locatif — sert uniquement à
  -- calculer la capacité d'emprunt "investissement locatif" (règle bancaire des
  -- 70 % : le loyer futur compte pour 70 % de sa valeur dans le calcul du taux
  -- d'endettement), distincte de la capacité d'emprunt "résidence principale".
  loyer_vise_locatif_cents bigint,
  updated_at timestamptz not null default now()
);

create table if not exists profil_charges_lignes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  categorie text not null,
  libelle text not null,
  montant_cents bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists profil_patrimoine_financier_lignes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  categorie text not null check (categorie in ('livret', 'pea', 'assurance_vie', 'per', 'compte_courant', 'autre')),
  etablissement text,
  type_produit text,
  titulaire text,
  valeur_cents bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists profil_emprunts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  objet text not null,
  capital_emprunte_cents bigint,
  taux_pct numeric(5,3),
  duree_mois integer,
  mensualite_cents bigint,
  crd_cents bigint,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 8. INVESTIR — ANALYSE D'UN BIEN AVANT ACHAT
-- =====================================================================

create table if not exists analyses_biens (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  adresse text not null,
  statut text not null default 'a_l_etude' check (statut in ('a_l_etude', 'abandonne', 'achete')),
  prix_annonce_cents bigint,
  prix_offre_cents bigint,
  frais_notaire_cents bigint,
  frais_agence_cents bigint,
  frais_dossier_garantie_cents bigint,
  travaux_estimes_cents bigint,
  apport_cents bigint,
  montant_emprunte_cents bigint,
  taux_pct numeric(5,3),
  duree_annees integer,
  assurance_emprunteur_cents bigint,
  taxe_fonciere_cents bigint,
  charges_copro_cents bigint,
  assurance_pno_cents bigint,
  charges_annuelles_cents bigint,
  surface_m2 numeric(6,2),
  -- Hypothèses de marché ajustables, appliquées aux loyers HC pour affiner la rentabilité
  -- (courant dans les grilles d'analyse professionnelles) — laissées à 0 par défaut, donc
  -- sans effet tant qu'elles ne sont pas renseignées.
  vacance_locative_pct numeric(5,2),
  gli_pct numeric(5,2),
  frais_gestion_pct numeric(5,2),
  -- Hypothèses pour le TRI (taux de rentabilité interne) à la revente — voir computeTri
  -- dans src/lib/analyse-bien.ts. Optionnelles : sans durée de détention renseignée, le TRI
  -- ne se calcule simplement pas (les autres indicateurs restent inchangés).
  duree_detention_annees integer,
  taux_valorisation_pct numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists analyses_biens_lots (
  id uuid primary key default gen_random_uuid(),
  analyse_id uuid not null references analyses_biens(id) on delete cascade,
  nom text not null,
  loyer_hc_cents bigint not null default 0,
  charges_cents bigint not null default 0
);

create table if not exists devis_travaux (
  id uuid primary key default gen_random_uuid(),
  analyse_id uuid references analyses_biens(id) on delete cascade,
  bien_id uuid references biens(id) on delete cascade,
  piece text not null,
  type_travaux text not null,
  surface_m2 numeric(6,2),
  prix_m2_cents bigint,
  sous_total_cents bigint not null,
  created_at timestamptz not null default now(),
  constraint devis_travaux_cible check (analyse_id is not null or bien_id is not null)
);

create table if not exists carnet_visite_reponses (
  id uuid primary key default gen_random_uuid(),
  analyse_id uuid references analyses_biens(id) on delete cascade,
  bien_id uuid references biens(id) on delete cascade,
  theme text not null,
  item_key text not null,
  checked boolean not null default false,
  note text,
  updated_at timestamptz not null default now(),
  constraint carnet_visite_cible check (analyse_id is not null or bien_id is not null),
  unique (analyse_id, bien_id, theme, item_key)
);

-- =====================================================================
-- 9. INDEX UTILES
-- =====================================================================

create index if not exists idx_biens_sci on biens(sci_id);
create index if not exists idx_biens_household on biens(household_id);
create index if not exists idx_lots_bien on lots(bien_id);
create index if not exists idx_locataires_lot on locataires(lot_id);
create index if not exists idx_journal_sci_date on journal_ecritures(sci_id, date);
create index if not exists idx_comptes_courants_sci on comptes_courants_mouvements(sci_id);
create index if not exists idx_budget_household_date on budget_transactions(household_id, date);
create index if not exists idx_documents_entity on documents(entity_type, entity_id);
create index if not exists idx_analyses_household on analyses_biens(household_id);

-- =====================================================================
-- 10. CRÉATION AUTOMATIQUE DU PROFIL À L'INSCRIPTION
-- Chaque inscription crée son propre foyer indépendant par défaut —
-- l'app doit rester utilisable par n'importe qui, pas seulement par le
-- foyer GEMINET. Pour rejoindre un foyer existant (ex : conjoint), le
-- formulaire d'inscription accepte un code d'invitation (l'identifiant
-- du foyer à rejoindre) transmis via les métadonnées utilisateur.
-- =====================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_household_id uuid;
  invite_id text;
  new_display_name text;
begin
  new_display_name := coalesce(new.raw_user_meta_data->>'display_name', new.email);
  invite_id := new.raw_user_meta_data->>'invite_household_id';

  if invite_id is not null and invite_id ~ '^[0-9a-fA-F-]{36}$' then
    begin
      select id into target_household_id from households where id = invite_id::uuid;
    exception when others then
      target_household_id := null;
    end;
  end if;

  if target_household_id is null then
    insert into households (name) values (new_display_name || ' (foyer)') returning id into target_household_id;
  end if;

  insert into profiles (id, household_id, display_name, email)
  values (new.id, target_household_id, new_display_name, new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- 11. SÉCURITÉ (Row Level Security)
-- Règle générale : un utilisateur ne voit / modifie que les données de
-- son propre foyer, ou de la SCI dont son foyer est associé.
-- =====================================================================

create or replace function is_household_member(hh_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where profiles.id = auth.uid() and profiles.household_id = hh_id
  );
$$;

create or replace function is_sci_member(s_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from profiles
    join sci_associes on sci_associes.household_id = profiles.household_id
    where profiles.id = auth.uid() and sci_associes.sci_id = s_id
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Un foyer déjà associé d'une SCI peut générer un lien d'invitation pour un
-- AUTRE foyer associé de cette même SCI, mais seulement si ce foyer n'a
-- encore aucun compte utilisateur (cas typique : le foyer a été créé lors
-- de la mise en place de la SCI, en attendant que la personne concernée
-- crée elle-même son compte). Dès qu'un foyer a au moins un compte actif,
-- seul ce foyer peut générer son propre lien (depuis Mon compte) — évite
-- qu'un associé puisse à volonté réinviter n'importe qui dans le foyer
-- d'un autre.
create or replace function can_invite_sci_associe(target_household_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select
    exists (
      select 1
      from sci_associes mine
      join sci_associes theirs on theirs.sci_id = mine.sci_id
      join profiles on profiles.household_id = mine.household_id
      where profiles.id = auth.uid()
        and theirs.household_id = target_household_id
    )
    and not exists (
      select 1 from profiles where profiles.household_id = target_household_id
    );
$$;

-- Crée une SCI et rattache le foyer appelant comme premier associé — nécessaire en
-- security definer car la RLS de `sci`/`sci_associes` exige déjà d'être membre pour
-- insérer (poule et œuf : impossible d'être membre d'une SCI qui n'existe pas encore).
-- Un foyer déjà associé d'une SCI ne peut pas en créer une deuxième (l'appli suppose
-- un foyer → au plus une SCI, cf. tous les .limit(1) côté lecture).
create or replace function create_sci(
  p_nom text,
  p_siren text,
  p_capital_social_cents bigint,
  p_date_creation date,
  p_regime_fiscal text,
  p_mes_parts integer,
  p_mon_pourcentage numeric
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_household_id uuid;
  v_sci_id uuid;
begin
  select household_id into v_household_id from profiles where id = auth.uid();
  if v_household_id is null then
    raise exception 'Foyer introuvable.';
  end if;
  if exists (select 1 from sci_associes where household_id = v_household_id) then
    raise exception 'Ton foyer est déjà associé à une SCI.';
  end if;

  insert into sci (name, siren, capital_social_cents, date_creation, regime_fiscal)
  values (p_nom, p_siren, p_capital_social_cents, p_date_creation, p_regime_fiscal)
  returning id into v_sci_id;

  insert into sci_associes (sci_id, household_id, parts, pourcentage)
  values (v_sci_id, v_household_id, p_mes_parts, p_mon_pourcentage);

  return v_sci_id;
end;
$$;

-- Associe un foyer QUI A DÉJÀ UN COMPTE (cas réel : l'associé s'est inscrit normalement
-- avant que le foyer qui gère la SCI ne pense à générer un lien d'invitation) à une SCI
-- existante, retrouvé par email — profiles.email n'est lisible par personne d'autre que
-- son propriétaire ou un admin (RLS), donc le lookup doit se faire ici, en security
-- definer, plutôt que côté client. Le foyer retrouvé garde son budget/biens propres privés
-- — devenir associé d'une SCI ne fusionne rien, juste une ligne sci_associes de plus.
create or replace function add_existing_household_to_sci(
  p_sci_id uuid,
  p_email text,
  p_parts integer,
  p_pourcentage numeric
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if not is_sci_member(p_sci_id) then
    raise exception 'Tu n''es pas associé de cette SCI.';
  end if;

  select household_id into v_household_id
  from profiles
  where lower(email) = lower(p_email)
  limit 1;

  if v_household_id is null then
    raise exception 'Aucun compte trouvé avec cet email.';
  end if;

  if exists (select 1 from sci_associes where sci_id = p_sci_id and household_id = v_household_id) then
    raise exception 'Ce foyer est déjà associé à cette SCI.';
  end if;

  insert into sci_associes (sci_id, household_id, parts, pourcentage)
  values (p_sci_id, v_household_id, p_parts, p_pourcentage);

  return v_household_id;
end;
$$;

-- Ajoute un nouvel associé (nouveau foyer, pas encore de compte) à une SCI existante —
-- même raison security definer que ci-dessus pour la création du foyer. Le nouveau
-- foyer créé ici a 0 profil, donc can_invite_sci_associe le rend immédiatement invitable.
create or replace function add_sci_associe(
  p_sci_id uuid,
  p_nom_foyer text,
  p_parts integer,
  p_pourcentage numeric
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_household_id uuid;
begin
  if not is_sci_member(p_sci_id) then
    raise exception 'Tu n''es pas associé de cette SCI.';
  end if;

  insert into households (name) values (p_nom_foyer) returning id into v_new_household_id;
  insert into sci_associes (sci_id, household_id, parts, pourcentage)
  values (p_sci_id, v_new_household_id, p_parts, p_pourcentage);

  return v_new_household_id;
end;
$$;

alter table households enable row level security;
alter table profiles enable row level security;
alter table sci enable row level security;
alter table sci_associes enable row level security;
alter table biens enable row level security;
alter table lots enable row level security;
alter table locataires enable row level security;
alter table sci_emprunts enable row level security;
alter table sci_immobilisations enable row level security;
alter table journal_ecritures enable row level security;
alter table comptes_courants_mouvements enable row level security;
alter table budget_categories enable row level security;
alter table budget_transactions enable row level security;
alter table documents enable row level security;
alter table feedback_messages enable row level security;
alter table profil_investisseur enable row level security;
alter table profil_charges_lignes enable row level security;
alter table profil_patrimoine_financier_lignes enable row level security;
alter table profil_emprunts enable row level security;
alter table analyses_biens enable row level security;
alter table analyses_biens_lots enable row level security;
alter table devis_travaux enable row level security;
alter table carnet_visite_reponses enable row level security;

drop policy if exists "own household" on households;
create policy "own household" on households for all using (is_household_member(id)) with check (is_household_member(id));

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for select using (id = auth.uid());

drop policy if exists "admin sees all profiles" on profiles;
create policy "admin sees all profiles" on profiles for select using (is_admin());

drop policy if exists "admin sees all households" on households;
create policy "admin sees all households" on households for select using (is_admin());

drop policy if exists "sci of my household" on sci;
create policy "sci of my household" on sci for all using (is_sci_member(id)) with check (is_sci_member(id));

drop policy if exists "sci_associes of my sci" on sci_associes;
create policy "sci_associes of my sci" on sci_associes for all using (is_sci_member(sci_id)) with check (is_sci_member(sci_id));

drop policy if exists "biens visibles" on biens;
create policy "biens visibles" on biens for all using (
  (owner_type = 'sci' and is_sci_member(sci_id)) or
  (owner_type = 'propre' and is_household_member(household_id))
) with check (
  (owner_type = 'sci' and is_sci_member(sci_id)) or
  (owner_type = 'propre' and is_household_member(household_id))
);

drop policy if exists "lots visibles" on lots;
create policy "lots visibles" on lots for all using (
  exists (
    select 1 from biens
    where biens.id = lots.bien_id
    and ((biens.owner_type = 'sci' and is_sci_member(biens.sci_id)) or
         (biens.owner_type = 'propre' and is_household_member(biens.household_id)))
  )
);

drop policy if exists "locataires visibles" on locataires;
create policy "locataires visibles" on locataires for all using (
  exists (
    select 1 from lots join biens on biens.id = lots.bien_id
    where lots.id = locataires.lot_id
    and ((biens.owner_type = 'sci' and is_sci_member(biens.sci_id)) or
         (biens.owner_type = 'propre' and is_household_member(biens.household_id)))
  )
);

drop policy if exists "emprunts de ma sci" on sci_emprunts;
create policy "emprunts de ma sci" on sci_emprunts for all using (is_sci_member(sci_id)) with check (is_sci_member(sci_id));

drop policy if exists "immobilisations de ma sci" on sci_immobilisations;
create policy "immobilisations de ma sci" on sci_immobilisations for all using (is_sci_member(sci_id)) with check (is_sci_member(sci_id));

drop policy if exists "journal de ma sci" on journal_ecritures;
create policy "journal de ma sci" on journal_ecritures for all using (is_sci_member(sci_id)) with check (is_sci_member(sci_id));

drop policy if exists "comptes courants de ma sci" on comptes_courants_mouvements;
create policy "comptes courants de ma sci" on comptes_courants_mouvements for all using (is_sci_member(sci_id)) with check (is_sci_member(sci_id));

drop policy if exists "categories de mon foyer" on budget_categories;
create policy "categories de mon foyer" on budget_categories for all using (household_id is null or is_household_member(household_id)) with check (is_household_member(household_id));

drop policy if exists "budget de mon foyer" on budget_transactions;
create policy "budget de mon foyer" on budget_transactions for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- Un document est visible s'il appartient à une entité (foyer, SCI, bien,
-- lot) dont l'utilisateur est membre — entity_type identifie la table
-- cible, entity_id la ligne précise.
drop policy if exists "documents accessibles" on documents;
create policy "documents accessibles" on documents for all using (
  (entity_type = 'household' and is_household_member(entity_id)) or
  (entity_type = 'sci' and is_sci_member(entity_id)) or
  (entity_type = 'emprunt' and exists (
    select 1 from profil_emprunts
    where profil_emprunts.id = documents.entity_id and is_household_member(profil_emprunts.household_id)
  )) or
  (entity_type = 'patrimoine_ligne' and exists (
    select 1 from profil_patrimoine_financier_lignes
    where profil_patrimoine_financier_lignes.id = documents.entity_id and is_household_member(profil_patrimoine_financier_lignes.household_id)
  )) or
  (entity_type = 'bien' and exists (
    select 1 from biens
    where biens.id = documents.entity_id
    and ((biens.owner_type = 'sci' and is_sci_member(biens.sci_id)) or (biens.owner_type = 'propre' and is_household_member(biens.household_id)))
  )) or
  (entity_type = 'lot' and exists (
    select 1 from lots join biens on biens.id = lots.bien_id
    where lots.id = documents.entity_id
    and ((biens.owner_type = 'sci' and is_sci_member(biens.sci_id)) or (biens.owner_type = 'propre' and is_household_member(biens.household_id)))
  ))
) with check (
  (entity_type = 'household' and is_household_member(entity_id)) or
  (entity_type = 'sci' and is_sci_member(entity_id)) or
  (entity_type = 'emprunt' and exists (
    select 1 from profil_emprunts
    where profil_emprunts.id = documents.entity_id and is_household_member(profil_emprunts.household_id)
  )) or
  (entity_type = 'patrimoine_ligne' and exists (
    select 1 from profil_patrimoine_financier_lignes
    where profil_patrimoine_financier_lignes.id = documents.entity_id and is_household_member(profil_patrimoine_financier_lignes.household_id)
  )) or
  (entity_type = 'bien' and exists (
    select 1 from biens
    where biens.id = documents.entity_id
    and ((biens.owner_type = 'sci' and is_sci_member(biens.sci_id)) or (biens.owner_type = 'propre' and is_household_member(biens.household_id)))
  )) or
  (entity_type = 'lot' and exists (
    select 1 from lots join biens on biens.id = lots.bien_id
    where lots.id = documents.entity_id
    and ((biens.owner_type = 'sci' and is_sci_member(biens.sci_id)) or (biens.owner_type = 'propre' and is_household_member(biens.household_id)))
  ))
);

-- =====================================================================
-- 6ter. STOCKAGE DES FICHIERS (bucket Supabase Storage "documents")
-- =====================================================================
-- Bucket privé : chaque fichier est rangé sous hh/{household_id}/... (documents
-- d'un foyer) ou sci/{sci_id}/... (documents d'une SCI, ex. justificatifs du
-- journal comptable) — le premier dossier du chemin indique lequel des deux.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents bucket - foyer" on storage.objects;
drop policy if exists "documents bucket - acces" on storage.objects;
create policy "documents bucket - acces" on storage.objects for all using (
  bucket_id = 'documents' and (
    ((storage.foldername(name))[1] = 'hh' and is_household_member(((storage.foldername(name))[2])::uuid)) or
    ((storage.foldername(name))[1] = 'sci' and is_sci_member(((storage.foldername(name))[2])::uuid))
  )
) with check (
  bucket_id = 'documents' and (
    ((storage.foldername(name))[1] = 'hh' and is_household_member(((storage.foldername(name))[2])::uuid)) or
    ((storage.foldername(name))[1] = 'sci' and is_sci_member(((storage.foldername(name))[2])::uuid))
  )
);

-- Chacun voit ses propres suggestions (confirmation d'envoi) ; seuls les
-- comptes administrateurs voient la boîte à idées complète.
drop policy if exists "voir ses suggestions ou tout si admin" on feedback_messages;
create policy "voir ses suggestions ou tout si admin" on feedback_messages for select using (
  author_id = auth.uid() or is_admin()
);

drop policy if exists "envoyer une suggestion" on feedback_messages;
create policy "envoyer une suggestion" on feedback_messages for insert with check (author_id = auth.uid());

drop policy if exists "profil de mon foyer" on profil_investisseur;
create policy "profil de mon foyer" on profil_investisseur for all using (is_household_member(household_id)) with check (is_household_member(household_id));

drop policy if exists "charges de mon foyer" on profil_charges_lignes;
create policy "charges de mon foyer" on profil_charges_lignes for all using (is_household_member(household_id)) with check (is_household_member(household_id));

drop policy if exists "patrimoine financier de mon foyer" on profil_patrimoine_financier_lignes;
create policy "patrimoine financier de mon foyer" on profil_patrimoine_financier_lignes for all using (is_household_member(household_id)) with check (is_household_member(household_id));

drop policy if exists "emprunts de mon foyer" on profil_emprunts;
create policy "emprunts de mon foyer" on profil_emprunts for all using (is_household_member(household_id)) with check (is_household_member(household_id));

drop policy if exists "analyses de mon foyer" on analyses_biens;
create policy "analyses de mon foyer" on analyses_biens for all using (is_household_member(household_id)) with check (is_household_member(household_id));

drop policy if exists "lots d'analyse de mon foyer" on analyses_biens_lots;
create policy "lots d'analyse de mon foyer" on analyses_biens_lots for all using (
  exists (select 1 from analyses_biens where analyses_biens.id = analyses_biens_lots.analyse_id and is_household_member(analyses_biens.household_id))
);

drop policy if exists "devis visibles" on devis_travaux;
create policy "devis visibles" on devis_travaux for all using (
  (analyse_id is not null and exists (select 1 from analyses_biens where analyses_biens.id = devis_travaux.analyse_id and is_household_member(analyses_biens.household_id)))
  or
  (bien_id is not null and exists (
    select 1 from biens
    where biens.id = devis_travaux.bien_id
    and ((biens.owner_type = 'sci' and is_sci_member(biens.sci_id)) or (biens.owner_type = 'propre' and is_household_member(biens.household_id)))
  ))
);

drop policy if exists "carnet de visite visible" on carnet_visite_reponses;
create policy "carnet de visite visible" on carnet_visite_reponses for all using (
  (analyse_id is not null and exists (select 1 from analyses_biens where analyses_biens.id = carnet_visite_reponses.analyse_id and is_household_member(analyses_biens.household_id)))
  or
  (bien_id is not null and exists (
    select 1 from biens
    where biens.id = carnet_visite_reponses.bien_id
    and ((biens.owner_type = 'sci' and is_sci_member(biens.sci_id)) or (biens.owner_type = 'propre' and is_household_member(biens.household_id)))
  ))
);

-- =====================================================================
-- 12. DONNÉES DE RÉFÉRENCE (structure réelle du patrimoine — pas de
-- données financières/comptables, celles-ci seront saisies via les
-- écrans une fois branchés)
-- =====================================================================

do $$
declare
  hh_geminet uuid;
  hh_papin uuid;
  the_sci uuid;
  immeuble_id uuid;
begin
  select id into hh_geminet from households where name = 'Foyer GEMINET';
  if hh_geminet is null then
    insert into households (name) values ('Foyer GEMINET') returning id into hh_geminet;
  end if;

  select id into hh_papin from households where name = 'Foyer PAPIN';
  if hh_papin is null then
    insert into households (name) values ('Foyer PAPIN') returning id into hh_papin;
  end if;

  select id into the_sci from sci where name = 'Les Bons Gascons';
  if the_sci is null then
    insert into sci (name, date_creation, regime_fiscal)
    values ('Les Bons Gascons', '2024-06-28', 'IS')
    returning id into the_sci;
  end if;

  insert into sci_associes (sci_id, household_id, parts, pourcentage)
  values (the_sci, hh_geminet, 50, 50.00)
  on conflict (sci_id, household_id) do nothing;

  insert into sci_associes (sci_id, household_id, parts, pourcentage)
  values (the_sci, hh_papin, 50, 50.00)
  on conflict (sci_id, household_id) do nothing;

  select id into immeuble_id from biens where adresse = '13 rue des Cordeliers' and sci_id = the_sci;
  if immeuble_id is null then
    insert into biens (type, owner_type, sci_id, adresse, code_postal, ville, nombre_lots)
    values ('immeuble', 'sci', the_sci, '13 rue des Cordeliers', '45130', 'Meung-sur-Loire', 4)
    returning id into immeuble_id;

    insert into lots (bien_id, nom) values
      (immeuble_id, 'RDC'),
      (immeuble_id, '1er étage'),
      (immeuble_id, '2e étage'),
      (immeuble_id, 'Garage');
  end if;

  if not exists (select 1 from biens where adresse = '14 rue des Ormes Saint Victor' and household_id = hh_geminet) then
    insert into biens (type, owner_type, household_id, adresse, ville, mode_detention)
    values ('appartement_isole', 'propre', hh_geminet, '14 rue des Ormes Saint Victor', 'Orléans', 'Bien propre (nom propre)');
  end if;
end $$;
