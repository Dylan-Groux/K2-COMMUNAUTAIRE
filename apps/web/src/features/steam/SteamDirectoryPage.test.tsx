import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { account } from "@/test/fixtures"
import { mockApi, renderRoute } from "@/test/render"

describe("annuaire (onglet Steam)", () => {
  beforeEach(() => {
    mockApi({
      "GET /games": () => ({
        body: {
          games: [
            {
              slug: "steam",
              label: "Steam / Epic",
              short: "PC",
              memberCount: 1,
            },
            {
              slug: "league-of-legends",
              label: "League of Legends",
              short: "LOL",
              memberCount: 2,
            },
          ],
        },
      }),
      "GET /games/steam/accounts": () => ({
        body: {
          accounts: [
            account({
              slug: "steam",
              game: "Steam",
              identifier: "RedarDG",
              url: "https://steamcommunity.com/profiles/76561199509396038/",
            }),
          ],
        },
      }),
      "GET /games/league-of-legends/accounts": () => ({
        body: {
          accounts: [
            account({ pseudo: "RedarDG", identifier: "SOREDAR#EUW" }),
            account({
              pseudo: "RedarDG",
              identifier: "Redarito#K2",
              isMain: false,
            }),
            account({
              pseudo: "Nox",
              identifier: "Nox#EUW",
              friendCode: "123",
            }),
          ],
        },
      }),
    })
  })

  it("ouvre sur les membres Steam, avec la liste des jeux", async () => {
    renderRoute("/steam")
    expect(
      await screen.findByRole("link", { name: "Voir sur Steam" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Steam \/ Epic/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(
      screen.getByRole("link", { name: /League of Legends/ }),
    ).toHaveAttribute("href", "/steam/league-of-legends")
  })

  it("passe à un autre jeu et affiche ses comptes avec les rangs", async () => {
    const user = userEvent.setup()
    renderRoute("/steam")
    await user.click(
      await screen.findByRole("link", { name: /League of Legends/ }),
    )
    expect(await screen.findByText("SOREDAR#EUW")).toBeInTheDocument()
    expect(screen.getByText("Copier le code ami")).toBeInTheDocument()
  })

  it("filtre par pseudo et masque les smurfs", async () => {
    const user = userEvent.setup()
    renderRoute("/steam/league-of-legends")
    await screen.findByText("SOREDAR#EUW")

    await user.click(screen.getByLabelText("Afficher les smurfs"))
    expect(screen.queryByText("Redarito#K2")).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("Rechercher un membre"), "nox")
    expect(screen.queryByText("SOREDAR#EUW")).not.toBeInTheDocument()
    expect(screen.getByText("Nox#EUW")).toBeInTheDocument()
  })

  it("redirige les anciennes adresses de l'onglet Jeux", async () => {
    const { router } = renderRoute("/jeux/league-of-legends")
    expect(await screen.findByText("SOREDAR#EUW")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/steam/league-of-legends")
  })

  it("signale un jeu inconnu", async () => {
    renderRoute("/steam/tetris")
    expect(
      await screen.findByText("Jeu inconnu. Choisis un jeu dans la liste."),
    ).toBeInTheDocument()
  })
})
