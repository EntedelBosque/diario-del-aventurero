/** Normalization shared by the Motor before consulting official_name_registry. */
export function normalizeOfficialName(name: string): string {
  const normalized = name.trim().toLocaleLowerCase("es-MX").normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, " ");
  if (normalized.length === 0) throw new Error("official name must not be empty");
  return normalized;
}

/** A slug is immutable once persisted, even when the display name later changes. */
export function createImmutableSlug(name: string): string {
  const slug = normalizeOfficialName(name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug.length === 0) throw new Error("official name must contain letters or numbers");
  return slug;
}
