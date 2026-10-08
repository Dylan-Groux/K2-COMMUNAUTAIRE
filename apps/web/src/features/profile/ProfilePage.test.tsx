import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { account, user } from "@/test/fixtures"
import { mockApi, renderRoute } from "@/test/render"

describe("ProfilePage", () => {
  it("redirige vers la connexion sans session", async () => {
    mockApi({ "GET /auth/me": () => ({ status: 401, body: { error: "Non connecté" } }) })
    const { router } = renderRoute("/profil")
    await waitFor(() => expect(router.state.location.pathname).toBe("/auth"))
  })

  it("ajoute un smurf puis enregistre tous les comptes", async () => {
    const saved: unknown[] = []
    mockApi({
      "GET /auth/me": () => ({ body: { user } }),
      "GET /me/accounts": () => ({ body: { accounts: [account({ slug: "valorant", game: "Valorant" })] } }),
      "PUT /me/accounts": (init) => {
        const { accounts } = JSON.parse(String(init?.body))
        saved.push(...accounts)
        return { body: { accounts: [] } }
      },
    })
    const u = userEvent.setup()
    renderRoute("/profil")

    // Seul Valorant a un compte principal : un seul bouton "smurf".
    await u.click(await screen.findByRole("button", { name: "+ Ajouter un smurf" }))
    await u.click(screen.getByRole("button", { name: "Tout enregistrer" }))

    expect(await screen.findByText("Comptes enregistrés.")).toBeInTheDocument()
    expect(saved).toHaveLength(2)
    expect(saved[1]).toMatchObject({ slug: "valorant", isMain: false })
  })

  it("affiche l'erreur renvoyée par l'API", async () => {
    mockApi({
      "GET /auth/me": () => ({ body: { user } }),
      "GET /me/accounts": () => ({ body: { accounts: [] } }),
      "PUT /me/accounts": () => ({ status: 400, body: { error: "Lien non autorisé pour ce jeu" } }),
    })
    const u = userEvent.setup()
    renderRoute("/profil")

    await u.click(await screen.findByRole("button", { name: "Tout enregistrer" }))
    expect(await screen.findByText("Lien non autorisé pour ce jeu")).toBeInTheDocument()
  })
})
