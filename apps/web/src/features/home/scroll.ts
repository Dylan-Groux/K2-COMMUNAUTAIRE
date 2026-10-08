/** Maths du scroll : progression globale v ∈ [0, 1] découpée en fenêtres, une par station. */

export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v))
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const fract = (v: number) => v - Math.floor(v)

/** Début et fin de chaque station (la 3, Rocket League, a une fenêtre longue pour son animation). */
export const WINDOWS: [number, number][] = [
  [0, 0.07],
  [0.12, 0.2],
  [0.25, 0.32],
  [0.37, 0.6],
  [0.65, 0.72],
  [0.77, 0.85],
  [0.92, 1],
]
const LAST = WINDOWS.length - 1
const FADE = 0.045

/** Position de scroll où la station est pleinement visible (cible des boutons de navigation). */
export const CENTERS = WINDOWS.map(([a, b], i) =>
  i === 0 ? 0 : i === LAST ? 1 : (a + b) / 2,
)

/** Opacité de la station i à la progression v. */
export function sceneAlpha(i: number, v: number) {
  const [a, b] = WINDOWS[i]
  const fadeIn = i === 0 ? 1 : smoothstep(a - FADE, a, v)
  const fadeOut = i === LAST ? 1 : 1 - smoothstep(b, b + FADE, v)
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
