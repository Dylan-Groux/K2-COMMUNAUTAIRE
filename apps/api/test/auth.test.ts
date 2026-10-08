import request from "supertest"
import { describe, expect, it } from "vitest"
import { DEMO_USER } from "../src/db/seed"
import { newMember, setupApp } from "./helpers"

describe("auth", () => {
  it("inscrit un membre et ouvre sa session", async () => {
    const { agent } = await setupApp()

    const res = await agent.post("/api/auth/register").send(newMember)
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ email: "nox@k2.gg", pseudo: "Nox" })
    expect(res.body.user.passwordHash).toBeUndefined()

    const me = await agent.get("/api/auth/me")
    expect(me.body.user.pseudo).toBe("Nox")
  })

  it("refuse un pseudo déjà pris, sans tenir compte de la casse", async () => {
    const { app } = await setupApp()
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...newMember, pseudo: "redardg" })
    expect(res.status).toBe(409)
  })

  it("rejette les données invalides avec un message lisible", async () => {
    const { app } = await setupApp()
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...newMember, password: "court" })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("8 caractères minimum")
  })

  it("connecte le membre de démo puis le déconnecte", async () => {
    const { agent } = await setupApp()

    const login = await agent
      .post("/api/auth/login")
      .send({ email: DEMO_USER.email, password: DEMO_USER.password })
    expect(login.status).toBe(200)
    expect((await agent.get("/api/auth/me")).status).toBe(200)

    await agent.post("/api/auth/logout")
    expect((await agent.get("/api/auth/me")).status).toBe(401)
  })

  it("refuse un mauvais mot de passe", async () => {
    const { app } = await setupApp()
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: DEMO_USER.email, password: "faux" })
    expect(res.status).toBe(401)
  })
})
