import { useCallback, useEffect, useRef, useState } from "react"
import { DISCORD_URL } from "@/lib/constants"
import { DiscordWidget } from "./components/DiscordWidget"
import { JoinSection } from "./components/JoinSection"
import { NavBar } from "./components/NavBar"
import { GamePanels, HeroPanel, HypePanel } from "./components/Panels"
import { cssVars } from "./components/Avatar"
import { SteamDrawer } from "./components/SteamDrawer"
import { STATIONS } from "./content"
import { countByGame, useDiscordWidget } from "./data/discord"
import { useHypeStats } from "./data/hype"
import { useSteamMembers } from "./data/steam"
import { useScrollStage } from "./useScrollStage"
import "./home.css"

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(0)
  const [steamOpen, setSteamOpen] = useState(false)
  const closeSteam = useCallback(() => setSteamOpen(false), [])

  const sceneRef = useScrollStage(rootRef, canvasRef, setActive)
  const { widget, isDemo, updatedAt } = useDiscordWidget()
  const hype = useHypeStats()
  const steam = useSteamMembers()

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

  return (
    <div
      ref={rootRef}
      className="qg"
      style={cssVars({ "--accent": STATIONS[active].accent })}
    >
      <div className="bg" aria-hidden="true" />
      <div className="bar" aria-hidden="true" />

      <div className="words" aria-hidden="true">
        {STATIONS.map((station, i) => (
          <div key={station.nav} className="word" data-s={i}>
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
        active={active}
        online={widget.presence_count || widget.members.length}
        onOpenSteam={() => setSteamOpen(true)}
      />

      <HeroPanel />
      <DiscordWidget widget={widget} isDemo={isDemo} updatedAt={updatedAt} />
      <HypePanel stats={hype.stats} ranked={hype.ranked} isDemo={hype.isDemo} />
      <GamePanels live={countByGame(widget.members)} />
      <JoinSection inviteUrl={widget.instant_invite ?? DISCORD_URL} />

      <SteamDrawer
        open={steamOpen}
        onClose={closeSteam}
        members={steam.members}
        isDemo={steam.isDemo}
      />

      <div className="hint">Fais défiler</div>
      <div className="scroll-space" />
    </div>
  )
}
