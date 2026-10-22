/** Maths du scroll : progression globale v ∈ [0, 1] découpée en fenêtres égales, une par station. */

export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v))
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const fract = (v: number) => v - Math.floor(v)

/**
 * Part de l'écart entre deux stations où la station reste posée. Le reste est le passage :
 * plus court, donc la caméra y file plus vite vers la station suivante.
 */
const DWELL = 0.68
/** Hauteur de scroll par station (vh), toutes les stations ont la même durée. */
const STEP_VH = 130

/** Début et fin de chaque station pour `count` stations (la première et la dernière touchent les bords). */
export function layoutWindows(count: number): [number, number][] {
  const step = 1 / (count - 1)
  const half = (step * DWELL) / 2
  return Array.from({ length: count }, (_, i) => [
    Math.max(0, i * step - half),
    Math.min(1, i * step + half),
  ])
}

/** Hauteur de la zone de scroll (vh) pour `count` stations. */
export const scrollHeight = (count: number) => 100 + (count - 1) * STEP_VH

// Les stations de jeu changent selon ce qui est joué : la mise en page est recalculée par setStationCount.
export let WINDOWS = layoutWindows(7)
/** Position de scroll où la station est pleinement visible (cible des boutons de navigation). */
export let CENTERS = WINDOWS.map((_, i) => i / (WINDOWS.length - 1))
let fade = (1 - DWELL) / (WINDOWS.length - 1)

export function setStationCount(count: number) {
  WINDOWS = layoutWindows(count)
  CENTERS = WINDOWS.map((_, i) => i / (count - 1))
  fade = (1 - DWELL) / (count - 1)
}

/** Opacité de la station i à la progression v. */
export function sceneAlpha(i: number, v: number) {
  const [a, b] = WINDOWS[i]
  const last = WINDOWS.length - 1
  const fadeIn = i === 0 ? 1 : smoothstep(a - fade, a, v)
  const fadeOut = i === last ? 1 : 1 - smoothstep(b, b + fade, v)
  return fadeIn * fadeOut
}

/** Progression locale [0, 1] à l'intérieur de la fenêtre de la station i. */
export const localProgress = (i: number, v: number) =>
  clamp((v - WINDOWS[i][0]) / (WINDOWS[i][1] - WINDOWS[i][0]), 0, 1)

export function activeStation(v: number) {
  let active = 0
  let best = -1
  WINDOWS.forEach((_, i) => {
    const a = sceneAlpha(i, v)
    if (a > best) {
      best = a
      active = i
    }
  })
  return active
}

/**
 * Scroll arrêté dans un passage : station vers laquelle l'aimanter, dans le sens du mouvement.
 * null si le scroll est déjà posé sur une station.
 */
export function snapTarget(v: number, direction: number) {
  for (let i = 0; i < WINDOWS.length - 1; i++)
    if (v > WINDOWS[i][1] && v < WINDOWS[i + 1][0])
      return direction < 0 ? i : i + 1
  return null
}
