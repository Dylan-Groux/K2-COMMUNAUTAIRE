import {
  ACTIVE_HOURS,
  GAME_PANELS,
  gameColorOf,
  IDLE_STATION,
  PEAK_HOURS,
  type StationView,
} from "../content"
import { formatHours, type GameStat, type HypeStats } from "../data/hype"
import { isGameStation } from "../stations"
import { scrollToJoin, scrollToStation } from "../useScrollStage"
import { cssVars } from "./Avatar"

export function HeroPanel() {
  return (
    <section className="panel hero" data-s="0" id="accueil">
      <div className="kicker">Communauté Discord francophone</div>
      <h2>Le QG des soirées ranked et des parties improvisées.</h2>
      <p>
        Des jeux en commun, des salons vocaux toujours ouverts et des gens qui
        répondent quand tu demandes « quelqu'un chaud pour une game ? ».
      </p>
      <div className="row">
        <button className="join" type="button" onClick={scrollToJoin}>
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
          <li
            key={game.name}
            style={cssVars({ "--g": gameColorOf(game.name).color })}
          >
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

type GameProps = {
  stations: StationView[]
  /** Joueurs en ce moment (null = inconnu, sans données du bot). */
  players: (id: string) => number | null
  /** Heures sur 48 h, pour présenter un jeu qui n'a pas de texte. */
  played: GameStat[]
}

const sameGame = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

/** Un panneau par station de jeu (texte du jeu, ou présentation générique), plus celui de la veille. */
export function GamePanels({ stations, players, played }: GameProps) {
  return stations.map((station, i) => {
    if (station.id === IDLE_STATION.id)
      return <IdlePanel key={station.id} station={i} />
    if (!isGameStation(station)) return null
    const { game } = station
    const live = players(game.id)
    const panel = game.key ? GAME_PANELS[game.key] : null
    const hours = played.find((g) => sameGame(g.name, game.name))?.hours
    return (
      <section
        key={station.id}
        className={`panel off${station.panelRight ? " right" : ""}`}
        data-s={i}
        style={cssVars({ "--c": station.accent })}
      >
        <div className="kicker">
          {panel ? game.name : "En jeu sur le serveur"}
        </div>
        <h2>{panel ? panel.title : game.name}</h2>
        <p>
          {panel
            ? panel.text
            : `Pas encore de station dédiée : ${game.name} s'affiche ici parce que des membres y jouent en ce moment.`}
        </p>
        <ul className="chips">
          {panel?.chips.map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
          {!panel && hours !== undefined && (
            <li>{formatHours(hours)} sur 48 h</li>
          )}
          {live !== null && (
            <li className="live">
              <span className="dot" />
              {live ? <>{live}&nbsp;en jeu</> : "Partie terminée"}
            </li>
          )}
        </ul>
      </section>
    )
  })
}

function IdlePanel({ station }: { station: number }) {
  return (
    <section
      className="panel off"
      data-s={station}
      style={cssVars({ "--c": "var(--cyan)" })}
    >
      <div className="kicker">En veille</div>
      <h2>Calme plat à cette heure-ci.</h2>
      <p>
        Personne n'est en jeu pour l'instant. Le serveur s'anime tous les soirs
        à partir de 18:30, et plus tard le vendredi et le samedi. Repasse ce
        soir : les jeux en cours apparaîtront ici d'eux-mêmes.
      </p>
      <ul className="chips">
        <li>Chaque soir · {ACTIVE_HOURS}</li>
        <li>Ven. et sam. · {PEAK_HOURS}</li>
      </ul>
    </section>
  )
}
