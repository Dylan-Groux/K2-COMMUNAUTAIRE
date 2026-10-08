import { GAME_PANELS, gameKeyOf, JOIN_STATION, TRACKED_GAMES } from "../content"
import { formatHours, type GameStat, type HypeStats } from "../data/hype"
import { scrollToStation } from "../useScrollStage"
import { cssVars } from "./Avatar"

export function HeroPanel() {
  return (
    <section className="panel hero" data-s="0" id="accueil">
      <div className="kicker">Communauté Discord francophone</div>
      <h2>Le QG des soirées ranked et des parties improvisées.</h2>
      <p>
        Quatre jeux, des salons vocaux toujours ouverts et des gens qui
        répondent quand tu demandes « quelqu'un chaud pour une game ? ».
      </p>
      <div className="row">
        <button
          className="join"
          type="button"
          onClick={() => scrollToStation(JOIN_STATION)}
        >
          Rejoindre le serveur
        </button>
        <button
          className="ghost"
          type="button"
          onClick={() => scrollToStation(1)}
        >
          Jeu du moment ↓
        </button>
      </div>
    </section>
  )
}

const colorOf = (name: string) => {
  const key = gameKeyOf(name)
  return key ? TRACKED_GAMES[key].color : "var(--muted)"
}

type HypeProps = { stats: HypeStats; ranked: GameStat[]; isDemo: boolean }

export function HypePanel({ stats, ranked, isDemo }: HypeProps) {
  const top = ranked[0]
  const max = Math.max(...ranked.map((g) => g.hours))
  return (
    <section
      className="panel hype off"
      data-s="1"
      style={cssVars({ "--c": "var(--signal)" })}
    >
      <div className="kicker">
        Jeu du moment · {stats.window_hours} dernières heures
      </div>
      <h2>{top ? top.name : "Pas encore de données"}</h2>
      {top && (
        <p className="hype-sub">
          {formatHours(top.hours)} cumulées par {top.players} membres du rôle @
          {stats.role}.
        </p>
      )}
      <ol className="rank">
        {ranked.slice(0, 6).map((game) => (
          <li key={game.name} style={cssVars({ "--g": colorOf(game.name) })}>
            <b>{game.name}</b>
            <span>
              {formatHours(game.hours)} · {game.players} j.
            </span>
            <i
              style={cssVars({
                "--w": `${((game.hours / max) * 100).toFixed(1)}%`,
              })}
            />
          </li>
        ))}
      </ol>
      <p className="src">
        {isDemo
          ? "Données d’exemple · temps « Joue à » cumulé par le bot"
          : "Temps « Joue à » cumulé par le bot du serveur"}
      </p>
    </section>
  )
}

export function GamePanels({ live }: { live: Record<string, number> }) {
  return GAME_PANELS.map((panel) => (
    <section
      key={panel.game}
      className="panel off"
      data-s={panel.station}
      style={cssVars({ "--c": TRACKED_GAMES[panel.game].color })}
    >
      <div className="kicker">{panel.eyebrow}</div>
      <h2>{panel.title}</h2>
      <p>{panel.text}</p>
      <ul className="chips">
        {panel.chips.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
        <li className="live">
          <span className="dot" />
          {live[panel.game] ?? 0}&nbsp;en jeu
        </li>
      </ul>
    </section>
  ))
}
