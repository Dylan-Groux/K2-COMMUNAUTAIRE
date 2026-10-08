/** Rangs du plus haut au plus bas, utilisés pour le tri. */
export const RANK_ORDER = [
  "Radiant",
  "Immortal",
  "Ascendant",
  "Master",
  "Diamond",
  "Champion",
  "Emerald",
  "Platinum",
  "Or",
  "Argent",
  "Bronze",
]

/** Options proposées dans le sélecteur de rang déclaré. */
export const DECLARABLE_RANKS = [
  "Non classé",
  "Bronze",
  "Argent",
  "Or",
  "Platinum",
  "Emerald",
  "Diamond",
  "Master",
  "Champion",
]

export const UNRANKED = "Non classé"

type Rankable = { rankTier: string; rankLp?: number | null }

/** Score de tri : un rang inconnu ou "Non classé" vaut 0, les LP départagent. */
export function rankScore(account: Rankable) {
  const index = RANK_ORDER.indexOf(account.rankTier)
  const tierScore = index === -1 ? 0 : RANK_ORDER.length - index
  return tierScore * 10000 + (account.rankLp ?? 0)
}

/** Classe CSS de la gemme de rang, ex. "rank-diamond". */
export const rankClass = (tier: string) =>
  `rank-${tier
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")}`

/** Principaux d'abord, puis du meilleur rang au plus bas. */
export const compareAccounts = (
  a: Rankable & { isMain: boolean },
  b: Rankable & { isMain: boolean },
) => Number(b.isMain) - Number(a.isMain) || rankScore(b) - rankScore(a)
