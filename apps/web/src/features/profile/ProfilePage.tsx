import { useState } from "react"
import { Navigate } from "react-router"
import { DECLARABLE_RANKS, GAMES } from "@k2/shared"
import { Shell } from "@/components/layout/Shell"
import { StatusMessage } from "@/components/StatusMessage"
import { useSession } from "@/features/auth/queries"
import { errorMessage } from "@/lib/api-client"
import { initials } from "@/lib/format"
import {
  accountsForGame,
  addMain,
  addSmurf,
  fromAccount,
  hasMain,
  removeSmurf,
  setIdentifier,
  setRankTier,
  toInput,
  type DraftAccount,
} from "./draftAccounts"
import { useMyAccounts, useSaveMyAccounts } from "./queries"

export function ProfilePage() {
  const session = useSession()
  const myAccounts = useMyAccounts(Boolean(session.data))
  const save = useSaveMyAccounts()
  // `null` = pas de modification locale, on affiche les données serveur.
  const [drafts, setDrafts] = useState<DraftAccount[] | null>(null)
  const [message, setMessage] = useState("")

  if (session.isPending) return <Shell>{null}</Shell>
  if (!session.data) return <Navigate to="/auth" replace state={{ from: "/profil" }} />

  const current = drafts ?? myAccounts.data?.map(fromAccount) ?? []
  const edit = (change: (list: DraftAccount[]) => DraftAccount[]) => {
    setDrafts(change(current))
    setMessage("")
  }

  const saveAll = () =>
    save.mutate(current.map(toInput), {
      onSuccess: () => {
        setDrafts(null)
        setMessage("Comptes enregistrés.")
      },
      onError: (error) => setMessage(errorMessage(error)),
    })

  return (
    <Shell>
      <p className="eyebrow">Mon espace</p>
      <h1 className="page-title">Mes comptes de jeu.</h1>
      <p className="mt-6 max-w-xl text-white/40">
        Un compte principal et autant de smurfs que nécessaire. Les rangs sans API sont déclarés
        manuellement.
      </p>
      {myAccounts.isPending && <StatusMessage>Chargement…</StatusMessage>}
      {myAccounts.error && <StatusMessage>{errorMessage(myAccounts.error)}</StatusMessage>}
      {myAccounts.data && (
        <>
          <div className="mt-14 space-y-8">
            {GAMES.map((game) => (
              <section key={game.slug}>
                <h2 className="mb-3 font-display text-2xl font-semibold">{game.name}</h2>
                <div className="space-y-2">
                  {accountsForGame(current, game.slug).map((account) => (
                    <AccountEditor
                      key={account.key}
                      account={account}
                      gameName={game.name}
                      onIdentifier={(value) => edit((l) => setIdentifier(l, account.key, value))}
                      onRank={(value) => edit((l) => setRankTier(l, account.key, value))}
                      onRemove={() => edit((l) => removeSmurf(l, account.key))}
                    />
                  ))}
                  {hasMain(current, game.slug) ? (
                    <button
                      type="button"
                      className="mt-3 text-sm text-[#9da4ff]"
                      onClick={() => edit((l) => addSmurf(l, game.slug))}
                    >
                      + Ajouter un smurf
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="small-action"
                      onClick={() => edit((l) => addMain(l, game.slug))}
                    >
                      Ajouter le compte principal
                    </button>
                  )}
                </div>
              </section>
            ))}
          </div>
          <button
            type="button"
            disabled={save.isPending}
            className="mt-10 rounded-full bg-[#5865F2] px-6 py-3 font-semibold disabled:opacity-60"
            onClick={saveAll}
          >
            Tout enregistrer
          </button>
          <p className="mt-4 text-sm text-[#9da4ff]" role="status">
            {message}
          </p>
        </>
      )}
    </Shell>
  )
}

type EditorProps = {
  account: DraftAccount
  gameName: string
  onIdentifier: (value: string) => void
  onRank: (value: string) => void
  onRemove: () => void
}

function AccountEditor({ account, gameName, onIdentifier, onRank, onRemove }: EditorProps) {
  // Un rang venant d'une API (ex. "Ascendant") reste sélectionnable même s'il n'est pas déclarable.
  const ranks = DECLARABLE_RANKS.includes(account.rankTier)
    ? DECLARABLE_RANKS
    : [account.rankTier, ...DECLARABLE_RANKS]

  return (
    <div className="profile-game-row">
      <span className="game-initial">{initials(gameName)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/45">{account.isMain ? "Principal" : "Smurf"}</span>
          {!account.isMain && <span className="smurf-badge">SMURF</span>}
        </div>
        <input
          className="profile-input mt-2"
          value={account.identifier}
          onChange={(e) => onIdentifier(e.target.value)}
          placeholder="Identifiant, Riot ID ou lien tracker"
          aria-label={`Identifiant ${gameName}`}
        />
      </div>
      <select
        className="rank-select"
        value={account.rankTier}
        onChange={(e) => onRank(e.target.value)}
        aria-label={`Rang ${gameName}`}
      >
        {ranks.map((rank) => (
          <option key={rank}>{rank}</option>
        ))}
      </select>
      {!account.isMain && (
        <button type="button" className="delete-button" onClick={onRemove}>
          Supprimer
        </button>
      )}
    </div>
  )
}
