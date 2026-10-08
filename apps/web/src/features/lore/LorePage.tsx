import { Link } from "react-router"
import { Shell } from "@/components/layout/Shell"
import { CHAPTERS, isPublished, SERIES, type Chapter } from "./chapters"
import { PdfPage } from "./PdfPage"
import { usePdf } from "./usePdf"

function Cover({ chapter }: { chapter: Chapter & { pdf: string } }) {
  const { pdf, ratio } = usePdf(chapter.pdf)
  return (
    <PdfPage
      pdf={pdf}
      pageNumber={1}
      ratio={ratio}
      alt={`Couverture du chapitre ${chapter.number}`}
      eager
    />
  )
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const label = `Chapitre ${chapter.number}`
  if (!isPublished(chapter)) {
    return (
      <article className="flex flex-col gap-4 border border-dashed border-white/15 p-5">
        <div className="grid aspect-[9/16] place-items-center bg-white/[.03] text-xs uppercase tracking-[.24em] text-white/30">
          Prochainement
        </div>
        <div>
          <p className="text-xs uppercase tracking-[.24em] text-white/40">
            {label}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {chapter.title}
          </h2>
          <p className="mt-2 text-sm text-white/40">{chapter.summary}</p>
        </div>
      </article>
    )
  }
  return (
    <Link
      to={`/lore/${chapter.slug}`}
      className="group flex flex-col gap-4 border border-white/10 bg-white/[.03] p-5 transition hover:border-white/40"
    >
      <div className="overflow-hidden border border-white/10 transition group-hover:scale-[1.01]">
        <Cover chapter={chapter} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[.24em] text-white/50">
          {label} · {chapter.pages} pages
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">
          {chapter.title}
        </h2>
        <p className="mt-2 text-sm text-white/55">{chapter.summary}</p>
        <span className="mt-4 inline-block text-sm text-white transition group-hover:translate-x-1">
          Lire →
        </span>
      </div>
    </Link>
  )
}

export default function LorePage() {
  return (
    <Shell>
      <p className="eyebrow">Lore QLS</p>
      <h1 className="page-title">{SERIES}.</h1>
      <p className="mt-6 max-w-xl text-white/50">
        L'histoire du serveur, en manga. Six inconnus, quatorze jours, et
        quelqu'un qui lit leur histoire avant eux.
      </p>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CHAPTERS.map((chapter) => (
          <ChapterCard key={chapter.slug} chapter={chapter} />
        ))}
      </div>
    </Shell>
  )
}
