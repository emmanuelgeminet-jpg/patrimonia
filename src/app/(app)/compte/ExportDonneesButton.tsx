"use client";

import { useState, useTransition } from "react";
import { exporterDonnees } from "./export-actions";

export default function ExportDonneesButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onExport = () => {
    setError(null);
    startTransition(async () => {
      const result = await exporterDonnees();
      if (result.error || !result.json) {
        setError(result.error ?? "Erreur lors de l'export.");
        return;
      }
      const blob = new Blob([result.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patrimonium-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div>
      <span style={{ color: "var(--sage)", cursor: "pointer", fontSize: 13 }} onClick={onExport}>
        {pending ? "Préparation de l'export..." : "Exporter toutes mes données (JSON) →"}
      </span>
      {error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}
