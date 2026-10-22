import { useEffect, useRef, type RefObject } from "react"
import { createScene, type HomeScene } from "./scene/createScene"
import {
  activeStation,
  CENTERS,
  clamp,
  localProgress,
  sceneAlpha,
  smoothstep,
  snapTarget,
} from "./scroll"

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

const maxScroll = () =>
  Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

export function scrollToStation(i: number) {
  const index = Math.max(0, Math.min(CENTERS.length - 1, i))
  window.scrollTo({
    top: CENTERS[index] * maxScroll(),
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  })
}

/** Rejoindre est toujours la dernière station, quel que soit le nombre de jeux à l'affiche. */
export const scrollToJoin = () => scrollToStation(CENTERS.length - 1)

/** Délai sans scroll au-delà duquel on considère que le visiteur s'est arrêté. */
const SNAP_DELAY = 220

/**
 * La page est une scène fixe : le scroll (une zone vide) ne sert qu'à produire une progression [0, 1].
 * À chaque image, on lisse cette progression puis on met à jour les calques DOM ([data-s]) et la scène 3D.
 * Arrêté entre deux stations, le scroll est aimanté vers la suivante dans le sens du mouvement.
 * `layoutKey` change quand la liste des stations change : les calques sont alors relus.
 */
export function useScrollStage(
  rootRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onActiveChange: (station: number) => void,
  layoutKey: string,
) {
  const sceneRef = useRef<HomeScene | null>(null)
  const onActiveRef = useRef(onActiveChange)
  onActiveRef.current = onActiveChange
  const layoutDirty = useRef(true)

  useEffect(() => {
    layoutDirty.current = true
  }, [layoutKey])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = prefersReducedMotion()

    let words: HTMLElement[] = []
    let layers: HTMLElement[] = []
    const readLayers = () => {
      words = [...root.querySelectorAll<HTMLElement>(".word")]
      layers = [...root.querySelectorAll<HTMLElement>("[data-s]")].filter(
        (el) => !el.classList.contains("word"),
      )
    }
    const bar = root.querySelector<HTMLElement>(".bar")
    const hint = root.querySelector<HTMLElement>(".hint")

    let target = 0
    let lastY = window.scrollY
    let direction = 1
    let snapTimer = 0
    const readScroll = () => {
      target = clamp(window.scrollY / maxScroll(), 0, 1)
    }
    const onScroll = () => {
      readScroll()
      if (window.scrollY !== lastY)
        direction = Math.sign(window.scrollY - lastY)
      lastY = window.scrollY
      clearTimeout(snapTimer)
      snapTimer = window.setTimeout(() => {
        const station = snapTarget(target, direction)
        if (station !== null) scrollToStation(station)
      }, SNAP_DELAY)
    }
    readScroll()
    let progress = target
    let lastActive = -1

    function updateDom(v: number) {
      if (layoutDirty.current) {
        layoutDirty.current = false
        readLayers()
        readScroll()
        lastActive = -1
      }
      words.forEach((word, i) => {
        const a = sceneAlpha(i, v)
        const drift = (localProgress(i, v) - 0.5) * 5
        word.style.opacity = String(a)
        ;(word.children[0] as HTMLElement).style.transform =
          `translateX(${-(1 - a) * 14 - drift}vw)`
        ;(word.children[1] as HTMLElement).style.transform =
          `translateX(${(1 - a) * 14 + drift}vw)`
      })
      for (const el of layers) {
        const a = sceneAlpha(Number(el.dataset.s), v)
        el.style.opacity = String(a)
        el.style.transform = `translateY(${(1 - a) * 28}px)`
        el.classList.toggle("off", a < 0.02)
      }
      const active = activeStation(v)
      if (active !== lastActive) {
        lastActive = active
        onActiveRef.current(active)
      }
      if (bar) bar.style.transform = `scaleX(${v})`
      if (hint) hint.style.opacity = String(1 - smoothstep(0, 0.04, v))
    }

    // La 3D est un bonus : sans WebGL, le site reste lisible.
    const canvas = canvasRef.current
    if (canvas) {
      try {
        sceneRef.current = createScene(canvas, {
          reset: root.querySelector("#call-reset"),
          goal: root.querySelector("#call-goal"),
        })
      } catch {
        canvas.remove()
      }
    }

    const mouse = { x: 0, y: 0, sx: 0, sy: 0 }
    const onPointer = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5
      mouse.y = e.clientY / window.innerHeight - 0.5
    }
    const onResize = () => {
      readScroll()
      sceneRef.current?.resize()
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    window.addEventListener("pointermove", onPointer, { passive: true })

    let raf = 0
    let t = 0
    let last = performance.now()
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!reduce) t += dt
      progress += (target - progress) * (reduce ? 1 : Math.min(1, dt * 6))
      mouse.sx += (mouse.x - mouse.sx) * 0.05
      mouse.sy += (mouse.y - mouse.sy) * 0.05
      updateDom(progress)
      sceneRef.current?.render(progress, t, { x: mouse.sx, y: mouse.sy })
      raf = requestAnimationFrame(frame)
    }
    updateDom(progress)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(snapTimer)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("pointermove", onPointer)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [rootRef, canvasRef])

  return sceneRef
}
