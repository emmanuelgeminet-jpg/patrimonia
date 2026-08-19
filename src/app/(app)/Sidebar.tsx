"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups } from "./nav-items";
import { navIcons } from "./nav-icons";
import { signOut } from "./actions";

export default function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        PATRIMONIA
        <small>Phase 1</small>
      </div>

      {navGroups.map((group) => (
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
  );
}
