import type { GameAccount } from "@k2/shared"
import { useGameAccounts } from "@/features/games/queries"

export type SteamState = "ingame" | "online" | "offline"

export type SteamMember = {
  id: string
  discord: string
  persona: string
  steamId: string | null
  url: string | null
  friendCode: string | null
  /** Inconnu tant que le bot ne remonte pas la présence Steam. */
  state?: SteamState
  game?: string | null
}

/** Code ami Steam = SteamID64 − 76561197960265728 */
const STEAM64_BASE = 76561197960265728n

export function friendCodeFromSteamId(steamId: string) {
  try {
    const code = BigInt(steamId) - STEAM64_BASE
    return code > 0n ? String(code) : null
  } catch {
    return null
  }
}

export const steamIdFromUrl = (url: string | null) =>
  url?.match(/\/profiles\/(\d{17})/)?.[1] ?? null

export function toSteamMember(account: GameAccount): SteamMember {
  const steamId =
    steamIdFromUrl(account.url) ??
    (/^\d{17}$/.test(account.identifier) ? account.identifier : null)
  return {
    id: account.id,
    discord: account.pseudo,
    persona: account.identifier,
    steamId,
    url: account.url,
    friendCode:
      account.friendCode || (steamId ? friendCodeFromSteamId(steamId) : null),
  }
}

const demo = (
  discord: string,
  persona: string,
  account: number,
  state: SteamState,
  game: string | null = null,
): SteamMember => {
  const steamId = String(STEAM64_BASE + BigInt(account))
  return {
    id: discord,
    discord,
    persona,
    steamId,
    url: null,
    friendCode: String(account),
    state,
    game,
  }
}

export const DEMO_STEAM: SteamMember[] = [
  demo("Kaelyx", "Kaelyx", 184220931, "ingame", "Apex Legends"),
  demo("nova.wav", "novawave", 92011873, "ingame", "Apex Legends"),
  demo("Sk8ter", "sk8ter_boi", 310442918, "ingame", "Rocket League"),
  demo("Pyrrha", "Pyrrha", 77120345, "online"),
  demo("Oko", "Okonomiyaki", 150992211, "ingame", "Aniimo"),
  demo("Rako", "Rako", 265001882, "ingame", "League of Legends"),
  demo("Mireille", "mireille.exe", 98552013, "online"),
  demo("Gaspard", "Gaspard_", 201447760, "offline"),
]

const STATE_ORDER: Record<SteamState, number> = {
  ingame: 0,
  online: 1,
  offline: 2,
}

export const sortSteam = (members: SteamMember[]) =>
  members
    .slice()
    .sort(
      (a, b) =>
        (a.state ? STATE_ORDER[a.state] : 3) -
        (b.state ? STATE_ORDER[b.state] : 3),
    )

/** Comptes Steam déclarés par les membres sur QLS ; données d'exemple si l'API ne répond pas ou est vide. */
export function useSteamMembers() {
  const { data } = useGameAccounts("steam")
  const isDemo = !data?.length
  return { members: isDemo ? DEMO_STEAM : data.map(toSteamMember), isDemo }
}
