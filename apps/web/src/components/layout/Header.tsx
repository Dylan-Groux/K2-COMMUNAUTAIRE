import { Link } from "react-router"

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-[95] border-b border-white/[.07] bg-[#060608]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link to="/" className="font-display font-bold">
          QLS
        </Link>
        <nav className="flex items-center gap-5 text-xs text-white/55">
          <Link to="/lore">Lore</Link>
          <Link to="/steam">Steam</Link>
        </nav>
      </div>
    </header>
  )
}
