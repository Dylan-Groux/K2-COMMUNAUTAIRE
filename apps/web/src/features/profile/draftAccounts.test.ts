import { describe, expect, it } from "vitest"
import { account } from "@/test/fixtures"
import {
  accountsForGame,
  addMain,
  addSmurf,
  fromAccount,
  removeSmurf,
  setRankTier,
  toInput,
} from "./draftAccounts"

const main = fromAccount(account({ slug: "valorant" }))

describe("draftAccounts", () => {
  it("n'ajoute un smurf que si un compte principal existe", () => {
    expect(addSmurf([], "valorant")).toEqual([])
    const withSmurf = addSmurf([main], "valorant")
    expect(withSmurf).toHaveLength(2)
    expect(withSmurf[1]).toMatchObject({ isMain: false, identifier: "", rankTier: "Non classé" })
  })

  it("n'ajoute pas un second compte principal", () => {
    expect(addMain([main], "valorant")).toHaveLength(1)
    expect(addMain([], "valorant")[0].isMain).toBe(true)
  })

  it("ne supprime jamais le compte principal", () => {
    const list = addSmurf([main], "valorant")
    expect(removeSmurf(list, main.key)).toHaveLength(2)
    expect(removeSmurf(list, list[1].key)).toEqual([main])
  })

  it("efface division et LP quand le rang est redéclaré", () => {
    const [updated] = setRankTier([main], main.key, "Or")
    expect(updated).toMatchObject({ rankTier: "Or", rankDivision: null, rankLp: null })
  })

  it("trie le principal en premier", () => {
    const list = addSmurf([main], "valorant").reverse()
    expect(accountsForGame(list, "valorant")[0].isMain).toBe(true)
  })

  it("retire la clé locale avant l'envoi", () => {
    expect(toInput(main)).not.toHaveProperty("key")
    expect(toInput(main).id).toBe(main.id)
  })
})
