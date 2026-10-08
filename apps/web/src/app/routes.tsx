import type { RouteObject } from "react-router"
import { RouteLoader } from "@/components/RouteLoader"
import { AuthPage } from "@/features/auth/AuthPage"
import { GameDetailPage } from "@/features/games/GameDetailPage"
import { GamesPage } from "@/features/games/GamesPage"
import { MemberPage } from "@/features/members/MemberPage"
import { ProfilePage } from "@/features/profile/ProfilePage"
import { SteamDirectoryPage } from "@/features/steam/SteamDirectoryPage"

export const routes: RouteObject[] = [
  {
    path: "/",
    HydrateFallback: RouteLoader,
    // L'accueil (Three.js, GSAP, Lenis) est chargé à part pour alléger les autres pages.
    lazy: async () => ({
      Component: (await import("@/features/home/HomePage")).default,
    }),
  },
  { path: "/steam", Component: SteamDirectoryPage },
  { path: "/auth", Component: AuthPage },
  { path: "/profil", Component: ProfilePage },
  { path: "/membre/:pseudo", Component: MemberPage },
  { path: "/jeux", Component: GamesPage },
  { path: "/jeux/:slug", Component: GameDetailPage },
  // Le lore embarque pdf.js : chargé seulement quand on ouvre l'onglet.
  {
    path: "/lore",
    HydrateFallback: RouteLoader,
    lazy: async () => ({
      Component: (await import("@/features/lore/LorePage")).default,
    }),
  },
  {
    path: "/lore/:slug",
    HydrateFallback: RouteLoader,
    lazy: async () => ({
      Component: (await import("@/features/lore/ChapterPage")).default,
    }),
  },
]
