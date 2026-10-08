import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { GAME_KEYS, gameKeyOf, type GameKey, WIDGET_URL } from "../content"

/** Format de https://discord.com/api/guilds/{id}/widget.json (champs utilisés). */
export type WidgetMember = {
  id: string
  username: string
  status: "online" | "idle" | "dnd" | string
  avatar_url?: string
  activity?: { name: string }
  game?: { name: string }
  channel_id?: string
}

export type Widget = {
  name: string
  instant_invite: string | null
  presence_count: number
  channels: { id: string; name: string; position: number }[]
  members: WidgetMember[]
}

/** Avatars par défaut de Discord : en mode exemple, montre le rendu des vraies photos de profil. */
const demoAvatar = (i: number) =>
  `https://cdn.discordapp.com/embed/avatars/${i % 6}.png`

export const DEMO_WIDGET: Widget = {
  name: "QLS",
  instant_invite: null,
  presence_count: 23,
  channels: [
    { id: "v1", name: "Squad Apex", position: 0 },
    { id: "v2", name: "Ranked LoL", position: 1 },
    { id: "v3", name: "Chill", position: 2 },
  ],
  members: [
    {
      id: "1",
      avatar_url: demoAvatar(1),
      username: "Kaelyx",
      status: "online",
      activity: { name: "Apex Legends" },
      channel_id: "v1",
    },
    {
      id: "2",
      avatar_url: demoAvatar(2),
      username: "nova.wav",
      status: "online",
      activity: { name: "Apex Legends" },
      channel_id: "v1",
    },
    {
      id: "3",
      avatar_url: demoAvatar(3),
      username: "Brindille",
      status: "online",
      activity: { name: "Apex Legends" },
      channel_id: "v1",
    },
    {
      id: "4",
      avatar_url: demoAvatar(4),
      username: "Tybalt",
      status: "dnd",
      activity: { name: "League of Legends" },
      channel_id: "v2",
    },
    {
      id: "5",
      avatar_url: demoAvatar(5),
      username: "Mireille",
      status: "online",
      activity: { name: "League of Legends" },
      channel_id: "v2",
    },
    {
      id: "6",
      avatar_url: demoAvatar(6),
      username: "Sk8ter",
      status: "online",
      activity: { name: "Rocket League" },
    },
    {
      id: "7",
      avatar_url: demoAvatar(7),
      username: "Pyrrha",
      status: "online",
      activity: { name: "Rocket League" },
    },
    {
      id: "8",
      avatar_url: demoAvatar(8),
      username: "Oko",
      status: "online",
      activity: { name: "Aniimo" },
      channel_id: "v3",
    },
    {
      id: "9",
      avatar_url: demoAvatar(9),
      username: "lunatique",
      status: "idle",
      channel_id: "v3",
    },
    {
      id: "10",
      avatar_url: demoAvatar(10),
      username: "Gaspard",
      status: "online",
      activity: { name: "Aniimo" },
    },
    {
      id: "11",
      avatar_url: demoAvatar(11),
      username: "Zéphyr",
      status: "idle",
    },
    {
      id: "12",
      avatar_url: demoAvatar(12),
      username: "Rako",
      status: "online",
      activity: { name: "League of Legends" },
    },
    {
      id: "13",
      avatar_url: demoAvatar(13),
      username: "Mangue",
      status: "online",
      activity: { name: "Spotify" },
    },
    {
      id: "14",
      avatar_url: demoAvatar(14),
      username: "Iris",
      status: "dnd",
      activity: { name: "Apex Legends" },
    },
  ],
}

export const activityOf = (m: WidgetMember) =>
  m.activity?.name ?? m.game?.name ?? null

export const memberGame = (m: WidgetMember) => gameKeyOf(activityOf(m))

const STATUS_ORDER: Record<string, number> = { online: 0, idle: 1, dnd: 2 }

/** En jeu d'abord, puis en ligne, absent, ne pas déranger. */
export const sortMembers = (members: WidgetMember[]) =>
  members
    .slice()
    .sort(
      (a, b) =>
        Number(!!memberGame(b)) - Number(!!memberGame(a)) ||
        (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3),
    )

export function countByGame(members: WidgetMember[]) {
  const counts = Object.fromEntries(GAME_KEYS.map((key) => [key, 0])) as Record<
    GameKey,
    number
  >
  for (const m of members) {
    const key = memberGame(m)
    if (key) counts[key]++
  }
  return counts
}

/** Salons vocaux occupés, dans l'ordre du serveur. */
export const voiceChannels = (widget: Widget) =>
  widget.channels
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((channel) => ({
      ...channel,
      members: widget.members.filter((m) => m.channel_id === channel.id),
    }))
    .filter((channel) => channel.members.length > 0)

async function fetchWidget(): Promise<Widget> {
  const response = await fetch(WIDGET_URL)
  if (!response.ok)
    throw new Error(`Widget Discord indisponible (${response.status})`)
  return response.json()
}

const DEMO_ACTIVITIES = [
  null,
  "Apex Legends",
  "Rocket League",
  "Aniimo",
  "League of Legends",
]
const DEMO_STATUSES = ["online", "online", "idle", "dnd"]
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/** En mode exemple, un membre change d'état de temps en temps pour montrer le rafraîchissement. */
function useDemoWidget(enabled: boolean) {
  const [widget, setWidget] = useState(DEMO_WIDGET)
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      setWidget((current) => {
        const target = pick(current.members).id
        const activity = pick(DEMO_ACTIVITIES)
        return {
          ...current,
          members: current.members.map((m) =>
            m.id === target
              ? {
                  ...m,
                  activity: activity ? { name: activity } : undefined,
                  status: pick(DEMO_STATUSES),
                }
              : m,
          ),
        }
      })
    }, 9000)
    return () => clearInterval(id)
  }, [enabled])
  return widget
}

export function useDiscordWidget() {
  const live = useQuery({
    queryKey: ["discord-widget", WIDGET_URL],
    queryFn: fetchWidget,
    enabled: !!WIDGET_URL,
    refetchInterval: 60_000,
    retry: false,
  })
  const demo = useDemoWidget(!live.data)
  return {
    widget: live.data ?? demo,
    isDemo: !live.data,
    updatedAt: live.data ? live.dataUpdatedAt : Date.now(),
  }
}
