import { useQuery } from "@tanstack/react-query"
import type { DirectoryGame, GameAccount, Member } from "@k2/shared"
import { api } from "@/lib/api-client"

export const useDirectory = () =>
  useQuery({
    queryKey: ["games"],
    queryFn: async () => (await api.get<{ games: DirectoryGame[] }>("/games")).games,
  })

export const useGameAccounts = (slug: string) =>
  useQuery({
    queryKey: ["games", slug, "accounts"],
    queryFn: async () =>
      (await api.get<{ accounts: GameAccount[] }>(`/games/${encodeURIComponent(slug)}/accounts`))
        .accounts,
  })

export const useMember = (pseudo: string) =>
  useQuery({
    queryKey: ["members", pseudo],
    queryFn: async () =>
      (await api.get<{ member: Member }>(`/members/${encodeURIComponent(pseudo)}`)).member,
    retry: false,
  })
