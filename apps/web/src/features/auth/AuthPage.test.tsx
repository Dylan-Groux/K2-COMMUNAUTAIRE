import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { user } from "@/test/fixtures"
import { mockApi, renderRoute } from "@/test/render"

describe("AuthPage", () => {
  it("valide le formulaire côté client avant d'appeler l'API", async () => {
    const fetchMock = mockApi({
      "GET /auth/me": () => ({ status: 401, body: { error: "Non connecté" } }),
    })
    const u = userEvent.setup()
    renderRoute("/auth")

    await u.type(screen.getByLabelText("Email"), "pas-un-email")
    await u.type(screen.getByLabelText("Mot de passe"), "x")
    await u.click(screen.getByRole("button", { name: "Se connecter" }))

    expect(await screen.findByText("Email invalide")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/login", expect.anything())
  })

  it("connecte puis redirige vers le profil", async () => {
    mockApi({
      "GET /auth/me": () => ({ status: 401, body: { error: "Non connecté" } }),
      "POST /auth/login": () => ({ body: { user } }),
      "GET /me/accounts": () => ({ body: { accounts: [] } }),
    })
    const u = userEvent.setup()
    const { router } = renderRoute("/auth")

    await u.type(screen.getByLabelText("Email"), "redar@k2.gg")
    await u.type(screen.getByLabelText("Mot de passe"), "k2-demo-2026")
    await u.click(screen.getByRole("button", { name: "Se connecter" }))

    await waitFor(() => expect(router.state.location.pathname).toBe("/profil"))
  })

  it("affiche l'erreur de l'API", async () => {
    mockApi({
      "GET /auth/me": () => ({ status: 401, body: { error: "Non connecté" } }),
      "POST /auth/login": () => ({ status: 401, body: { error: "Email ou mot de passe incorrect" } }),
    })
    const u = userEvent.setup()
    renderRoute("/auth")

    await u.type(screen.getByLabelText("Email"), "redar@k2.gg")
    await u.type(screen.getByLabelText("Mot de passe"), "mauvais")
    await u.click(screen.getByRole("button", { name: "Se connecter" }))

    expect(await screen.findByText("Email ou mot de passe incorrect")).toBeInTheDocument()
  })
})
