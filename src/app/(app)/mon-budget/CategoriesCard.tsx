"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { updateCategory, deleteCategory, type UpdateCategoryState } from "./actions";
import NewCategoryForm from "./NewCategoryForm";
import type { Transaction, Category } from "./page";

const GROUPE_OPTIONS: { value: string; label: string }[] = [
  { value: "besoin", label: "Besoin" },
  { value: "envie", label: "Envie" },
  { value: "epargne", label: "Épargne" },
  { value: "revenu", label: "Revenu" },
];

const initialState: UpdateCategoryState = {};

export default function CategoriesCard({ categories, transactions }: { categories: Category[]; transactions: Transaction[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const countByCategorie = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (!t.categorie_id) continue;
      map.set(t.categorie_id, (map.get(t.categorie_id) ?? 0) + 1);
    }
    return map;
  }, [transactions]);

  return (
    <div className="card">
      <h2>Catégories</h2>
      <div className="card-sub">Clique une catégorie pour la renommer ou la supprimer</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {categories.map((c) =>
          editingId === c.id ? (
            <CategoryEditForm key={c.id} category={c} onDone={() => setEditingId(null)} count={countByCategorie.get(c.id) ?? 0} />
          ) : (
            <span
              key={c.id}
              className="pill"
              style={{ background: "var(--paper)", color: "var(--ink-soft)", cursor: "pointer" }}
              onClick={() => setEditingId(c.id)}
            >
              {c.nom}
            </span>
          )
        )}
      </div>
      <NewCategoryForm />
    </div>
  );
}

function CategoryEditForm({ category, onDone, count }: { category: Category; onDone: () => void; count: number }) {
  const [state, formAction, pending] = useActionState(updateCategory, initialState);
  const [, startTransition] = useTransition();
  const wasPending = useRef(false);

  // Referme le formulaire seulement une fois l'enregistrement terminé sans erreur — pas
  // immédiatement au clic, pour laisser un message d'erreur visible s'il y en a un.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onDone();
    wasPending.current = pending;
  }, [pending, state.error, onDone]);

  const onDelete = () => {
    const message =
      count > 0
        ? `Supprimer "${category.nom}" ? ${count} transaction${count > 1 ? "s" : ""} repasseront en "non catégorisées" — elles ne sont pas supprimées.`
        : `Supprimer "${category.nom}" ?`;
    if (!window.confirm(message)) return;
    startTransition(() => {
      deleteCategory(category.id);
    });
    onDone();
  };

  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center", background: "var(--paper)", borderRadius: 20, padding: "3px 8px" }}>
      <form action={formAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="hidden" name="id" value={category.id} />
        <input name="nom" defaultValue={category.nom} required style={{ maxWidth: 130, fontSize: 11.5, padding: "3px 6px" }} />
        <select name="groupe" defaultValue={category.groupe ?? "revenu"} style={{ fontSize: 11.5, padding: "3px 4px" }}>
          {GROUPE_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          {pending ? "..." : "OK"}
        </button>
      </form>
      <span style={{ cursor: "pointer", color: "var(--ink-soft)", fontSize: 11 }} onClick={onDone}>Annuler</span>
      <span style={{ cursor: "pointer", color: "var(--brick)", fontSize: 11 }} onClick={onDelete}>Supprimer</span>
      {state.error && <span style={{ color: "var(--brick)", fontSize: 10.5 }}>{state.error}</span>}
    </span>
  );
}
