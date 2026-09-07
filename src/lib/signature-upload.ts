export const MAX_SIGNATURE_OCTETS = 5 * 1024 * 1024; // 5 Mo

export type SignatureFileInfo = { extension: "jpg" | "png"; contentType: "image/jpeg" | "image/png" };

/**
 * Valide un fichier de signature déposé (JPEG ou PNG uniquement — les deux formats que
 * genererQuittancePdf sait intégrer, voir embedSignatureImage dans src/lib/quittance.ts) et
 * détermine l'extension/le type de contenu à utiliser pour le stockage. Partagé entre la
 * signature du foyer (biens propres) et celle du gérant (SCI) pour ne pas dupliquer cette
 * logique de validation.
 */
export function resolveSignatureFile(file: File): { error: string } | SignatureFileInfo {
  if (file.size === 0) return { error: "Choisis un fichier." };
  if (file.size > MAX_SIGNATURE_OCTETS) return { error: "Fichier trop volumineux (5 Mo maximum)." };

  const estPng = file.type === "image/png" || /\.png$/i.test(file.name);
  const estJpeg = file.type === "image/jpeg" || /\.(jpe?g)$/i.test(file.name);
  if (!estPng && !estJpeg) return { error: "Seuls les formats JPEG et PNG sont acceptés." };

  return estPng ? { extension: "png", contentType: "image/png" } : { extension: "jpg", contentType: "image/jpeg" };
}
