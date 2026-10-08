import { UNRANKED, type GameAccount, type GameAccountInput } from "@k2/shared"

/** Compte en cours d'édition. `key` identifie la ligne, `id` n'existe qu'une fois enregistré. */
export type DraftAccount = Omit<GameAccountInput, "url" | "friendCode" | "rankDivision" | "rankLp"> & {
  key: string
  url: string | null
  friendCode: string | null
  rankDivision: string | null
  rankLp: number | null
}

let counter = 0
const newKey = () => `draft-${Date.now()}-${counter++}`

export const fromAccount = (account: GameAccount): DraftAccount => ({
  key: account.id,
  id: account.id,
  slug: account.slug,
  identifier: account.identifier,
  url: account.url,
  friendCode: account.friendCode,
  isMain: account.isMain,
  rankTier: account.rankTier,
  rankDivision: account.rankDivision,
  rankLp: account.rankLp,
})

export const toInput = ({ key: _key, ...input }: DraftAccount): GameAccountInput => input

const blank = (slug: string, isMain: boolean): DraftAccount => ({
  key: newKey(),
  slug,
  identifier: "",
  url: null,
  friendCode: null,
  isMain,
  rankTier: UNRANKED,
  rankDivision: null,
  rankLp: null,
})

/** Comptes d'un jeu, principal en premier. */
export const accountsForGame = (drafts: DraftAccount[], slug: string) =>
  drafts.filter((d) => d.slug === slug).sort((a, b) => Number(b.isMain) - Number(a.isMain))

export const hasMain = (drafts: DraftAccount[], slug: string) =>
  drafts.some((d) => d.slug === slug && d.isMain)

export const addMain = (drafts: DraftAccount[], slug: string) =>
  hasMain(drafts, slug) ? drafts : [...drafts, blank(slug, true)]

export const addSmurf = (drafts: DraftAccount[], slug: string) =>
  hasMain(drafts, slug) ? [...drafts, blank(slug, false)] : drafts

/** Seuls les smurfs peuvent être supprimés. */
export const removeSmurf = (drafts: DraftAccount[], key: string) =>
  drafts.filter((d) => d.key !== key || d.isMain)

export const setIdentifier = (drafts: DraftAccount[], key: string, identifier: string) =>
  drafts.map((d) => (d.key === key ? { ...d, identifier } : d))

/** Un rang déclaré à la main remplace division et LP, devenus obsolètes. */
export const setRankTier = (drafts: DraftAccount[], key: string, rankTier: string) =>
  drafts.map((d) =>
    d.key === key && d.rankTier !== rankTier
      ? { ...d, rankTier, rankDivision: null, rankLp: null }
      : d,
  )
