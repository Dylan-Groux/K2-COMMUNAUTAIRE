import request from "supertest"
import { describe, expect, it } from "vitest"
import type { GameAccount } from "@k2/shared"
import { newMember, setupApp } from "./helpers"

describe("comptes de jeu", () => {
  it("exige une session pour lire ses comptes", async () => {
    const { app } = await setupApp()
    expect((await request(app).get("/api/me/accounts")).status).toBe(401)
  })

  it("enregistre un principal et un smurf puis les relit", async () => {
    const { agent } = await setupApp()
    await agent.post("/api/auth/register").send(newMember)

    const saved = await agent.put("/api/me/accounts").send({
      accounts: [
        { slug: "valorant", identifier: "Nox#EUW", isMain: true, rankTier: "Diamond" },
        { slug: "valorant", identifier: "NoxAlt#EUW", isMain: false, rankTier: "Or" },
      ],
    })
    expect(saved.status).toBe(200)
    expect(saved.body.accounts).toHaveLength(2)

    const mine = await agent.get("/api/me/accounts")
    expect(mine.body.accounts.map((a: GameAccount) => a.identifier).sort()).toEqual([
      "Nox#EUW",
      "NoxAlt#EUW",
    ])
  })

  it("conserve l'id et la date de rang d'un compte inchangé", async () => {
    const { agent } = await setupApp()
    await agent.post("/api/auth/register").send(newMember)
    const first = await agent.put("/api/me/accounts").send({
      accounts: [{ slug: "aniimo", identifier: "Nox", isMain: true, rankTier: "Or" }],
    })
    const [account] = first.body.accounts as GameAccount[]

    const second = await agent.put("/api/me/accounts").send({
      accounts: [{ ...account, identifier: "Nox2" }],
    })
    expect(second.body.accounts[0]).toMatchObject({
      id: account.id,
      identifier: "Nox2",
      rankUpdatedAt: account.rankUpdatedAt,
    })
  })

  it("refuse un lien tracker hors domaine", async () => {
    const { agent } = await setupApp()
    await agent.post("/api/auth/register").send(newMember)
    const res = await agent.put("/api/me/accounts").send({
      accounts: [
        {
          slug: "valorant",
          identifier: "https://evil.com/x",
          isMain: true,
          rankTier: "Or",
        },
      ],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Lien non autorisé pour ce jeu")
  })
})

describe("répertoire public", () => {
  it("liste les jeux avec le nombre de membres", async () => {
    const { app } = await setupApp()
    const res = await request(app).get("/api/games")
    const lol = res.body.games.find((g: { slug: string }) => g.slug === "league-of-legends")
    expect(lol.memberCount).toBe(1)
  })

  it("liste les comptes d'un jeu, principal en premier", async () => {
    const { app } = await setupApp()
    const res = await request(app).get("/api/games/league-of-legends/accounts")
    expect(res.body.accounts.map((a: GameAccount) => a.isMain)).toEqual([true, false])
  })

  it("renvoie 404 pour un jeu inconnu", async () => {
    const { app } = await setupApp()
    expect((await request(app).get("/api/games/tetris/accounts")).status).toBe(404)
  })

  it("expose le profil public d'un membre", async () => {
    const { app } = await setupApp()
    const res = await request(app).get("/api/members/RedarDG")
    expect(res.body.member.accounts).toHaveLength(7)
    expect((await request(app).get("/api/members/inconnu")).status).toBe(404)
  })
})
