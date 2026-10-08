import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { account } from "@/test/fixtures"
import { mockApi, renderRoute } from "@/test/render"

describe("GameDetailPage", () => {
  beforeEach(() => {
    mockApi({
      "GET /auth/me": () => ({ status: 401, body: { error: "Non connecté" } }),
      "GET /games/league-of-legends/accounts": () => ({
        body: {
          accounts: [
            account({ pseudo: "RedarDG", identifier: "SOREDAR#EUW" }),
            account({ pseudo: "RedarDG", identifier: "Redarito#K2", isMain: false }),
            account({ pseudo: "Nox", identifier: "Nox#EUW", friendCode: "123" }),
          ],
        },
      }),
    })
  })

  it("affiche le nom du jeu et les membres inscrits", async () => {
    renderRoute("/jeux/league-of-legends")
    expect(screen.getByRole("heading", { name: "League of Legends" })).toBeInTheDocument()
    expect(await screen.findByText("SOREDAR#EUW")).toBeInTheDocument()
    expect(screen.getByText("Copier le code ami")).toBeInTheDocument()
  })

  it("filtre par pseudo et masque les smurfs", async () => {
    const user = userEvent.setup()
    renderRoute("/jeux/league-of-legends")
    await screen.findByText("SOREDAR#EUW")

    await user.click(screen.getByLabelText("Afficher les smurfs"))
    expect(screen.queryByText("Redarito#K2")).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("Rechercher par pseudo"), "nox")
    expect(screen.queryByText("SOREDAR#EUW")).not.toBeInTheDocument()
    expect(screen.getByText("Nox#EUW")).toBeInTheDocument()
  })
})
