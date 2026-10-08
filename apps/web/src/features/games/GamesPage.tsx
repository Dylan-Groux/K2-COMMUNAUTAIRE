import { Link } from "react-router"
import { Shell } from "@/components/layout/Shell"
import { StatusMessage } from "@/components/StatusMessage"
import { errorMessage } from "@/lib/api-client"
import { pluralize } from "@/lib/format"
import { useDirectory } from "./queries"

export function GamesPage() {
  const { data: games, isPending, error } = useDirectory()

  return (
    <Shell>
      <p className="eyebrow">Répertoire QLS</p>
      <h1 className="page-title">Choisis ton jeu.</h1>
      {isPending && <StatusMessage>Chargement…</StatusMessage>}
      {error && <StatusMessage>{errorMessage(error)}</StatusMessage>}
      <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games?.map((game) => (
          <Link to={`/jeux/${game.slug}`} className="directory-card group" key={game.slug}>
            <span className="text-xs text-[#9da4ff]">{game.short}</span>
            <div>
              <h2 className="font-display text-3xl font-semibold">{game.label}</h2>
              <p className="mt-3 text-sm text-white/35">
                {pluralize(game.memberCount, "membre inscrit", "membres inscrits")}
              </p>
            </div>
            <span className="text-white/30 transition group-hover:translate-x-2">→</span>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
