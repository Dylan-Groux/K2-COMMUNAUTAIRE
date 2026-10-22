import type { StationView } from "../content"
import { scrollToStation } from "../useScrollStage"

type Props = { stations: StationView[]; active: number }

/** Boutons sur le côté pour passer d'une station à l'autre sans faire défiler. */
export function StationRail({ stations, active }: Props) {
  const prev = stations[active - 1]
  const next = stations[active + 1]
  return (
    <nav className="rail" aria-label="Changer de station">
      <button
        type="button"
        disabled={!prev}
        onClick={() => scrollToStation(active - 1)}
        aria-label={
          prev ? `Station précédente : ${prev.nav}` : "Station précédente"
        }
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>
      <ol>
        {stations.map((station, i) => (
          <li key={station.id}>
            <button
              type="button"
              className={i === active ? "on" : ""}
              onClick={() => scrollToStation(i)}
              aria-label={station.nav}
              aria-current={i === active ? "step" : undefined}
            >
              <span>{station.nav}</span>
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={!next}
        onClick={() => scrollToStation(active + 1)}
        aria-label={
          next ? `Station suivante : ${next.nav}` : "Station suivante"
        }
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </nav>
  )
}
