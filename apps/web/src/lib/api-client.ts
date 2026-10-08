const BASE_URL = import.meta.env.VITE_API_URL || "/api"

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/** L'API est publique et en lecture seule : uniquement des GET, sans cookie. */
async function get<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`)
  } catch {
    throw new ApiRequestError(
      0,
      "Serveur injoignable. Réessaie dans un instant.",
    )
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new ApiRequestError(
      response.status,
      data.error ?? "Erreur inattendue",
    )
  return data as T
}

export const api = { get }

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erreur inattendue"
