import { useState } from "react"
import { Link, useParams } from "react-router"
import { directoryLabel, type GameAccount } from "@k2/shared"
import { Shell } from "@/components/layout/Shell"
import { Rank } from "@/components/Rank"
import { StatusMessage } from "@/components/StatusMessage"
import { errorMessage } from "@/lib/api-client"
import { filterGameAccounts } from "./filterAccounts"
import { useGameAccounts } from "./queries"

export function GameDetailPage() {
  const { slug = "" } = useParams()
  const [query, setQuery] = useState("")
  const [showSmurfs, setShowSmurfs] = useState(true)
  const { data, isPending, error } = useGameAccounts(slug)
  const accounts = filterGameAccounts(data ?? [], { query, showSmurfs })

  return (
    <Shell>
      <Link to="/jeux" className="text-sm text-white/40">
        ← Tous les jeux
      </Link>
      <p className="eyebrow mt-12">Membres inscrits</p>
      <h1 className="page-title">{directoryLabel(slug) ?? "Jeu"}</h1>
      <input
        className="profile-input mt-12 max-w-xl"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par pseudo…"
        aria-label="Rechercher par pseudo"
      />
      <label className="mt-5 flex items-center gap-3 text-sm text-white/50">
        <input
          type="checkbox"
          checked={showSmurfs}
          onChange={(e) => setShowSmurfs(e.target.checked)}
        />{" "}
        Afficher les smurfs
      </label>
      <div className="mt-8 space-y-3">
        {accounts.map((account) => (
          <AccountRow account={account} key={account.id} />
        ))}
        {isPending && <StatusMessage>Chargement…</StatusMessage>}
        {error && <StatusMessage>{errorMessage(error)}</StatusMessage>}
        {data && !accounts.length && <StatusMessage>Aucun membre trouvé.</StatusMessage>}
      </div>
    </Shell>
  )
}

function AccountRow({ account }: { account: GameAccount }) {
  const [copied, setCopied] = useState(false)

  const copyFriendCode = async () => {
    await navigator.clipboard.writeText(account.friendCode ?? "")
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="member-row">
      <Rank account={account} />
      <div className="min-w-0 flex-1">
        <Link to={`/membre/${encodeURIComponent(account.pseudo)}`} className="font-semibold">
          {account.pseudo} {!account.isMain && <span className="smurf-badge">SMURF</span>}
        </Link>
        <p className="mt-1 text-sm text-white/35">{account.identifier}</p>
      </div>
      {account.url ? (
        <a href={account.url} target="_blank" rel="noreferrer" className="small-action">
          Voir le tracker
        </a>
      ) : account.friendCode ? (
        <button type="button" className="small-action" onClick={copyFriendCode}>
          {copied ? "Copié !" : "Copier le code ami"}
        </button>
      ) : null}
    </div>
  )
}
