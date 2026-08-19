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
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 2. SCI
-- =====================================================================

create table if not exists sci (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  siren text,
  capital_social_cents bigint,
  date_creation date,
  regime_fiscal text,
  created_at timestamptz not null default now()
);

-- Répartition des parts de la SCI entre foyers associés.
create table if not exists sci_associes (
  id uuid primary key default gen_random_uuid(),
  sci_id uuid not null references sci(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  parts integer not null default 0,
  pourcentage numeric(5,2),
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
  created_at timestamptz not null default now()
);

create table if not exists locataires (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  nom text not null,
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
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists comptes_courants_mouvements (
  id uuid primary key default gen_random_uuid(),
  sci_id uuid not null references sci(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  date date not null,
  type text not null check (type in ('apport', 'avance', 'remboursement')),
  montant_cents bigint not null,
  commentaire text,
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
-- 7. PROFIL INVESTISSEUR (foyer)
-- =====================================================================

create table if not exists profil_investisseur (
  household_id uuid primary key references households(id) on delete cascade,
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
  travaux_estimes_cents bigint,
  apport_cents bigint,
  montant_emprunte_cents bigint,
  taux_pct numeric(5,3),
  duree_annees integer,
  charges_annuelles_cents bigint,
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
-- Phase 1 : un seul foyer existe (GEMINET) — tout nouvel inscrit y est
-- rattaché automatiquement. La gestion de plusieurs foyers distincts
-- (ex : PAPIN) arrivera en Phase 3.
-- =====================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_household_id uuid;
begin
  select id into target_household_id from households order by created_at asc limit 1;

  if target_household_id is null then
    insert into households (name) values ('Foyer GEMINET') returning id into target_household_id;
  end if;

  insert into profiles (id, household_id, display_name)
  values (new.id, target_household_id, coalesce(new.raw_user_meta_data->>'display_name', new.email));

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

alter table households enable row level security;
alter table profiles enable row level security;
alter table sci enable row level security;
alter table sci_associes enable row level security;
alter table biens enable row level security;
alter table lots enable row level security;
alter table locataires enable row level security;
alter table journal_ecritures enable row level security;
alter table comptes_courants_mouvements enable row level security;
alter table budget_categories enable row level security;
alter table budget_transactions enable row level security;
alter table documents enable row level security;
alter table profil_investisseur enable row level security;
alter table profil_charges_lignes enable row level security;
alter table profil_patrimoine_financier_lignes enable row level security;
alter table profil_emprunts enable row level security;
alter table analyses_biens enable row level security;
alter table analyses_biens_lots enable row level security;
alter table devis_travaux enable row level security;
alter table carnet_visite_reponses enable row level security;

drop policy if exists "own household" on households;
create policy "own household" on households for select using (is_household_member(id));

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for select using (id = auth.uid());

drop policy if exists "sci of my household" on sci;
create policy "sci of my household" on sci for select using (is_sci_member(id));

drop policy if exists "sci_associes of my sci" on sci_associes;
create policy "sci_associes of my sci" on sci_associes for select using (is_sci_member(sci_id));

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

drop policy if exists "journal de ma sci" on journal_ecritures;
create policy "journal de ma sci" on journal_ecritures for all using (is_sci_member(sci_id)) with check (is_sci_member(sci_id));

drop policy if exists "comptes courants de ma sci" on comptes_courants_mouvements;
create policy "comptes courants de ma sci" on comptes_courants_mouvements for all using (is_sci_member(sci_id)) with check (is_sci_member(sci_id));

drop policy if exists "categories de mon foyer" on budget_categories;
create policy "categories de mon foyer" on budget_categories for all using (household_id is null or is_household_member(household_id)) with check (is_household_member(household_id));

drop policy if exists "budget de mon foyer" on budget_transactions;
create policy "budget de mon foyer" on budget_transactions for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- Phase 1 : un seul foyer a un compte, donc "authentifié" = membre du
-- foyer GEMINET. Cette policy sera affinée par entité (SCI/bien/foyer)
-- quand plusieurs foyers cohabiteront (Phase 3).
drop policy if exists "documents accessibles" on documents;
create policy "documents accessibles" on documents for all using (auth.uid() is not null) with check (auth.uid() is not null);

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
