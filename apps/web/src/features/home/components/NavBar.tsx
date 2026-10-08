import { Link } from "react-router"
import { STATIONS, JOIN_STATION } from "../content"
import { scrollToStation } from "../useScrollStage"

type Props = { active: number; online: number; onOpenSteam: () => void }

export function NavBar({ active, online, onOpenSteam }: Props) {
  return (
    <nav className="nav">
      <a
        className="brand"
        href="#accueil"
        onClick={(e) => {
          e.preventDefault()
          scrollToStation(0)
        }}
      >
        QLS<small>QG GAMING · FR</small>
      </a>
      <ol className="steps" aria-label="Sections">
        {STATIONS.map((station, i) => (
          <li key={station.nav}>
            <button
              type="button"
              className={i === active ? "on" : ""}
              onClick={() => scrollToStation(i)}
            >
              {station.nav}
            </button>
          </li>
        ))}
      </ol>
      <div className="navr">
        <span className="pill">
          <span className="dot pulse" />
          <span>{online} en ligne</span>
        </span>
        <Link className="ghost steam-btn" to="/lore">
          Lore
        </Link>
        <button
          className="ghost steam-btn"
          type="button"
          onClick={onOpenSteam}
          aria-haspopup="dialog"
        >
          Steam
        </button>
        <button
          className="join nav-join"
          type="button"
          onClick={() => scrollToStation(JOIN_STATION)}
        >
          Rejoindre
        </button>
      </div>
    </nav>
  )
}
