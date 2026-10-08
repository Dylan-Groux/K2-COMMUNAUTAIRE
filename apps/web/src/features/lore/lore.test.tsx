import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockApi, renderRoute } from "@/test/render"
import { CHAPTERS, findChapter, isPublished } from "./chapters"

// jsdom ne sait pas dessiner un PDF : le PDF « charge » sans jamais répondre, les pages restent en attente.
vi.mock("./pdf", () => ({
  loadPdf: () => new Promise(() => {}),
  pageRatio: async () => 1.78,
  renderPageImage: async () => "blob:page",
}))

describe("chapitres", () => {
  it("trouve un chapitre par son slug", () => {
    expect(findChapter("chapitre-1")?.title).toBe("Le Commencement")
    expect(findChapter("inconnu")).toBeUndefined()
  })

  it("chaque chapitre publié a un PDF dans /lore/ et des slugs uniques", () => {
    for (const c of CHAPTERS.filter(isPublished))
      expect(c.pdf).toMatch(/^\/lore\/.+\.pdf$/)
    expect(new Set(CHAPTERS.map((c) => c.slug)).size).toBe(CHAPTERS.length)
  })
})

describe("pages du lore", () => {
  beforeEach(() => {
    mockApi({
      "GET /auth/me": () => ({ status: 401, body: { error: "Non connecté" } }),
    })
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    )
  })

  it("liste les chapitres, avec un lien vers le chapitre 1", async () => {
    renderRoute("/lore")
    const link = await screen.findByRole("link", { name: /Le Commencement/ })
    expect(link).toHaveAttribute("href", "/lore/chapitre-1")
    expect(screen.getByText("Quatorze jours")).toBeInTheDocument()
    expect(screen.getByText("Prochainement")).toBeInTheDocument()
  })

  it("ouvre le lecteur du chapitre 1 avec ses 67 pages et le lien vers le PDF", async () => {
    renderRoute("/lore/chapitre-1")
    expect(
      await screen.findByRole("heading", { name: "Le Commencement" }),
    ).toBeInTheDocument()
    expect(screen.getByText("67 pages")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ouvrir le PDF" })).toHaveAttribute(
      "href",
      "/lore/chapitre-01-le-commencement.pdf",
    )
    expect(screen.getByText("Page 67")).toBeInTheDocument()
  })

  it("indique qu'un chapitre à venir n'est pas encore sorti", async () => {
    renderRoute("/lore/chapitre-2")
    expect(
      await screen.findByText("Ce chapitre n'est pas encore sorti."),
    ).toBeInTheDocument()
  })
})
