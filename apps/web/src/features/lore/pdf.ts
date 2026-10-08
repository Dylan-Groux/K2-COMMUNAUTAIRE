import * as pdfjs from "pdfjs-dist"
import type { PDFDocumentProxy } from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export type { PDFDocumentProxy }

const documents = new Map<string, Promise<PDFDocumentProxy>>()

/** Ouvre un PDF une seule fois par session. pdf.js ne télécharge que les morceaux nécessaires (requêtes partielles). */
export function loadPdf(url: string) {
  let doc = documents.get(url)
  if (!doc) {
    doc = pdfjs.getDocument({ url }).promise
    doc.catch(() => documents.delete(url))
    documents.set(url, doc)
  }
  return doc
}

/** Rapport hauteur / largeur d'une page, pour réserver sa place avant de la dessiner. */
export async function pageRatio(pdf: PDFDocumentProxy, pageNumber: number) {
  const { width, height } = (await pdf.getPage(pageNumber)).getViewport({
    scale: 1,
  })
  return height / width
}

/**
 * Dessine une page à la largeur affichée puis la convertit en image JPEG.
 * Une image coûte bien moins de mémoire qu'un canvas gardé ouvert, ce qui compte sur 67 pages.
 */
export async function renderPageImage(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  cssWidth: number,
) {
  const page = await pdf.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scale =
    (cssWidth * Math.min(window.devicePixelRatio || 1, 2)) / base.width
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({ canvas, viewport }).promise
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  )
  page.cleanup()
  canvas.width = canvas.height = 0
  if (!blob) throw new Error(`Page ${pageNumber} impossible à dessiner`)
  return URL.createObjectURL(blob)
}
