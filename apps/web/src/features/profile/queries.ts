import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { GameAccount, GameAccountInput } from "@k2/shared"
import { api } from "@/lib/api-client"

const myAccountsKey = ["me", "accounts"] as const

export const useMyAccounts = (enabled: boolean) =>
  useQuery({
    queryKey: myAccountsKey,
    queryFn: async () => (await api.get<{ accounts: GameAccount[] }>("/me/accounts")).accounts,
    enabled,
  })

export function useSaveMyAccounts() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (accounts: GameAccountInput[]) =>
      (await api.put<{ accounts: GameAccount[] }>("/me/accounts", { accounts })).accounts,
    onSuccess: (accounts) => {
      client.setQueryData(myAccountsKey, accounts)
      client.invalidateQueries({ queryKey: ["games"] })
      client.invalidateQueries({ queryKey: ["members"] })
    },
  })
}
