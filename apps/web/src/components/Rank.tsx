import { rankClass, type GameAccount } from "@k2/shared"
import { formatDateTime } from "@/lib/format"

type Props = {
  account: Pick<
    GameAccount,
    "rankTier" | "rankDivision" | "rankLp" | "rankDeclared" | "rankUpdatedAt"
  >
}

export function Rank({ account }: Props) {
  return (
    <div
      className="rank-block"
      title={`Mis à jour ${formatDateTime(account.rankUpdatedAt)}`}
    >
      <span className={`rank-gem ${rankClass(account.rankTier)}`} />
      <div>
        <p className="text-sm font-semibold">
          {account.rankTier} {account.rankDivision}
        </p>
        <p className="text-xs text-white/35">
          {account.rankLp != null && `${account.rankLp} LP`}
          {account.rankDeclared && " · déclaré"}
        </p>
      </div>
    </div>
  )
}
