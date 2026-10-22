import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { DISCORD_URL } from "@/lib/constants"
import { DiscordWidget } from "./components/DiscordWidget"
import { JoinSection } from "./components/JoinSection"
import { LiveBanner } from "./components/LiveBanner"
import { NavBar } from "./components/NavBar"
import { GamePanels, HeroPanel, HypePanel } from "./components/Panels"
import { StationRail } from "./components/StationRail"
import { cssVars } from "./components/Avatar"
import { gameColorOf } from "./content"
import { useDiscordWidget } from "./data/discord"
import { useHypeStats } from "./data/hype"
import { useLiveLineup } from "./data/live"
import { prefetchStations } from "./scene/registry"
import type { SceneEntry } from "./scene/createScene"
import { scrollHeight, setStationCount } from "./scroll"
import { buildShowcase, buildStations, isGameStation } from "./stations"
import { scrollToStation, useScrollStage } from "./useScrollStage"
import "./home.css"

type Props = {
  /** Page /station : toutes les stations, sans données en direct ni bandeau. */
  showcase?: boolean
}

export default function HomePage({ showcase = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(0)

  const lineup = useLiveLineup()
  const stations = useMemo(
    () => (showcase ? buildShowcase() : buildStations(lineup.games)),
    [showcase, lineup.games],
  )
  const layoutKey = stations.map((s) => s.id).join("|")
  // Avant tout effet : la scène et les calques lisent la mise en page dès leur première image.
  useLayoutEffect(() => setStationCount(stations.length), [stations.length])

  const sceneRef = useScrollStage(rootRef, canvasRef, setActive, layoutKey)
  const { widget, isDemo, updatedAt } = useDiscordWidget()
  const hype = useHypeStats()

  // Les effets sont déclarés après useScrollStage : la scène existe déjà quand ils s'exécutent.
  // On ne recrée les avatars 3D (et ne recharge les photos) que si la liste pseudo + photo change.
  const avatarKey = JSON.stringify(
    widget.members.map((m) => ({ name: m.username, avatarUrl: m.avatar_url })),
  )
  useEffect(
    () => sceneRef.current?.setMembers(JSON.parse(avatarKey)),
    [sceneRef, avatarKey],
  )
  useEffect(
    () => sceneRef.current?.setGames(hype.ranked),
    [sceneRef, hype.ranked],
  )
  useEffect(() => {
    if (!showcase && !lineup.games) return
    const entries: SceneEntry[] = stations.slice(2, -1).map((station) => {
      if (!isGameStation(station)) return { kind: "idle" }
      const { game } = station
      return game.key
        ? { kind: "model", key: game.key }
        : {
            kind: "generic",
            name: game.name,
            color: gameColorOf(game.name).hex,
          }
    })
    void sceneRef.current?.setLineup(entries)
  }, [sceneRef, stations, lineup.games, showcase])
  useEffect(prefetchStations, [])

  // « Afficher » sur le bandeau : on recompose la page puis on emmène le visiteur sur le nouveau jeu.
  const [focusId, setFocusId] = useState<string | null>(null)
  useEffect(() => {
    if (!focusId) return
    const index = stations.findIndex((s) => s.id === focusId)
    if (index >= 0) scrollToStation(index)
    setFocusId(null)
  }, [focusId, stations])

  const current = stations[Math.min(active, stations.length - 1)]
  return (
    <div
      ref={rootRef}
      className="qg"
      style={cssVars({ "--accent": current.accent })}
    >
      <div className="bg" aria-hidden="true" />
      <div className="bar" aria-hidden="true" />

      <div className="words" aria-hidden="true">
        {stations.map((station, i) => (
          <div
            key={station.id}
            className={`word${station.solo ? " solo" : ""}${station.panelRight ? " flip" : ""}`}
            data-s={i}
          >
            <span className="l">{station.words[0]}</span>
            <span className="r" style={cssVars({ "--c": station.accent })}>
              {station.words[1]}
            </span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className="gl" aria-hidden="true" />
      <div className="callout" id="call-reset" aria-hidden="true">
        Flip reset
      </div>
      <div className="callout" id="call-goal" aria-hidden="true">
        But !
      </div>

      <NavBar
        stations={stations}
        active={active}
        online={widget.presence_count || widget.members.length}
      />
      <StationRail stations={stations} active={active} />
      <LiveBanner
        games={showcase ? [] : lineup.fresh}
        onShow={() => {
          setFocusId(lineup.fresh[0]?.id ?? null)
          lineup.showLatest()
        }}
      />

      <HeroPanel />
      <DiscordWidget widget={widget} isDemo={isDemo} updatedAt={updatedAt} />
      <HypePanel stats={hype.stats} ranked={hype.ranked} isDemo={hype.isDemo} />
      <GamePanels
        stations={stations}
        players={showcase ? () => null : lineup.players}
        played={hype.stats.games}
      />
      <JoinSection inviteUrl={DISCORD_URL} station={stations.length - 1} />

      <div className="hint">Fais défiler</div>
      <div
        className="scroll-space"
        style={{ height: `${scrollHeight(stations.length)}vh` }}
      />
    </div>
  )
}

/** Route /station : vitrine de toutes les stations 3D. */
export function StationShowcase() {
  return <HomePage showcase />
}
