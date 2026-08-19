"use client";

import { useState } from "react";

export default function InviteLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="form-row" style={{ border: "none" }}>
      <label>Lien d&apos;invitation</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input readOnly value={link} style={{ flex: 1, fontFamily: "var(--font-plex-mono)", fontSize: 11.5 }} />
        <span
          className="pill ok"
          style={{ cursor: "pointer" }}
          onClick={() => {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copié !" : "Copier"}
        </span>
      </div>
    </div>
  );
}
