import { compareAccounts, type GameAccount } from "@k2/shared"
import { matchesQuery } from "@/lib/format"

type Filters = { query: string; showSmurfs: boolean }

/** Filtre par pseudo / identifiant et smurfs, principaux puis meilleurs rangs d'abord. */
export const filterGameAccounts = (accounts: GameAccount[], { query, showSmurfs }: Filters) =>
  accounts
    .filter((a) => (showSmurfs || a.isMain) && matchesQuery(query, a.pseudo, a.identifier))
    .sort(compareAccounts)
