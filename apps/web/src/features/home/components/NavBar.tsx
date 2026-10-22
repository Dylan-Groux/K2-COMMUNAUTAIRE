import { Link } from "react-router"
import type { StationView } from "../content"
import { scrollToJoin, scrollToStation } from "../useScrollStage"

type Props = { stations: StationView[]; active: number; online: number }

export function NavBar({ stations, active, online }: Props) {
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
        QSL<small>QG GAMING · FR</small>
      </a>
      {/* Au-delà de 8 sections (page /station), la barre déborderait : le rail latéral suffit. */}
      <ol className="steps" aria-label="Sections" hidden={stations.length > 8}>
        {stations.map((station, i) => (
          <li key={station.id}>
            <button
              type="button"
              className={i === active ? "on" : ""}
              onClick={() => scrollToStation(i)}
              title={station.nav}
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
        {/* Même destination que l'onglet Steam des autres pages : une seule liste de membres. */}
        <Link className="ghost steam-btn" to="/steam">
          Steam
        </Link>
        <button className="join nav-join" type="button" onClick={scrollToJoin}>
          Rejoindre
        </button>
      </div>
    </nav>
  )
}
