"use client";

import { useActionState, useState } from "react";
import { createCategory, type CreateCategoryState } from "./actions";

const initialState: CreateCategoryState = {};

export default function NewCategoryForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  if (!open) {
    return (
      <span className="addline" onClick={() => setOpen(true)}>
        + Créer une catégorie
      </span>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
      <input name="nom" placeholder="Nom de la catégorie" required style={{ maxWidth: 200 }} />
      <select name="groupe" defaultValue="besoin">
        <option value="besoin">Besoin</option>
        <option value="envie">Envie</option>
        <option value="epargne">Épargne</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
      >
        {pending ? "..." : "Ajouter"}
      </button>
      <span style={{ cursor: "pointer", color: "var(--ink-soft)", fontSize: 12 }} onClick={() => setOpen(false)}>
        Annuler
      </span>
      {state.error && <span style={{ color: "var(--brick)", fontSize: 11.5 }}>{state.error}</span>}
    </form>
  );
}
