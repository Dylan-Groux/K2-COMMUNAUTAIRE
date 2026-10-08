import { useEffect, useRef, useState } from "react"
import { GAME_KEYS, TRACKED_GAMES, type GameKey } from "../content"
import { sortSteam, type SteamMember } from "../data/steam"
import { Avatar } from "./Avatar"

const stateLabel = (m: SteamMember) =>
  m.state === "ingame"
    ? `En jeu · ${m.game ?? ""}`
    : m.state === "online"
      ? "En ligne sur Steam"
      : "Hors ligne"

export function filterSteam(
  members: SteamMember[],
  query: string,
  filter: GameKey | "all",
) {
  const q = query.trim().toLowerCase()
  return sortSteam(
    members.filter(
      (m) =>
        (!q || `${m.discord} ${m.persona}`.toLowerCase().includes(q)) &&
        (filter === "all" ||
          (!!m.game && TRACKED_GAMES[filter].match.test(m.game))),
    ),
  )
}

function FriendCode({ code }: { code: string }) {
  const [label, setLabel] = useState(code)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setLabel("Copié ✓")
    } catch {
      setLabel("Sélectionne-le")
    }
    setTimeout(() => setLabel(code), 1400)
  }
  return (
    <button type="button" onClick={copy} title="Copier le code ami">
      {label}
    </button>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  members: SteamMember[]
  isDemo: boolean
}

export function SteamDrawer({ open, onClose, members, isDemo }: Props) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<GameKey | "all">("all")
  const inputRef = useRef<HTMLInputElement>(null)
  const hasPresence = members.some((m) => m.state)

  useEffect(() => {
    if (!open) return
    const lastFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = "hidden"
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
      lastFocus?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  const list = filterSteam(members, query, filter)

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="steam-title"
      >
        <header className="d-head">
          <div>
            <div className="kicker" style={{ color: "var(--rl)" }}>
              Steam
            </div>
            <h2 id="steam-title">Ajoute les membres</h2>
          </div>
          <button className="ghost" type="button" onClick={onClose}>
            Fermer
          </button>
        </header>
        <div className="d-tools">
          <label className="search">
            <span className="sr">Rechercher un membre</span>
            <input
              ref={inputRef}
              type="search"
              placeholder="Rechercher un pseudo…"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {hasPresence && (
            <div
              className="filters"
              role="group"
              aria-label="Filtrer par jeu en cours"
            >
              {(["all", ...GAME_KEYS] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {key === "all" ? "Tous" : TRACKED_GAMES[key].label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="d-list">
          {list.length ? (
            list.map((m) => (
              <div className="s-card" key={m.id}>
                <Avatar name={m.persona} />
                <div className="s-name">
                  <b>{m.persona}</b>
                  <small>Discord : {m.discord}</small>
                </div>
                <div className="s-actions">
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noreferrer">
                      Voir le profil
                    </a>
                  ) : (
                    <span className="no-link">
                      {isDemo ? "Profil fictif" : "Pas de lien"}
                    </span>
                  )}
                  {m.friendCode && <FriendCode code={m.friendCode} />}
                </div>
                {m.state && (
                  <div className={`s-state ${m.state}`}>{stateLabel(m)}</div>
                )}
              </div>
            ))
          ) : (
            <div className="empty">Aucun membre ne correspond.</div>
          )}
        </div>
        <footer className="d-foot">
          Pour apparaître ici : ajoute ton compte Steam sur ton profil QLS.
          {isDemo && <span className="badge">Exemple</span>}
        </footer>
      </aside>
    </>
  )
}
