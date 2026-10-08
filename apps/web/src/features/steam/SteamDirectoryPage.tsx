import { useState } from "react"
import { Shell } from "@/components/layout/Shell"
import { StatusMessage } from "@/components/StatusMessage"
import { useGameAccounts } from "@/features/games/queries"
import { errorMessage } from "@/lib/api-client"
import { initials, matchesQuery } from "@/lib/format"

export function SteamDirectoryPage() {
  const [query, setQuery] = useState("")
  const { data, isPending, error } = useGameAccounts("steam")
  const members = (data ?? []).filter((a) => matchesQuery(query, a.pseudo, a.identifier))

  return (
    <Shell>
      <div className="bubble-field" />
      <p className="eyebrow">Annuaire Steam QLS</p>
      <h1 className="page-title reveal-simple">
        <span>Les membres.</span>
        <br />
        <span>Une partie.</span>
      </h1>
      <div className="mt-12 flex max-w-xl items-center rounded-full border border-white/10 bg-white/[.04] px-5 backdrop-blur-xl">
        <input
          className="w-full bg-transparent py-4 outline-none placeholder:text-white/25"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un membre…"
          aria-label="Rechercher un membre"
        />
      </div>
      {isPending && <StatusMessage>Chargement…</StatusMessage>}
      {error && <StatusMessage>{errorMessage(error)}</StatusMessage>}
      {data && !members.length && <StatusMessage>Aucun membre trouvé.</StatusMessage>}
      <div className="relative mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <article className="steam-member-card" key={member.id}>
            <div className="steam-avatar">{initials(member.pseudo)}</div>
            <div>
              <h2 className="font-display text-2xl font-semibold">{member.pseudo}</h2>
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
    </Shell>
  )
}
