import { useState } from "react"
import { Link } from "react-router"
import {
  ACTIVE_HOURS,
  JOIN_STATION,
  PEAK_HOURS,
  SCHEDULE,
  todayIndex,
} from "../content"
import { cssVars } from "./Avatar"

export function JoinSection({ inviteUrl }: { inviteUrl: string }) {
  const [toast, setToast] = useState("")
  const today = todayIndex()
  const label = inviteUrl.replace(/^https?:\/\//, "")

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setToast("Lien copié.")
    } catch {
      setToast("Sélectionne le lien pour le copier.")
    }
  }

  return (
    <section className="final off" data-s={JOIN_STATION} id="rejoindre">
      <div className="weekwrap">
        <div className="week">
          {SCHEDULE.map((slot, i) => (
            <div
              key={slot.day}
              className={`day${i === today ? " today" : ""}${slot.peak ? " peak" : ""}`}
              style={cssVars({
                "--g": slot.peak ? "var(--signal)" : "var(--cyan)",
              })}
            >
              <small>{slot.day}</small>
              <b>{slot.peak ? "Forte affluence" : "Serveur actif"}</b>
              <span>{slot.peak ? PEAK_HOURS : ACTIVE_HOURS}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="invite">
        <span className="code">{label}</span>
        <button className="ghost" type="button" onClick={copy}>
          Copier l'invitation
        </button>
        <a className="join" href={inviteUrl} target="_blank" rel="noreferrer">
          Rejoindre le serveur
        </a>
      </div>
      <div className="toast" role="status">
        {toast}
      </div>
      <p className="fine">
        <Link to="/lore">Lore</Link> · <Link to="/jeux">Annuaire des jeux</Link>{" "}
        · <Link to="/steam">Annuaire Steam</Link> ·{" "}
        <Link to="/auth">Connexion</Link>
      </p>
    </section>
  )
}
