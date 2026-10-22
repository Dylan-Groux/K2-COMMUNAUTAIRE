import type { LineupGame } from "../data/live"

type Props = { games: LineupGame[]; onShow: () => void }

const names = (games: LineupGame[]) =>
  games.length === 1
    ? games[0].name
    : `${games
        .slice(0, -1)
        .map((g) => g.name)
        .join(", ")} et ${games[games.length - 1].name}`

/**
 * Un jeu vient d'apparaître : on le propose au lieu de modifier la page pendant la lecture.
 * Les stations ne changent que si le visiteur clique.
 */
export function LiveBanner({ games, onShow }: Props) {
  if (!games.length) return null
  const first = games[0]
  return (
    <div className="live-banner" role="status">
      <span className="live-dot" aria-hidden="true" />
      <span>
        Nouveau :{" "}
        <b>
          {games.length === 1
            ? `${first.players} joueur${(first.players ?? 0) > 1 ? "s" : ""} sur ${first.name}`
            : names(games)}
        </b>
      </span>
      <button type="button" onClick={onShow}>
        Afficher
      </button>
    </div>
  )
}
