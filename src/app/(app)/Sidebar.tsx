"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups, sciNavItems, type NavGroup } from "./nav-items";
import { navIcons } from "./nav-icons";
import { signOut } from "./actions";

export type BienPropreNavItem = { id: string; label: string };

export default function Sidebar({
  displayName,
  biensPropresItems,
  sciNom,
}: {
  displayName: string;
  biensPropresItems: BienPropreNavItem[];
  sciNom: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Referme le tiroir mobile à chaque changement de page (ajustement d'état pendant
  // le rendu, pas dans un effet — cf. https://react.dev/learn/you-might-not-need-an-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Bloque le défilement de l'arrière-plan pendant que le tiroir mobile est ouvert.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const dynamicGroups: NavGroup[] = [...navGroups];
  if (biensPropresItems.length > 0) {
    dynamicGroups.push({
      subgroupLabel: "Biens propres",
      items: biensPropresItems.map((b) => ({
        href: `/gerer/biens-propres/${b.id}`,
        label: b.label,
        icon: "bien",
        variant: "sub",
      })),
    });
  }
  if (sciNom) {
    dynamicGroups.push({
      subgroupLabel: "SCI",
      items: [
        { href: "/gerer/sci/vision-globale", label: sciNom, icon: "sci", variant: "sub" },
        ...sciNavItems,
      ],
    });
  }

  return (
    <>
      <div className="mobile-topbar">
        <button type="button" className="menu-btn" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <div className="brand">PATRIMONIA</div>
      </div>
      <div className={`sidebar-backdrop${open ? " open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand">
        PATRIMONIA
        <small>Phase 1</small>
      </div>

      {dynamicGroups.map((group) => (
        <div key={group.groupLabel ?? group.subgroupLabel}>
          {group.groupLabel && <div className="nav-group-label">{group.groupLabel}</div>}
          {group.subgroupLabel && <div className="nav-subgroup-label">{group.subgroupLabel}</div>}
          <nav>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const classes = [
                "nav-item",
                item.variant,
                item.brick ? "brick" : "",
                isActive ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <Link key={item.href} href={item.href} className={classes}>
                  {navIcons[item.icon]}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="sidebar-foot">
        Connecté — {displayName}
        <br />
        <Link
          href="/compte"
          style={{
            color: "#B7B29F",
            textDecoration: "underline",
            fontSize: 11,
          }}
        >
          Mon compte
        </Link>
        {" · "}
        <Link
          href="/suggestions"
          style={{
            color: "#B7B29F",
            textDecoration: "underline",
            fontSize: 11,
          }}
        >
          Suggestions
        </Link>
        {" · "}
        <form action={signOut} style={{ display: "inline" }}>
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              marginTop: 4,
              color: "#B7B29F",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "inherit",
            }}
          >
            Se déconnecter
          </button>
        </form>
      </div>
      </aside>
    </>
  );
}
