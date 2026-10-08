import { useEffect, useRef, useState } from "react"
import { renderPageImage, type PDFDocumentProxy } from "./pdf"

type Props = {
  pdf: PDFDocumentProxy | null
  pageNumber: number
  /** Hauteur / largeur, pour réserver la place avant le rendu. */
  ratio: number
  alt: string
  /** Dessiner tout de suite au lieu d'attendre l'approche du scroll. */
  eager?: boolean
}

/** Une page du PDF, dessinée seulement quand elle approche de l'écran. */
export function PdfPage({ pdf, pageNumber, ratio, alt, eager = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(eager)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (near || !ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true)
      },
      { rootMargin: "1500px 0px" },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [near])

  useEffect(() => {
    if (!near || !pdf || !ref.current) return
    let url: string | null = null
    let alive = true
    renderPageImage(pdf, pageNumber, ref.current.clientWidth).then(
      (result) => {
        url = result
        if (alive) setSrc(result)
        else URL.revokeObjectURL(result)
      },
      () => alive && setFailed(true),
    )
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [near, pdf, pageNumber])

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden bg-white/[.04]"
      style={src ? undefined : { aspectRatio: `1 / ${ratio}` }}
    >
      {src ? (
        <img src={src} alt={alt} className="block w-full" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-xs text-white/25">
          {failed ? `Page ${pageNumber} indisponible` : `Page ${pageNumber}`}
        </span>
      )}
    </div>
  )
}
