"use client";

import { useState, useTransition } from "react";
import { genererBail } from "../actions";
import type {
  BailDonnees,
  BailBailleur,
  BailLogement,
  BailDestination,
  BailAccessoiresPrivatifs,
  BailAccessoiresCommuns,
  BailTic,
  BailDuree,
  BailLoyer,
  BailCharges,
  BailPaiement,
  BailTravaux,
  BailGarantie,
  BailHonoraires,
  BailAnnexes,
} from "@/lib/bail";
import { PERIODES_CONSTRUCTION, mobilierParDefaut } from "@/lib/bail";

const rowStyle: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 };
const labelStyle: React.CSSProperties = { fontSize: 12, display: "flex", flexDirection: "column", gap: 2, minWidth: 160 };
const inputStyle: React.CSSProperties = { fontFamily: "inherit" };

function TextField({ label, value, onChange, placeholder, width = 220 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; width?: number }) {
  return (
    <label style={{ ...labelStyle, maxWidth: width }}>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </label>
  );
}

function EuroField({ label, cents, onChange, width = 140 }: { label: string; cents: number | null | undefined; onChange: (cents: number | null) => void; width?: number }) {
  return (
    <label style={{ ...labelStyle, maxWidth: width }}>
      {label}
      <input
        value={cents != null ? (cents / 100).toString() : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(null);
          const n = Math.round(parseFloat(v.replace(",", ".")) * 100);
          onChange(Number.isNaN(n) ? null : n);
        }}
        placeholder="€"
        style={inputStyle}
      />
    </label>
  );
}

function NumberField({ label, value, onChange, width = 100 }: { label: string; value: number | null | undefined; onChange: (v: number | null) => void; width?: number }) {
  return (
    <label style={{ ...labelStyle, maxWidth: width }}>
      {label}
      <input
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
        style={inputStyle}
      />
    </label>
  );
}

function DateField({ label, value, onChange, width = 150 }: { label: string; value: string | null | undefined; onChange: (v: string | null) => void; width?: number }) {
  return (
    <label style={{ ...labelStyle, maxWidth: width }}>
      {label}
      <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} style={inputStyle} />
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function SelectField({ label, value, onChange, options, width = 180 }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; width?: number }) {
  return (
    <label style={{ ...labelStyle, maxWidth: width }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export default function BailForm({ lotId, locataireId, initial }: { lotId: string; locataireId: string; initial: BailDonnees }) {
  const [typeBail, setTypeBail] = useState<"non_meuble" | "meuble">("non_meuble");
  const [donnees, setDonnees] = useState<BailDonnees>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const patchBailleur = (p: Partial<BailBailleur>) => setDonnees((d) => ({ ...d, bailleur: { ...d.bailleur, ...p } }));
  const patchLogement = (p: Partial<BailLogement>) => setDonnees((d) => ({ ...d, logement: { ...d.logement, ...p } }));
  const patchAutresParties = (p: Partial<BailLogement["autresParties"]>) =>
    setDonnees((d) => ({ ...d, logement: { ...d.logement, autresParties: { ...d.logement.autresParties, ...p } } }));
  const patchEquipements = (p: Partial<BailLogement["equipements"]>) =>
    setDonnees((d) => ({ ...d, logement: { ...d.logement, equipements: { ...d.logement.equipements, ...p } } }));
  const patchDestination = (p: Partial<BailDestination>) => setDonnees((d) => ({ ...d, destination: { ...d.destination, ...p } }));
  const patchAccessoiresPrivatifs = (p: Partial<BailAccessoiresPrivatifs>) => setDonnees((d) => ({ ...d, accessoiresPrivatifs: { ...d.accessoiresPrivatifs, ...p } }));
  const patchAccessoiresCommuns = (p: Partial<BailAccessoiresCommuns>) => setDonnees((d) => ({ ...d, accessoiresCommuns: { ...d.accessoiresCommuns, ...p } }));
  const patchTic = (p: Partial<BailTic>) => setDonnees((d) => ({ ...d, tic: { ...d.tic, ...p } }));
  const patchDuree = (p: Partial<BailDuree>) => setDonnees((d) => ({ ...d, duree: { ...d.duree, ...p } }));
  const patchLoyer = (p: Partial<BailLoyer>) => setDonnees((d) => ({ ...d, loyer: { ...d.loyer, ...p } }));
  const patchCharges = (p: Partial<BailCharges>) => setDonnees((d) => ({ ...d, charges: { ...d.charges, ...p } }));
  const patchPaiement = (p: Partial<BailPaiement>) => setDonnees((d) => ({ ...d, paiement: { ...d.paiement, ...p } }));
  const patchTravaux = (p: Partial<BailTravaux>) => setDonnees((d) => ({ ...d, travaux: { ...d.travaux, ...p } }));
  const patchGarantie = (p: Partial<BailGarantie>) => setDonnees((d) => ({ ...d, garantie: { ...d.garantie, ...p } }));
  const patchHonoraires = (p: Partial<BailHonoraires>) => setDonnees((d) => ({ ...d, honoraires: { ...d.honoraires, ...p } }));
  const patchAnnexes = (p: Partial<BailAnnexes>) => setDonnees((d) => ({ ...d, annexes: { ...d.annexes, ...p } }));

  const hasColocataire = donnees.locataires.length > 1;
  const toggleColocataire = (v: boolean) => {
    setDonnees((d) => ({
      ...d,
      locataires: v ? [d.locataires[0], { nom: "", email: null }] : [d.locataires[0]],
    }));
  };
  const hasMandataire = !!donnees.bailleur.mandataire;
  const hasGarant = !!donnees.bailleur.garant;
  const hasPartageEconomies = !!donnees.partageEconomiesCharges;
  const hasTravaux = !!(donnees.travaux.ameliorationDecence || donnees.travaux.majorationNature || donnees.travaux.diminutionNature || false);

  const onChangeTypeBail = (v: "non_meuble" | "meuble") => {
    setTypeBail(v);
    setDonnees((d) => ({
      ...d,
      duree: { ...d.duree, dureeAnnees: v === "meuble" ? 1 : 3 },
      mobilier: v === "meuble" && d.mobilier.length === 0 ? mobilierParDefaut() : d.mobilier,
    }));
  };

  const onSubmit = () => {
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const result = await genererBail(lotId, locataireId, typeBail, donnees);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.warning) setWarning(result.warning);
      if (result.url) window.open(result.url, "_blank");
    });
  };

  return (
    <>
      <div className="card">
        <h2>Type de bail</h2>
        <div className="card-sub">
          Détermine les mentions légales, la durée par défaut, le plafond du dépôt de garantie et l&apos;inventaire du mobilier applicables.
        </div>
        <div style={rowStyle}>
          <SelectField
            label="Type"
            value={typeBail}
            onChange={(v) => onChangeTypeBail(v as "non_meuble" | "meuble")}
            options={[{ value: "non_meuble", label: "Non meublé (bail nu)" }, { value: "meuble", label: "Meublé" }]}
            width={240}
          />
        </div>
      </div>

      <div className="card">
        <h2>Désignation des parties</h2>
        <div style={rowStyle}>
          <TextField label="Nom du bailleur" value={donnees.bailleur.nom} onChange={(v) => patchBailleur({ nom: v })} width={260} />
          <TextField label="Adresse du bailleur" value={donnees.bailleur.adresse} onChange={(v) => patchBailleur({ adresse: v })} width={320} />
          <TextField label="Adresse électronique" value={donnees.bailleur.email ?? ""} onChange={(v) => patchBailleur({ email: v || null })} width={220} />
        </div>
        <div style={rowStyle}>
          <CheckField label="Le bailleur est une personne morale" checked={donnees.bailleur.estPersonneMorale} onChange={(v) => patchBailleur({ estPersonneMorale: v })} />
          {donnees.bailleur.estPersonneMorale && (
            <>
              <CheckField label="SCI constituée entre parents/alliés (4e degré)" checked={!!donnees.bailleur.sciEntreParentsAllies} onChange={(v) => patchBailleur({ sciEntreParentsAllies: v })} />
              <TextField label="SIREN" value={donnees.bailleur.siren ?? ""} onChange={(v) => patchBailleur({ siren: v || null })} width={140} />
              <TextField label="Nom du gérant" value={donnees.bailleur.gerantNom ?? ""} onChange={(v) => patchBailleur({ gerantNom: v || null })} width={200} />
            </>
          )}
        </div>
        <div style={rowStyle}>
          <CheckField label="Représenté par un mandataire" checked={hasMandataire} onChange={(v) => patchBailleur({ mandataire: v ? { nom: "", adresse: "", activite: null, cartePro: null } : null })} />
          {hasMandataire && (
            <>
              <TextField label="Nom du mandataire" value={donnees.bailleur.mandataire?.nom ?? ""} onChange={(v) => patchBailleur({ mandataire: { ...donnees.bailleur.mandataire!, nom: v } })} width={200} />
              <TextField label="Adresse du mandataire" value={donnees.bailleur.mandataire?.adresse ?? ""} onChange={(v) => patchBailleur({ mandataire: { ...donnees.bailleur.mandataire!, adresse: v } })} width={240} />
              <TextField label="Activité" value={donnees.bailleur.mandataire?.activite ?? ""} onChange={(v) => patchBailleur({ mandataire: { ...donnees.bailleur.mandataire!, activite: v || null } })} width={160} />
              <TextField label="N° carte professionnelle" value={donnees.bailleur.mandataire?.cartePro ?? ""} onChange={(v) => patchBailleur({ mandataire: { ...donnees.bailleur.mandataire!, cartePro: v || null } })} width={200} />
            </>
          )}
        </div>
        <div style={rowStyle}>
          <CheckField label="Garant" checked={hasGarant} onChange={(v) => patchBailleur({ garant: v ? { nom: "", adresse: "" } : null })} />
          {hasGarant && (
            <>
              <TextField label="Nom du garant" value={donnees.bailleur.garant?.nom ?? ""} onChange={(v) => patchBailleur({ garant: { ...donnees.bailleur.garant!, nom: v } })} width={200} />
              <TextField label="Adresse du garant" value={donnees.bailleur.garant?.adresse ?? ""} onChange={(v) => patchBailleur({ garant: { ...donnees.bailleur.garant!, adresse: v } })} width={240} />
            </>
          )}
        </div>
        <div style={rowStyle}>
          <TextField label="Locataire 1 — nom" value={donnees.locataires[0]?.nom ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, locataires: [{ ...d.locataires[0], nom: v }, ...d.locataires.slice(1)] }))} width={220} />
          <TextField label="Locataire 1 — email" value={donnees.locataires[0]?.email ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, locataires: [{ ...d.locataires[0], email: v || null }, ...d.locataires.slice(1)] }))} width={220} />
        </div>
        <div style={rowStyle}>
          <CheckField label="Ajouter un colocataire" checked={hasColocataire} onChange={toggleColocataire} />
          {hasColocataire && (
            <>
              <TextField label="Locataire 2 — nom" value={donnees.locataires[1]?.nom ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, locataires: [d.locataires[0], { ...d.locataires[1], nom: v }] }))} width={220} />
              <TextField label="Locataire 2 — email" value={donnees.locataires[1]?.email ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, locataires: [d.locataires[0], { ...d.locataires[1], email: v || null }] }))} width={220} />
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Objet du contrat — A. Consistance du logement</h2>
        <div style={rowStyle}>
          <TextField label="Bâtiment" value={donnees.logement.batiment ?? ""} onChange={(v) => patchLogement({ batiment: v || null })} width={100} />
          <TextField label="Étage" value={donnees.logement.etage ?? ""} onChange={(v) => patchLogement({ etage: v || null })} width={100} />
          <TextField label="Porte" value={donnees.logement.porte ?? ""} onChange={(v) => patchLogement({ porte: v || null })} width={100} />
          <TextField label="Identifiant fiscal du logement" value={donnees.logement.identifiantFiscal ?? ""} onChange={(v) => patchLogement({ identifiantFiscal: v || null })} width={220} />
        </div>
        <div style={rowStyle}>
          <CheckField label="Immeuble collectif" checked={donnees.logement.immeubleCollectif} onChange={(v) => patchLogement({ immeubleCollectif: v })} />
          <CheckField label="Copropriété" checked={donnees.logement.copropriete} onChange={(v) => patchLogement({ copropriete: v })} />
          <SelectField
            label="Période de construction"
            value={donnees.logement.periodeConstruction ?? ""}
            onChange={(v) => patchLogement({ periodeConstruction: v || null })}
            options={[{ value: "", label: "—" }, ...Object.entries(PERIODES_CONSTRUCTION).map(([value, label]) => ({ value, label }))]}
            width={200}
          />
          <SelectField
            label="Niveau DPE"
            value={donnees.logement.dpeClasse ?? ""}
            onChange={(v) => patchLogement({ dpeClasse: v || null })}
            options={[{ value: "", label: "—" }, ...["A", "B", "C", "D", "E", "F", "G"].map((c) => ({ value: c, label: c }))]}
            width={100}
          />
        </div>
        <div style={rowStyle}>
          <NumberField label="Surface habitable (m²)" value={donnees.logement.surfaceHabitableM2} onChange={(v) => patchLogement({ surfaceHabitableM2: v })} />
          <NumberField label="Nombre de pièces principales" value={donnees.logement.nombrePiecesPrincipales} onChange={(v) => patchLogement({ nombrePiecesPrincipales: v })} />
        </div>
        <div style={rowStyle}>
          <CheckField label="Grenier" checked={!!donnees.logement.autresParties.grenier} onChange={(v) => patchAutresParties({ grenier: v })} />
          <CheckField label="Comble aménagé" checked={!!donnees.logement.autresParties.combleAmenage} onChange={(v) => patchAutresParties({ combleAmenage: v })} />
          <CheckField label="Comble non aménagé" checked={!!donnees.logement.autresParties.combleNonAmenage} onChange={(v) => patchAutresParties({ combleNonAmenage: v })} />
          <CheckField label="Terrasse" checked={!!donnees.logement.autresParties.terrasse} onChange={(v) => patchAutresParties({ terrasse: v })} />
          <CheckField label="Balcon" checked={!!donnees.logement.autresParties.balcon} onChange={(v) => patchAutresParties({ balcon: v })} />
          <CheckField label="Loggia" checked={!!donnees.logement.autresParties.loggia} onChange={(v) => patchAutresParties({ loggia: v })} />
          <CheckField label="Jardin" checked={!!donnees.logement.autresParties.jardin} onChange={(v) => patchAutresParties({ jardin: v })} />
          <TextField label="Autre partie" value={donnees.logement.autresParties.autre ?? ""} onChange={(v) => patchAutresParties({ autre: v || null })} width={180} />
        </div>
        <div style={rowStyle}>
          <CheckField label="Cuisine équipée" checked={!!donnees.logement.equipements.cuisineEquipee} onChange={(v) => patchEquipements({ cuisineEquipee: v })} />
          <CheckField label="Installations sanitaires" checked={!!donnees.logement.equipements.installationsSanitaires} onChange={(v) => patchEquipements({ installationsSanitaires: v })} />
          <TextField label="Autre équipement" value={donnees.logement.equipements.autre ?? ""} onChange={(v) => patchEquipements({ autre: v || null })} width={200} />
        </div>
        <div style={rowStyle}>
          <SelectField label="Chauffage" value={donnees.logement.chauffageType ?? ""} onChange={(v) => patchLogement({ chauffageType: (v || null) as BailLogement["chauffageType"] })} options={[{ value: "", label: "—" }, { value: "individuel", label: "Individuel" }, { value: "collectif", label: "Collectif" }]} />
          {donnees.logement.chauffageType === "collectif" && (
            <TextField label="Modalités de répartition" value={donnees.logement.chauffageModalites ?? ""} onChange={(v) => patchLogement({ chauffageModalites: v || null })} width={260} />
          )}
          <SelectField label="Eau chaude sanitaire" value={donnees.logement.eauChaudeType ?? ""} onChange={(v) => patchLogement({ eauChaudeType: (v || null) as BailLogement["eauChaudeType"] })} options={[{ value: "", label: "—" }, { value: "individuelle", label: "Individuelle" }, { value: "collective", label: "Collective" }]} />
          {donnees.logement.eauChaudeType === "collective" && (
            <TextField label="Modalités de répartition" value={donnees.logement.eauChaudeModalites ?? ""} onChange={(v) => patchLogement({ eauChaudeModalites: v || null })} width={260} />
          )}
        </div>
      </div>

      <div className="card">
        <h2>B. Destination des locaux</h2>
        <div style={rowStyle}>
          <SelectField label="Usage" value={donnees.destination.usage} onChange={(v) => patchDestination({ usage: v as BailDestination["usage"] })} options={[{ value: "habitation", label: "Habitation" }, { value: "mixte", label: "Mixte habitation / professionnel" }]} />
          {donnees.destination.usage === "mixte" && (
            <TextField label="Profession exercée" value={donnees.destination.profession ?? ""} onChange={(v) => patchDestination({ profession: v || null })} width={260} />
          )}
        </div>
      </div>

      <div className="card">
        <h2>C. Locaux et équipements à usage privatif — D. Accessoires communs</h2>
        <div style={rowStyle}>
          <TextField label="Cave n°" value={donnees.accessoiresPrivatifs.caveNumero ?? ""} onChange={(v) => patchAccessoiresPrivatifs({ caveNumero: v || null })} width={100} />
          <TextField label="Parking n°" value={donnees.accessoiresPrivatifs.parkingNumero ?? ""} onChange={(v) => patchAccessoiresPrivatifs({ parkingNumero: v || null })} width={100} />
          <TextField label="Garage n°" value={donnees.accessoiresPrivatifs.garageNumero ?? ""} onChange={(v) => patchAccessoiresPrivatifs({ garageNumero: v || null })} width={100} />
        </div>
        <div style={rowStyle}>
          <CheckField label="Garage à vélo" checked={!!donnees.accessoiresCommuns.garageVelo} onChange={(v) => patchAccessoiresCommuns({ garageVelo: v })} />
          <CheckField label="Ascenseur" checked={!!donnees.accessoiresCommuns.ascenseur} onChange={(v) => patchAccessoiresCommuns({ ascenseur: v })} />
          <CheckField label="Espaces verts" checked={!!donnees.accessoiresCommuns.espacesVerts} onChange={(v) => patchAccessoiresCommuns({ espacesVerts: v })} />
          <CheckField label="Aires de jeux" checked={!!donnees.accessoiresCommuns.airesJeux} onChange={(v) => patchAccessoiresCommuns({ airesJeux: v })} />
          <CheckField label="Laverie" checked={!!donnees.accessoiresCommuns.laverie} onChange={(v) => patchAccessoiresCommuns({ laverie: v })} />
          <CheckField label="Local poubelles" checked={!!donnees.accessoiresCommuns.localPoubelles} onChange={(v) => patchAccessoiresCommuns({ localPoubelles: v })} />
          <CheckField label="Gardiennage" checked={!!donnees.accessoiresCommuns.gardiennage} onChange={(v) => patchAccessoiresCommuns({ gardiennage: v })} />
          <TextField label="Autre service collectif" value={donnees.accessoiresCommuns.autre ?? ""} onChange={(v) => patchAccessoiresCommuns({ autre: v || null })} width={200} />
        </div>
        <div style={rowStyle}>
          <TextField label="Réception télévision" value={donnees.tic.television ?? ""} onChange={(v) => patchTic({ television: v || null })} width={220} />
          <TextField label="Raccordement internet" value={donnees.tic.internet ?? ""} onChange={(v) => patchTic({ internet: v || null })} width={260} />
        </div>
      </div>

      <div className="card">
        <h2>Date de prise d&apos;effet et durée</h2>
        <div style={rowStyle}>
          <DateField label="Date de prise d'effet" value={donnees.duree.datePriseEffet} onChange={(v) => patchDuree({ datePriseEffet: v ?? donnees.duree.datePriseEffet })} />
          <SelectField
            label="Durée"
            value={donnees.duree.dureeAnnees ? String(donnees.duree.dureeAnnees) : "reduite"}
            onChange={(v) => patchDuree({ dureeAnnees: v === "reduite" ? null : (Number(v) as 1 | 3 | 6) })}
            options={
              typeBail === "meuble"
                ? [{ value: "1", label: "1 an" }, { value: "reduite", label: "Durée réduite" }]
                : [{ value: "3", label: "3 ans" }, { value: "6", label: "6 ans" }, { value: "reduite", label: "Durée réduite" }]
            }
          />
          {!donnees.duree.dureeAnnees && (
            <>
              <NumberField label="Durée réduite (mois)" value={donnees.duree.dureeReduiteMois} onChange={(v) => patchDuree({ dureeReduiteMois: v })} />
              <TextField label="Justification (motif professionnel/familial)" value={donnees.duree.dureeReduiteJustification ?? ""} onChange={(v) => patchDuree({ dureeReduiteJustification: v || null })} width={300} />
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Conditions financières</h2>
        <div style={rowStyle}>
          <EuroField label="Loyer mensuel initial" cents={donnees.loyer.montantInitialCents} onChange={(v) => patchLoyer({ montantInitialCents: v ?? 0 })} />
          <CheckField label="Logement en zone tendue" checked={donnees.loyer.zoneTendue} onChange={(v) => patchLoyer({ zoneTendue: v })} />
        </div>
        {donnees.loyer.zoneTendue && (
          <>
            <div style={rowStyle}>
              <CheckField label="Loyer de référence majoré applicable" checked={donnees.loyer.loyerReferenceApplicable} onChange={(v) => patchLoyer({ loyerReferenceApplicable: v })} />
              <EuroField label="Loyer de référence /m²" cents={donnees.loyer.loyerReferenceM2Cents} onChange={(v) => patchLoyer({ loyerReferenceM2Cents: v })} />
              <EuroField label="Loyer de référence majoré /m²" cents={donnees.loyer.loyerReferenceMajoreM2Cents} onChange={(v) => patchLoyer({ loyerReferenceMajoreM2Cents: v })} />
              <EuroField label="Complément de loyer" cents={donnees.loyer.complementLoyerCents} onChange={(v) => patchLoyer({ complementLoyerCents: v })} />
            </div>
            {donnees.loyer.complementLoyerCents != null && (
              <div style={rowStyle}>
                <TextField label="Justification du complément" value={donnees.loyer.complementLoyerJustification ?? ""} onChange={(v) => patchLoyer({ complementLoyerJustification: v || null })} width={320} />
              </div>
            )}
          </>
        )}
        <div style={rowStyle}>
          <EuroField label="Dernier loyer appliqué (si précédent locataire parti il y a moins de 18 mois)" cents={donnees.loyer.dernierLocataireMontantCents} onChange={(v) => patchLoyer({ dernierLocataireMontantCents: v })} width={200} />
          <DateField label="Versé le" value={donnees.loyer.dernierLocataireDateVersement} onChange={(v) => patchLoyer({ dernierLocataireDateVersement: v })} />
          <DateField label="Dernière révision le" value={donnees.loyer.dernierLocataireDateDerniereRevision} onChange={(v) => patchLoyer({ dernierLocataireDateDerniereRevision: v })} />
        </div>
        <div style={rowStyle}>
          <TextField label="Date de révision annuelle (jour/mois)" value={donnees.loyer.revisionJourMois ?? ""} onChange={(v) => patchLoyer({ revisionJourMois: v || null })} placeholder="ex. 01/12" width={180} />
          <TextField label="Trimestre IRL de référence" value={donnees.loyer.revisionTrimestreIrl ?? ""} onChange={(v) => patchLoyer({ revisionTrimestreIrl: v || null })} width={180} />
        </div>
        <div style={rowStyle}>
          <SelectField label="Mode de charges" value={donnees.charges.mode} onChange={(v) => patchCharges({ mode: v as BailCharges["mode"] })} options={[{ value: "provisions", label: "Provisions avec régularisation annuelle" }, { value: "periodique", label: "Paiement périodique sans provision" }, { value: "forfait", label: "Forfait (colocation uniquement)" }]} width={280} />
          <EuroField label="Montant des charges" cents={donnees.charges.montantCents} onChange={(v) => patchCharges({ montantCents: v ?? 0 })} />
        </div>
        <div style={rowStyle}>
          <CheckField
            label="Participation au partage des économies de charges"
            checked={hasPartageEconomies}
            onChange={(v) => setDonnees((d) => ({ ...d, partageEconomiesCharges: v ? { montantCents: 0, dureeRestanteMois: null, dateSignature: null, travaux: null } : null }))}
          />
          {hasPartageEconomies && donnees.partageEconomiesCharges && (
            <>
              <EuroField label="Montant" cents={donnees.partageEconomiesCharges.montantCents} onChange={(v) => setDonnees((d) => ({ ...d, partageEconomiesCharges: { ...d.partageEconomiesCharges!, montantCents: v ?? 0 } }))} />
              <NumberField label="Durée restante (mois)" value={donnees.partageEconomiesCharges.dureeRestanteMois} onChange={(v) => setDonnees((d) => ({ ...d, partageEconomiesCharges: { ...d.partageEconomiesCharges!, dureeRestanteMois: v } }))} />
              <TextField label="Travaux concernés" value={donnees.partageEconomiesCharges.travaux ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, partageEconomiesCharges: { ...d.partageEconomiesCharges!, travaux: v || null } }))} width={240} />
            </>
          )}
        </div>
        {hasColocataire && (
          <div style={rowStyle}>
            <CheckField
              label="Assurance colocataires souscrite par le bailleur"
              checked={!!donnees.assuranceColocataires?.souscrite}
              onChange={(v) => setDonnees((d) => ({ ...d, assuranceColocataires: v ? { souscrite: true, montantAnnuelCents: null } : null }))}
            />
            {donnees.assuranceColocataires?.souscrite && (
              <EuroField label="Montant annuel récupérable" cents={donnees.assuranceColocataires.montantAnnuelCents} onChange={(v) => setDonnees((d) => ({ ...d, assuranceColocataires: { souscrite: true, montantAnnuelCents: v } }))} />
            )}
          </div>
        )}
        <div style={rowStyle}>
          <NumberField label="Jour de paiement (chaque mois)" value={donnees.paiement.jourPaiement} onChange={(v) => patchPaiement({ jourPaiement: v ?? 1 })} />
          <SelectField label="Payable à" value={donnees.paiement.payableA} onChange={(v) => patchPaiement({ payableA: v as BailPaiement["payableA"] })} options={[{ value: "bailleur", label: "Au bailleur" }, { value: "mandataire", label: "Au mandataire" }]} />
        </div>
        <div style={rowStyle}>
          <EuroField label="Dépenses énergétiques estimées / an" cents={donnees.depensesEnergetiquesMontantAnnuelCents} onChange={(v) => setDonnees((d) => ({ ...d, depensesEnergetiquesMontantAnnuelCents: v }))} />
          <TextField label="Année de référence des prix" value={donnees.depensesEnergetiquesAnneeReference ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, depensesEnergetiquesAnneeReference: v || null }))} width={140} />
        </div>
      </div>

      <div className="card">
        <h2>Travaux</h2>
        <div style={rowStyle}>
          <CheckField label="Renseigner des travaux" checked={hasTravaux} onChange={(v) => { if (!v) patchTravaux({ ameliorationDecence: null, majorationNature: null, diminutionNature: null }); else patchTravaux({ ameliorationDecence: donnees.travaux.ameliorationDecence ?? "" }); }} />
        </div>
        {hasTravaux && (
          <>
            <div style={rowStyle}>
              <TextField label="Travaux d'amélioration/mise en conformité déjà effectués" value={donnees.travaux.ameliorationDecence ?? ""} onChange={(v) => patchTravaux({ ameliorationDecence: v || null })} width={400} />
            </div>
            <div style={rowStyle}>
              <TextField label="Majoration — nature des travaux du bailleur" value={donnees.travaux.majorationNature ?? ""} onChange={(v) => patchTravaux({ majorationNature: v || null })} width={220} />
              <TextField label="Modalités" value={donnees.travaux.majorationModalites ?? ""} onChange={(v) => patchTravaux({ majorationModalites: v || null })} width={200} />
              <TextField label="Délai" value={donnees.travaux.majorationDelai ?? ""} onChange={(v) => patchTravaux({ majorationDelai: v || null })} width={120} />
              <EuroField label="Montant majoration" cents={donnees.travaux.majorationMontantCents} onChange={(v) => patchTravaux({ majorationMontantCents: v })} />
            </div>
            <div style={rowStyle}>
              <TextField label="Diminution — nature des travaux du locataire" value={donnees.travaux.diminutionNature ?? ""} onChange={(v) => patchTravaux({ diminutionNature: v || null })} width={220} />
              <TextField label="Modalités" value={donnees.travaux.diminutionModalites ?? ""} onChange={(v) => patchTravaux({ diminutionModalites: v || null })} width={200} />
              <TextField label="Délai" value={donnees.travaux.diminutionDelai ?? ""} onChange={(v) => patchTravaux({ diminutionDelai: v || null })} width={120} />
              <EuroField label="Montant diminution" cents={donnees.travaux.diminutionMontantCents} onChange={(v) => patchTravaux({ diminutionMontantCents: v })} />
              <NumberField label="Pendant (mois)" value={donnees.travaux.diminutionDureeMois} onChange={(v) => patchTravaux({ diminutionDureeMois: v })} />
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>Garanties</h2>
        <div style={rowStyle}>
          <SelectField label="Type" value={donnees.garantie.type} onChange={(v) => patchGarantie({ type: v as BailGarantie["type"] })} options={[{ value: "depot_garantie", label: "Dépôt de garantie" }, { value: "garantie_autonome", label: "Garantie autonome" }]} width={200} />
          <EuroField label="Montant" cents={donnees.garantie.montantCents} onChange={(v) => patchGarantie({ montantCents: v ?? 0 })} />
        </div>
      </div>

      {typeBail === "meuble" && (
        <div className="card">
          <h2>Inventaire du mobilier obligatoire</h2>
          <div className="card-sub">Les 11 éléments requis par le décret n° 2015-981 — décoche ceux qui manqueraient réellement dans le logement</div>
          {donnees.mobilier.map((item, index) => (
            <div style={rowStyle} key={item.label}>
              <CheckField
                label={item.label}
                checked={item.present}
                onChange={(v) =>
                  setDonnees((d) => ({ ...d, mobilier: d.mobilier.map((m, i) => (i === index ? { ...m, present: v } : m)) }))
                }
              />
              {!item.present && (
                <TextField
                  label="Observations"
                  value={item.observations ?? ""}
                  onChange={(v) =>
                    setDonnees((d) => ({ ...d, mobilier: d.mobilier.map((m, i) => (i === index ? { ...m, observations: v || null } : m)) }))
                  }
                  width={280}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Honoraires de location</h2>
        <div className="card-sub">Uniquement si le bail est conclu avec le concours d&apos;une agence ou d&apos;un mandataire</div>
        <div style={rowStyle}>
          <CheckField
            label="Bail conclu avec le concours d'une agence"
            checked={donnees.honoraires.concoursAgence}
            onChange={(v) =>
              patchHonoraires({
                concoursAgence: v,
                repartition: v
                  ? [
                      { poste: "Visite / dossier / rédaction", bailleurCents: 0, locataireCents: 0 },
                      { poste: "État des lieux", bailleurCents: 0, locataireCents: 0 },
                    ]
                  : [],
              })
            }
          />
        </div>
        {donnees.honoraires.concoursAgence && (
          <>
            <div style={rowStyle}>
              <EuroField label="Plafond visite/dossier/rédaction (par m²)" cents={donnees.honoraires.visiteDossierRedactionM2Cents} onChange={(v) => patchHonoraires({ visiteDossierRedactionM2Cents: v })} />
              <EuroField label="Plafond état des lieux (par m²)" cents={donnees.honoraires.etatDesLieuxM2Cents} onChange={(v) => patchHonoraires({ etatDesLieuxM2Cents: v })} />
            </div>
            {donnees.honoraires.repartition.map((r, i) => (
              <div style={rowStyle} key={r.poste}>
                <span style={{ fontSize: 12, minWidth: 200 }}>{r.poste}</span>
                <EuroField
                  label="Part bailleur"
                  cents={r.bailleurCents}
                  onChange={(v) =>
                    patchHonoraires({ repartition: donnees.honoraires.repartition.map((row, idx) => (idx === i ? { ...row, bailleurCents: v ?? 0 } : row)) })
                  }
                />
                <EuroField
                  label="Part locataire"
                  cents={r.locataireCents}
                  onChange={(v) =>
                    patchHonoraires({ repartition: donnees.honoraires.repartition.map((row, idx) => (idx === i ? { ...row, locataireCents: v ?? 0 } : row)) })
                  }
                />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="card">
        <h2>Autres conditions particulières</h2>
        <textarea
          value={donnees.autresConditions ?? ""}
          onChange={(e) => setDonnees((d) => ({ ...d, autresConditions: e.target.value || null }))}
          placeholder="Ex. travaux prévus, accord particulier..."
          rows={3}
          style={{ width: "100%", fontFamily: "inherit", fontSize: 12.5, padding: 8 }}
        />
      </div>

      <div className="card">
        <h2>Annexes</h2>
        <div className="card-sub">Coche les documents remis en annexe — les fichiers eux-mêmes se déposent dans le dossier &quot;Diagnostics &amp; DPE&quot; des Documents</div>
        <div style={rowStyle}>
          <CheckField label="Extrait du règlement de copropriété" checked={donnees.annexes.reglementCopropriete} onChange={(v) => patchAnnexes({ reglementCopropriete: v })} />
          <CheckField label="Dossier de diagnostic technique" checked={donnees.annexes.dossierDiagnosticTechnique} onChange={(v) => patchAnnexes({ dossierDiagnosticTechnique: v })} />
          <CheckField label="Notice d'information" checked={donnees.annexes.noticeInformation} onChange={(v) => patchAnnexes({ noticeInformation: v })} />
          <CheckField label="État des lieux" checked={donnees.annexes.etatDesLieux} onChange={(v) => patchAnnexes({ etatDesLieux: v })} />
          {typeBail === "meuble" && (
            <CheckField label="Inventaire du mobilier" checked={donnees.annexes.inventaireMobilier} onChange={(v) => patchAnnexes({ inventaireMobilier: v })} />
          )}
          <CheckField label="Autorisation préalable de mise en location" checked={donnees.annexes.autorisationMiseEnLocation} onChange={(v) => patchAnnexes({ autorisationMiseEnLocation: v })} />
          <CheckField label="Références de loyers du voisinage" checked={donnees.annexes.referencesLoyersVoisinage} onChange={(v) => patchAnnexes({ referencesLoyersVoisinage: v })} />
        </div>
      </div>

      <div className="card">
        <h2>Signature</h2>
        <div style={rowStyle}>
          <TextField label="Lieu de signature" value={donnees.lieuSignature} onChange={(v) => setDonnees((d) => ({ ...d, lieuSignature: v }))} width={220} />
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? "Génération..." : "Générer le bail (PDF)"}
          </button>
          {error && <span style={{ color: "var(--brick)", fontSize: 12 }}>{error}</span>}
          {warning && <span style={{ color: "var(--amber)", fontSize: 12 }}>{warning}</span>}
        </div>
      </div>
    </>
  );
}
