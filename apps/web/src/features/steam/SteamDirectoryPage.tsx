import { useState } from "react"
import { Link, useParams } from "react-router"
import { DIRECTORY, type GameAccount } from "@k2/shared"
import { Shell } from "@/components/layout/Shell"
import { StatusMessage } from "@/components/StatusMessage"
import { filterGameAccounts } from "@/features/games/filterAccounts"
import { useDirectory, useGameAccounts } from "@/features/games/queries"
import { errorMessage } from "@/lib/api-client"
import { initials, pluralize } from "@/lib/format"
import { AccountRow } from "./AccountRow"

/** Steam en premier (c'est l'onglet), puis les autres jeux dans l'ordre du répertoire. */
export const DIRECTORY_GAMES = [
  ...DIRECTORY.filter((g) => g.slug === "steam"),
  ...DIRECTORY.filter((g) => g.slug !== "steam"),
]

function GamePicker({ current }: { current: string }) {
  const { data } = useDirectory()
  const countOf = (slug: string) =>
    data?.find((g) => g.slug === slug)?.memberCount
  return (
    <nav aria-label="Jeux" className="mt-10 flex flex-wrap gap-2">
      {DIRECTORY_GAMES.map((game) => {
        const count = countOf(game.slug)
        const active = game.slug === current
        return (
          <Link
            key={game.slug}
            to={game.slug === "steam" ? "/steam" : `/steam/${game.slug}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active
                ? "border-white bg-white text-black"
                : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
            }`}
          >
            {game.label}
            {count !== undefined && (
              <span
                className={active ? "ml-2 text-black/50" : "ml-2 text-white/30"}
              >
                {count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SteamCards({ members }: { members: GameAccount[] }) {
  return (
    <div className="relative mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <article className="steam-member-card" key={member.id}>
          <div className="steam-avatar">{initials(member.pseudo)}</div>
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {member.pseudo}
            </h2>
            <p className="mt-1 text-sm text-white/35">{member.identifier}</p>
          </div>
          {member.url && (
            <a
              href={member.url}
              target="_blank"
              rel="noreferrer"
              className="small-action self-start"
            >
              Voir sur Steam
            </a>
          )}
        </article>
      ))}
    </div>
  )
}

export function SteamDirectoryPage() {
  const { slug = "steam" } = useParams()
  const game = DIRECTORY_GAMES.find((g) => g.slug === slug)
  const [query, setQuery] = useState("")
  const [showSmurfs, setShowSmurfs] = useState(true)
  const { data, isPending, error } = useGameAccounts(game ? slug : "")
  const accounts = filterGameAccounts(data ?? [], {
    query,
    showSmurfs: slug === "steam" || showSmurfs,
  })

  return (
    <Shell>
      <div className="bubble-field" />
      <p className="eyebrow">Annuaire QLS</p>
      <h1 className="page-title reveal-simple">
        <span>Les membres.</span>
        <br />
        <span>Une partie.</span>
      </h1>
      <GamePicker current={slug} />

      {!game ? (
        <StatusMessage>
          Jeu inconnu. Choisis un jeu dans la liste.
        </StatusMessage>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex w-full max-w-xl items-center rounded-full border border-white/10 bg-white/[.04] px-5 backdrop-blur-xl">
              <input
                className="w-full bg-transparent py-4 outline-none placeholder:text-white/25"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un membre…"
                aria-label="Rechercher un membre"
              />
            </div>
            {slug !== "steam" && (
              <label className="flex items-center gap-3 text-sm text-white/50">
                <input
                  type="checkbox"
                  checked={showSmurfs}
                  onChange={(e) => setShowSmurfs(e.target.checked)}
                />
                Afficher les smurfs
              </label>
            )}
          </div>
          {data && (
            <p className="mt-6 text-sm text-white/35">
              {game.label} · {pluralize(accounts.length, "compte")}
            </p>
          )}
          {isPending && <StatusMessage>Chargement…</StatusMessage>}
          {error && <StatusMessage>{errorMessage(error)}</StatusMessage>}
          {data && !accounts.length && (
            <StatusMessage>Aucun membre trouvé.</StatusMessage>
          )}
          {slug === "steam" ? (
            <SteamCards members={accounts} />
          ) : (
            <div className="mt-6 space-y-3">
              {accounts.map((account) => (
                <AccountRow account={account} key={account.id} />
              ))}
            </div>
          )}
        </>
      )}
    </Shell>
  )
}
