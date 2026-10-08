import { useParams } from "react-router"
import { Shell } from "@/components/layout/Shell"
import { StatusMessage } from "@/components/StatusMessage"
import { useMember } from "@/features/games/queries"
import { errorMessage } from "@/lib/api-client"
import { initials } from "@/lib/format"

export function MemberPage() {
  const { pseudo = "" } = useParams()
  const { data: member, isPending, error } = useMember(pseudo)

  return (
    <Shell>
      <p className="eyebrow">Profil public</p>
      <h1 className="page-title">{member?.pseudo ?? pseudo}</h1>
      {isPending && <StatusMessage>Chargement…</StatusMessage>}
      {error && <StatusMessage>{errorMessage(error)}</StatusMessage>}
      {member && !member.accounts.length && (
        <StatusMessage>
          Ce membre n'a encore renseigné aucun compte.
        </StatusMessage>
      )}
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {member?.accounts.map((a) => (
          <article className="directory-card" key={a.id}>
            <span className="game-initial">{initials(a.game)}</span>
            <div>
              <h2 className="text-xl font-semibold">
                {a.game}{" "}
                {!a.isMain && <span className="smurf-badge">SMURF</span>}
              </h2>
              <p className="mt-2 text-white/40">{a.identifier}</p>
              {a.friendCode && (
                <p className="mt-2 text-sm text-[#9da4ff]">
                  Code ami : {a.friendCode}
                </p>
              )}
            </div>
            {a.url && (
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="small-action self-start"
              >
                Ouvrir
              </a>
            )}
          </article>
        ))}
      </div>
    </Shell>
  )
}
