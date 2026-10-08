import { Link } from "react-router"
import { useLogout, useSession } from "@/features/auth/queries"

export function Header() {
  const { data: user } = useSession()
  const logout = useLogout()

  return (
    <header className="fixed inset-x-0 top-0 z-[95] border-b border-white/[.07] bg-[#060608]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link to="/" className="font-display font-bold">
          QLS
        </Link>
        <nav className="flex items-center gap-5 text-xs text-white/55">
          <Link to="/lore">Lore</Link>
          <Link to="/jeux">Jeux</Link>
          <Link to="/profil">Profil</Link>
          {user ? (
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="rounded-full bg-[#5865F2] px-4 py-2 text-white"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-[#5865F2] px-4 py-2 text-white"
            >
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
