import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { vi } from "vitest"
import { routes } from "@/app/routes"

/** Rend l'application complète à `path`, avec un client de requêtes neuf. */
export function renderRoute(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router, client }
}

type Handler = (init: RequestInit | undefined) => { status?: number; body?: unknown }

/** Remplace fetch par des réponses JSON définies par "METHODE /chemin". */
export function mockApi(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url.replace(/^\/api/, "")}`
    const handler = handlers[key]
    if (!handler) return new Response(JSON.stringify({ error: `Non mocké : ${key}` }), { status: 500 })
    const { status = 200, body = {} } = handler(init)
    return new Response(JSON.stringify(body), { status })
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}
