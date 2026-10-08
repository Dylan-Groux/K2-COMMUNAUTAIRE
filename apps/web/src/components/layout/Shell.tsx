import type { ReactNode } from "react"
import { Header } from "./Header"

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#060608] text-white">
      <Header />
      <div className="grain-overlay" />
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-36 md:px-10">
        {children}
      </div>
    </main>
  )
}
