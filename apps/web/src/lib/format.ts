/** "1 membre inscrit" / "3 membres inscrits" */
export const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => `${count} ${count > 1 ? plural : singular}`

/** Deux premières lettres en majuscules, pour les avatars et pastilles. */
export const initials = (value: string) => value.slice(0, 2).toUpperCase()

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR")

export const matchesQuery = (
  query: string,
  ...fields: (string | null | undefined)[]
) => fields.join(" ").toLowerCase().includes(query.trim().toLowerCase())
