import request from "supertest"
import { describe, expect, it } from "vitest"
import type { GameAccount } from "@k2/shared"
import { seedMembers } from "../src/db/seed"
import { setupApp } from "./helpers"

describe("API publique", () => {
  it("ne propose plus de routes de compte ou de connexion", async () => {
    const { app } = setupApp()
    expect((await request(app).post("/api/auth/login")).status).toBe(404)
    expect((await request(app).get("/api/me/accounts")).status).toBe(404)
  })
})

describe("répertoire public", () => {
  it("liste les jeux avec le nombre de membres", async () => {
    const { app } = setupApp()
    const res = await request(app).get("/api/games")
    const lol = res.body.games.find(
      (g: { slug: string }) => g.slug === "league-of-legends",
    )
    expect(lol.memberCount).toBe(1)
  })

  it("liste les comptes d'un jeu, principal en premier", async () => {
    const { app } = setupApp()
    const res = await request(app).get("/api/games/league-of-legends/accounts")
    expect(res.body.accounts.map((a: GameAccount) => a.isMain)).toEqual([
      true,
      false,
    ])
  })

  it("renvoie 404 pour un jeu inconnu", async () => {
    const { app } = setupApp()
    expect((await request(app).get("/api/games/tetris/accounts")).status).toBe(
      404,
    )
  })

  it("expose le profil public d'un membre", async () => {
    const { app } = setupApp()
    const res = await request(app).get("/api/members/RedarDG")
    expect(res.body.member.accounts).toHaveLength(7)
    expect((await request(app).get("/api/members/inconnu")).status).toBe(404)
  })
})

describe("seed", () => {
  it("publie les profils Steam des membres, sans doublon si relancé", async () => {
    const { app, db } = setupApp()
    expect(seedMembers(db)).toEqual([])
    const res = await request(app).get("/api/games/steam/accounts")
    expect(res.body.accounts.map((a: GameAccount) => a.pseudo).sort()).toEqual([
      "Alex",
      "JLB",
      "Neroo",
      "RedarDG",
      "Semajike",
    ])
    expect(
      res.body.accounts.every((a: GameAccount) =>
        a.url?.startsWith("https://steamcommunity.com/"),
      ),
    ).toBe(true)
  })
})
