import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { chargerDonneesBien } from "./data";
import RegularisationScreen from "./RegularisationScreen";
import RegularisationsArchive, { type RegularisationArchiveItem } from "./RegularisationsArchive";
import type { RegularisationResult, ClefRepartition } from "@/lib/charges-regularisation";

export default async function ChargesBienPage({ params }: { params: Promise<{ bienId: string }> }) {
  const { bienId } = await params;
  const donnees = await chargerDonneesBien(bienId);
  if (!donnees) notFound();

  const supabase = await createClient();
  const { data: regularisationsRows } = await supabase
    .from("regularisations_charges")
    .select("id, periode_debut, periode_fin, cle_repartition, charges_totales_cents, donnees, created_at")
    .eq("bien_id", bienId)
    .order("created_at", { ascending: false });

  const regularisations: RegularisationArchiveItem[] = (regularisationsRows ?? []).map((r) => ({
    id: r.id as string,
    periodeDebut: r.periode_debut as string,
    periodeFin: r.periode_fin as string,
    clefRepartition: r.cle_repartition as ClefRepartition,
    chargesTotalesCents: r.charges_totales_cents as number,
    createdAt: r.created_at as string,
    resultat: r.donnees as RegularisationResult,
  }));

  const retourHref = donnees.isSci ? "/gerer/sci/immeuble" : `/gerer/biens-propres/${bienId}`;

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› {donnees.isSci ? "Par immeuble" : "Bien propre"} › Régularisation des charges</b></div>
      <h1>{donnees.bienAdresse}</h1>
      <div className="pagesub">Régularisation des charges par locataire</div>

      <RegularisationScreen
        bienId={bienId}
        cleRepartitionDefaut={donnees.cleRepartitionDefaut}
        lots={donnees.lots}
        occupations={donnees.occupations}
        chargeLignes={donnees.chargeLignes}
        ecrituresSansPeriodeCount={donnees.ecrituresSansPeriodeCount}
        isSci={donnees.isSci}
      />

      {regularisations.length > 0 && <RegularisationsArchive items={regularisations} />}

      <div style={{ marginTop: 16 }}>
        <Link href={retourHref} style={{ color: "var(--sage)", fontSize: 12.5 }}>← Retour</Link>
      </div>
    </section>
  );
}
