import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router"
import { Shell } from "@/components/layout/Shell"
import { StatusMessage } from "@/components/StatusMessage"
import { CHAPTERS, findChapter, isPublished, SERIES } from "./chapters"
import { PdfPage } from "./PdfPage"
import { usePdf } from "./usePdf"

/** Lecteur vertical : toutes les pages à la suite, dessinées à l'approche du scroll. */
export default function ChapterPage() {
  const chapter = findChapter(useParams().slug)
  const { pdf, ratio, error } = usePdf(chapter?.pdf)
  const [current, setCurrent] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)
  const total = pdf?.numPages ?? chapter?.pages ?? 0

  // Page affichée = celle qui traverse le milieu de l'écran.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setCurrent(Number((entry.target as HTMLElement).dataset.page))
      },
      { rootMargin: "-50% 0px -50% 0px" },
    )
    list.querySelectorAll("[data-page]").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [total])

  if (!chapter || !isPublished(chapter)) {
    return (
      <Shell>
        <StatusMessage>Ce chapitre n'est pas encore sorti.</StatusMessage>
        <Link to="/lore" className="small-action">
          ← Tous les chapitres
        </Link>
      </Shell>
    )
  }

  const next = CHAPTERS.find((c) => c.number === chapter.number + 1)

  return (
    <Shell>
      <div className="mx-auto max-w-[46rem]">
        <Link to="/lore" className="text-sm text-white/45 hover:text-white">
          ← Tous les chapitres
        </Link>
        <p className="eyebrow mt-8">
          {SERIES} · Chapitre {chapter.number}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
          {chapter.title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/45">
          <span>{total} pages</span>
          <a
            href={chapter.pdf}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-white"
          >
            Ouvrir le PDF
          </a>
        </div>

        {error ? (
          <StatusMessage>
            Impossible d'afficher le chapitre ici.{" "}
            <a
              href={chapter.pdf}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Ouvre le PDF directement
            </a>
            .
          </StatusMessage>
        ) : (
          <div ref={listRef} className="mt-10 flex flex-col gap-2">
            {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
              <div key={n} data-page={n}>
                <PdfPage
                  pdf={pdf}
                  pageNumber={n}
                  ratio={ratio}
                  alt={`Chapitre ${chapter.number}, page ${n}`}
                  eager={n <= 2}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 flex flex-col items-center gap-3 border-t border-white/10 pt-10 text-center">
          <p className="text-xs uppercase tracking-[.24em] text-white/40">
            Fin du chapitre {chapter.number}
          </p>
          {next && (
            <p className="text-white/60">
              Prochain : Chapitre {next.number} · {next.title}
            </p>
          )}
          <Link to="/lore" className="small-action mt-2">
            Tous les chapitres
          </Link>
        </div>
      </div>

      {total > 0 && !error && (
        <div
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-xs tabular-nums text-white/70 backdrop-blur"
          aria-live="polite"
        >
          Page {current} / {total}
        </div>
      )}
    </Shell>
  )
}
