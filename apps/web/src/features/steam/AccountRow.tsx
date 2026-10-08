import { useState } from "react"
import { Link } from "react-router"
import type { GameAccount } from "@k2/shared"

/** Un compte de jeu d'un membre : pseudo en jeu, lien tracker ou code ami. */
export function AccountRow({ account }: { account: GameAccount }) {
  const [copied, setCopied] = useState(false)

  const copyFriendCode = async () => {
    await navigator.clipboard.writeText(account.friendCode ?? "")
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="member-row">
      <div className="min-w-0 flex-1">
        <Link
          to={`/membre/${encodeURIComponent(account.pseudo)}`}
          className="font-semibold"
        >
          {account.pseudo}{" "}
          {!account.isMain && <span className="smurf-badge">SMURF</span>}
        </Link>
        <p className="mt-1 text-sm text-white/35">{account.identifier}</p>
      </div>
      {account.url ? (
        <a
          href={account.url}
          target="_blank"
          rel="noreferrer"
          className="small-action"
        >
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
