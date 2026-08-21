"use client";

import { useState, useTransition } from "react";
import { genererEtatDesLieux } from "../actions";
import {
  elementsParDefaut,
  ROOM_TYPE_LABELS,
  ETAT_ELEMENT_LABELS,
  ETAT_PARTIE_PRIVATIVE_LABELS,
  type EtatDesLieuxDonnees,
  type EtatDesLieuxCompteurs,
  type EtatDesLieuxCles,
  type PartiePrivative,
  type EtatElement,
  type EtatPartiePrivative,
  type EtatDesLieuxPieceType,
} from "@/lib/etat-des-lieux";

const rowStyle: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 };
const labelStyle: React.CSSProperties = { fontSize: 12, display: "flex", flexDirection: "column", gap: 2, minWidth: 160 };

function TextField({ label, value, onChange, width = 220 }: { label: string; value: string; onChange: (v: string) => void; width?: number }) {
  return (
    <label style={{ ...labelStyle, maxWidth: width }}>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: "inherit" }} />
    </label>
  );
}

function NumberField({ label, value, onChange, width = 90 }: { label: string; value: number | null | undefined; onChange: (v: number | null) => void; width?: number }) {
  return (
    <label style={{ ...labelStyle, maxWidth: width }}>
      {label}
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        style={{ fontFamily: "inherit" }}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, width = 180 }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; width?: number }) {
  return (
    <label style={{ ...labelStyle, maxWidth: width }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: "inherit" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
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

const ETAT_ELEMENT_OPTIONS = [{ value: "", label: "—" }, ...Object.entries(ETAT_ELEMENT_LABELS).map(([value, label]) => ({ value, label: `${value} — ${label}` }))];
const ETAT_PARTIE_OPTIONS = [{ value: "", label: "—" }, ...Object.entries(ETAT_PARTIE_PRIVATIVE_LABELS).map(([value, label]) => ({ value, label }))];

type PartieKey = "cave" | "parking" | "balconTerrasse" | "jardin";
const PARTIES_FIXES: [PartieKey, string][] = [
  ["cave", "Cave"],
  ["parking", "Parking / box"],
  ["balconTerrasse", "Balcon / terrasse"],
  ["jardin", "Jardin"],
];

export default function EtatDesLieuxForm({
  lotId,
  locataireId,
  type,
  entrees,
  initial,
}: {
  lotId: string;
  locataireId: string;
  type: "entree" | "sortie";
  entrees: { id: string; date: string }[];
  initial: EtatDesLieuxDonnees;
}) {
  const [donnees, setDonnees] = useState<EtatDesLieuxDonnees>(initial);
  const [dateEtatDesLieux, setDateEtatDesLieux] = useState(() => new Date().toISOString().slice(0, 10));
  const [etatEntreeId, setEtatEntreeId] = useState<string>(entrees[0]?.id ?? "");
  const [nouveauType, setNouveauType] = useState<EtatDesLieuxPieceType>("chambre");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const patchCompteurs = (p: Partial<EtatDesLieuxCompteurs>) => setDonnees((d) => ({ ...d, compteurs: { ...d.compteurs, ...p } }));
  const patchCles = (p: Partial<EtatDesLieuxCles>) => setDonnees((d) => ({ ...d, cles: { ...d.cles, ...p } }));
  const patchPartie = (key: "cave" | "parking" | "balconTerrasse" | "jardin" | "autre", p: Partial<PartiePrivative>) =>
    setDonnees((d) => ({ ...d, partiesPrivatives: { ...d.partiesPrivatives, [key]: { ...d.partiesPrivatives[key], ...p } } }));

  const addPiece = () => {
    setDonnees((d) => ({
      ...d,
      pieces: [...d.pieces, { id: `p${d.pieces.length}_${Date.now()}`, nom: ROOM_TYPE_LABELS[nouveauType], type: nouveauType, elements: elementsParDefaut(nouveauType) }],
    }));
  };
  const removePiece = (index: number) => setDonnees((d) => ({ ...d, pieces: d.pieces.filter((_, i) => i !== index) }));
  const updatePieceNom = (index: number, nom: string) => setDonnees((d) => ({ ...d, pieces: d.pieces.map((p, i) => (i === index ? { ...p, nom } : p)) }));
  const updateElement = (pieceIndex: number, elementIndex: number, patch: { etat?: EtatElement | null; observations?: string | null }) =>
    setDonnees((d) => ({
      ...d,
      pieces: d.pieces.map((p, pi) => (pi !== pieceIndex ? p : { ...p, elements: p.elements.map((e, ei) => (ei !== elementIndex ? e : { ...e, ...patch })) })),
    }));

  const onSubmit = () => {
    setError(null);
    setWarning(null);
    if (type === "sortie" && !etatEntreeId) {
      setError("Sélectionne l'état des lieux d'entrée correspondant, ou fais-en un s'il n'existe pas encore dans l'appli.");
      return;
    }
    startTransition(async () => {
      const result = await genererEtatDesLieux(lotId, locataireId, type, dateEtatDesLieux, type === "sortie" ? etatEntreeId : null, donnees);
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
        <h2>Parties et logement</h2>
        <div style={rowStyle}>
          <TextField label="Bailleur" value={donnees.bailleur.nom} onChange={(v) => setDonnees((d) => ({ ...d, bailleur: { ...d.bailleur, nom: v } }))} width={220} />
          <TextField label="Adresse du bailleur" value={donnees.bailleur.adresse} onChange={(v) => setDonnees((d) => ({ ...d, bailleur: { ...d.bailleur, adresse: v } }))} width={280} />
        </div>
        <div style={rowStyle}>
          <TextField label="Locataire" value={donnees.locataire.nom} onChange={(v) => setDonnees((d) => ({ ...d, locataire: { ...d.locataire, nom: v } }))} width={220} />
          <TextField
            label={type === "sortie" ? "Nouvelle adresse du locataire" : "Adresse du locataire"}
            value={donnees.locataire.adresse}
            onChange={(v) => setDonnees((d) => ({ ...d, locataire: { ...d.locataire, adresse: v } }))}
            width={280}
          />
        </div>
        <div style={rowStyle}>
          <CheckField label="Réalisé par un mandataire" checked={!!donnees.mandataire} onChange={(v) => setDonnees((d) => ({ ...d, mandataire: v ? { nom: "", adresse: "" } : null }))} />
          {donnees.mandataire && (
            <>
              <TextField label="Nom du mandataire" value={donnees.mandataire.nom} onChange={(v) => setDonnees((d) => ({ ...d, mandataire: { ...d.mandataire!, nom: v } }))} width={200} />
              <TextField label="Adresse du mandataire" value={donnees.mandataire.adresse} onChange={(v) => setDonnees((d) => ({ ...d, mandataire: { ...d.mandataire!, adresse: v } }))} width={240} />
            </>
          )}
        </div>
        <div style={rowStyle}>
          <label style={{ ...labelStyle, maxWidth: 160 }}>
            Date de l&apos;état des lieux
            <input type="date" value={dateEtatDesLieux} onChange={(e) => setDateEtatDesLieux(e.target.value)} style={{ fontFamily: "inherit" }} />
          </label>
          {type === "sortie" && (
            <SelectField
              label="État des lieux d'entrée correspondant"
              value={etatEntreeId}
              onChange={setEtatEntreeId}
              options={[{ value: "", label: entrees.length ? "— choisir —" : "Aucun trouvé dans l'appli" }, ...entrees.map((e) => ({ value: e.id, label: new Date(e.date).toLocaleDateString("fr-FR") }))]}
              width={260}
            />
          )}
        </div>
      </div>

      <div className="card">
        <h2>Relevés des compteurs individuels d&apos;eau et d&apos;énergie</h2>
        <div style={rowStyle}>
          <TextField label="Électricité — n° compteur" value={donnees.compteurs.electriciteNumero ?? ""} onChange={(v) => patchCompteurs({ electriciteNumero: v || null })} />
          <TextField label="Électricité — relevé HP" value={donnees.compteurs.electriciteReleveHP ?? ""} onChange={(v) => patchCompteurs({ electriciteReleveHP: v || null })} width={140} />
          <TextField label="Électricité — relevé HC" value={donnees.compteurs.electriciteReleveHC ?? ""} onChange={(v) => patchCompteurs({ electriciteReleveHC: v || null })} width={140} />
        </div>
        <div style={rowStyle}>
          <TextField label="Gaz — n° compteur" value={donnees.compteurs.gazNumero ?? ""} onChange={(v) => patchCompteurs({ gazNumero: v || null })} />
          <TextField label="Gaz — relevé" value={donnees.compteurs.gazReleve ?? ""} onChange={(v) => patchCompteurs({ gazReleve: v || null })} width={140} />
        </div>
        <div style={rowStyle}>
          <TextField label="Eau — relevé eau froide" value={donnees.compteurs.eauReleveFroide ?? ""} onChange={(v) => patchCompteurs({ eauReleveFroide: v || null })} width={160} />
          <TextField label="Eau — relevé eau chaude" value={donnees.compteurs.eauReleveChaude ?? ""} onChange={(v) => patchCompteurs({ eauReleveChaude: v || null })} width={160} />
        </div>
      </div>

      <div className="card">
        <h2>Clés et moyens d&apos;accès</h2>
        <div style={rowStyle}>
          <NumberField label="Serrure(s) principale(s)" value={donnees.cles.serruresPrincipales} onChange={(v) => patchCles({ serruresPrincipales: v })} />
          <NumberField label="Verrou(s) haut" value={donnees.cles.verrousHaut} onChange={(v) => patchCles({ verrousHaut: v })} />
          <NumberField label="Verrou(s) bas" value={donnees.cles.verrousBas} onChange={(v) => patchCles({ verrousBas: v })} />
          <NumberField label="Clé(s) immeuble" value={donnees.cles.clesImmeuble} onChange={(v) => patchCles({ clesImmeuble: v })} />
          <NumberField label="Clé(s) cave" value={donnees.cles.clesCave} onChange={(v) => patchCles({ clesCave: v })} />
          <NumberField label="Clé(s) boîte aux lettres" value={donnees.cles.clesBoiteLettres} onChange={(v) => patchCles({ clesBoiteLettres: v })} />
          <NumberField label="Clé(s) portail" value={donnees.cles.clesPortail} onChange={(v) => patchCles({ clesPortail: v })} />
          <NumberField label="Badge(s) / émetteur(s)" value={donnees.cles.badges} onChange={(v) => patchCles({ badges: v })} />
        </div>
        <div style={rowStyle}>
          <TextField label="Autre (libellé)" value={donnees.cles.autresLibelle ?? ""} onChange={(v) => patchCles({ autresLibelle: v || null })} width={200} />
          <NumberField label="Nombre" value={donnees.cles.autresNombre} onChange={(v) => patchCles({ autresNombre: v })} />
        </div>
      </div>

      <div className="card">
        <h2>Parties privatives</h2>
        {PARTIES_FIXES.map(([key, label]) => {
          const partie = donnees.partiesPrivatives[key];
          return (
            <div style={rowStyle} key={key}>
              <CheckField label={label} checked={partie.applicable} onChange={(v) => patchPartie(key, { applicable: v })} />
              {partie.applicable && (
                <>
                  <TextField label="N°" value={partie.numero ?? ""} onChange={(v) => patchPartie(key, { numero: v || null })} width={80} />
                  <SelectField label="État" value={partie.etat ?? ""} onChange={(v) => patchPartie(key, { etat: (v || null) as EtatPartiePrivative | null })} options={ETAT_PARTIE_OPTIONS} width={140} />
                  <TextField label="Observations" value={partie.observations ?? ""} onChange={(v) => patchPartie(key, { observations: v || null })} width={260} />
                </>
              )}
            </div>
          );
        })}
        <div style={rowStyle}>
          <TextField label="Autre partie (libellé)" value={donnees.partiesPrivatives.autreLibelle ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, partiesPrivatives: { ...d.partiesPrivatives, autreLibelle: v || null, autre: { ...d.partiesPrivatives.autre, applicable: !!v } } }))} width={200} />
          {donnees.partiesPrivatives.autreLibelle && (
            <>
              <SelectField label="État" value={donnees.partiesPrivatives.autre.etat ?? ""} onChange={(v) => patchPartie("autre", { etat: (v || null) as EtatPartiePrivative | null })} options={ETAT_PARTIE_OPTIONS} width={140} />
              <TextField label="Observations" value={donnees.partiesPrivatives.autre.observations ?? ""} onChange={(v) => patchPartie("autre", { observations: v || null })} width={260} />
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Équipements énergétiques et chauffage</h2>
        <div style={rowStyle}>
          <SelectField label="Chauffage" value={donnees.chauffageType ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, chauffageType: (v || null) as "individuel" | "collectif" | null }))} options={[{ value: "", label: "—" }, { value: "individuel", label: "Individuel" }, { value: "collectif", label: "Collectif" }]} />
          <TextField label="Nature (ex. chaudière gaz)" value={donnees.chauffageNature ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, chauffageNature: v || null }))} width={220} />
        </div>
        <div style={rowStyle}>
          <SelectField label="Eau chaude sanitaire" value={donnees.eauChaudeType ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, eauChaudeType: (v || null) as "individuelle" | "collective" | null }))} options={[{ value: "", label: "—" }, { value: "individuelle", label: "Individuelle" }, { value: "collective", label: "Collective" }]} />
          <TextField label="Nature (ex. chauffe-eau électrique)" value={donnees.eauChaudeNature ?? ""} onChange={(v) => setDonnees((d) => ({ ...d, eauChaudeNature: v || null }))} width={220} />
        </div>
      </div>

      <div className="card">
        <h2>Pièces</h2>
        <div className="card-sub">Ajoute chaque pièce du logement — les éléments à vérifier s&apos;adaptent au type choisi (cuisine, salle de bain...)</div>
        <div style={rowStyle}>
          <SelectField
            label="Type de pièce à ajouter"
            value={nouveauType}
            onChange={(v) => setNouveauType(v as EtatDesLieuxPieceType)}
            options={Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            width={220}
          />
          <button
            type="button"
            onClick={addPiece}
            style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-end" }}
          >
            + Ajouter la pièce
          </button>
        </div>

        {donnees.pieces.length === 0 ? (
          <div className="empty" style={{ padding: "16px 4px" }}>Aucune pièce ajoutée pour l&apos;instant</div>
        ) : (
          donnees.pieces.map((piece, pieceIndex) => (
            <div key={piece.id} style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <input value={piece.nom} onChange={(e) => updatePieceNom(pieceIndex, e.target.value)} style={{ fontFamily: "inherit", fontWeight: 600, maxWidth: 220 }} />
                <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>({ROOM_TYPE_LABELS[piece.type]})</span>
                <span style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11, marginLeft: "auto" }} onClick={() => removePiece(pieceIndex)}>
                  Supprimer cette pièce
                </span>
              </div>
              {piece.elements.map((el, elementIndex) => (
                <div style={rowStyle} key={el.cle}>
                  <span style={{ fontSize: 12, minWidth: 220 }}>{el.label}</span>
                  <SelectField
                    label=""
                    value={el.etat ?? ""}
                    onChange={(v) => updateElement(pieceIndex, elementIndex, { etat: (v || null) as EtatElement | null })}
                    options={ETAT_ELEMENT_OPTIONS}
                    width={160}
                  />
                  <TextField label="" value={el.observations ?? ""} onChange={(v) => updateElement(pieceIndex, elementIndex, { observations: v || null })} width={280} />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Observations générales</h2>
        <textarea
          value={donnees.observationsGenerales ?? ""}
          onChange={(e) => setDonnees((d) => ({ ...d, observationsGenerales: e.target.value || null }))}
          rows={3}
          style={{ width: "100%", fontFamily: "inherit", fontSize: 12.5, padding: 8 }}
        />
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
            {pending ? "Génération..." : "Générer l'état des lieux (PDF)"}
          </button>
          {error && <span style={{ color: "var(--brick)", fontSize: 12 }}>{error}</span>}
          {warning && <span style={{ color: "var(--amber)", fontSize: 12 }}>{warning}</span>}
        </div>
      </div>
    </>
  );
}
