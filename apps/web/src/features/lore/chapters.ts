/** Les chapitres du manga de QLS. Ajouter un chapitre : déposer le PDF dans public/lore/ et ajouter une entrée ici. */

export type Chapter = {
  number: number
  slug: string
  title: string
  summary: string
  /** Chemin public du PDF ; absent tant que le chapitre n'est pas sorti. */
  pdf?: string
  pages?: number
}

export const SERIES = "Le Livre des Cycles"

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    slug: "chapitre-1",
    title: "Le Commencement",
    summary:
      "Des inconnus, des vies ordinaires, et le même morceau de photo glissé dans leur journée : « Gare — 23:59 ». Cette nuit-là, le cycle commence.",
    pdf: "/lore/chapitre-01-le-commencement.pdf",
    pages: 67,
  },
  {
    number: 2,
    slug: "chapitre-2",
    title: "Quatorze jours",
    summary: "Jour 02 / 14. Le compte à rebours est lancé.",
  },
]

export const findChapter = (slug: string | undefined) =>
  CHAPTERS.find((c) => c.slug === slug)

export const isPublished = (
  chapter: Chapter,
): chapter is Chapter & { pdf: string } => !!chapter.pdf
