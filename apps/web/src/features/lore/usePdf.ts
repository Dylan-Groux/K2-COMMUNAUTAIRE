import { useEffect, useState } from "react"
import { loadPdf, pageRatio, type PDFDocumentProxy } from "./pdf"

/** Format des planches (portrait vertical), utilisé tant que le PDF n'a pas répondu. */
const DEFAULT_RATIO = 1.78

export function usePdf(url: string | undefined) {
  const [state, setState] = useState<{
    pdf: PDFDocumentProxy | null
    ratio: number
    error: boolean
  }>({
    pdf: null,
    ratio: DEFAULT_RATIO,
    error: false,
  })

  useEffect(() => {
    if (!url) return
    let alive = true
    loadPdf(url)
      .then(async (pdf) => {
        const ratio = await pageRatio(pdf, 1)
        if (alive) setState({ pdf, ratio, error: false })
      })
      .catch(() => alive && setState((s) => ({ ...s, error: true })))
    return () => {
      alive = false
    }
  }, [url])

  return state
}
