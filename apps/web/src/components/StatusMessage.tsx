import type { ReactNode } from "react"

/** Message neutre pour les états chargement / vide / erreur. */
export function StatusMessage({ children }: { children: ReactNode }) {
  return <p className="py-16 text-white/35">{children}</p>
}
