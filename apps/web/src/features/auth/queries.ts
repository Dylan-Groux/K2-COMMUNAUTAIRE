import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { LoginInput, RegisterInput, User } from "@k2/shared"
import { api, ApiRequestError } from "@/lib/api-client"

export const sessionKey = ["session"] as const

async function fetchSession() {
  try {
    return (await api.get<{ user: User }>("/auth/me")).user
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) return null
    throw error
  }
}

/** Utilisateur connecté, `null` si aucune session. */
export const useSession = () =>
  useQuery({ queryKey: sessionKey, queryFn: fetchSession, staleTime: 5 * 60 * 1000 })

export function useLogin() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<{ user: User }>("/auth/login", input),
    onSuccess: ({ user }) => client.setQueryData(sessionKey, user),
  })
}

export function useRegister() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<{ user: User }>("/auth/register", input),
    onSuccess: ({ user }) => client.setQueryData(sessionKey, user),
  })
}

export function useLogout() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSuccess: () => {
      client.setQueryData(sessionKey, null)
      client.removeQueries({ queryKey: ["me"] })
    },
  })
}
