import { redirect, type RouteObject } from "react-router"
import { RouteLoader } from "@/components/RouteLoader"
import { MemberPage } from "@/features/members/MemberPage"
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
  // Annuaire : Steam par défaut, puis un jeu par onglet (/steam/valorant…)
  { path: "/steam/:slug?", Component: SteamDirectoryPage },
  { path: "/membre/:pseudo", Component: MemberPage },
  // Anciennes adresses de l'onglet Jeux, fusionné dans l'annuaire Steam
  { path: "/jeux", loader: () => redirect("/steam") },
  {
    path: "/jeux/:slug",
    loader: ({ params }) => redirect(`/steam/${params.slug}`),
  },
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
