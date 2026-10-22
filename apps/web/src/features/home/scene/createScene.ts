import * as THREE from "three"
import { TRACKED_GAMES, type GameKey } from "../content"
import { lerp, smoothstep, WINDOWS } from "../scroll"
import { createCores } from "./core"
import { createGeneric } from "./generic"
import { createHype } from "./hype"
import { createIdle } from "./idle"
import {
  COL,
  createKit,
  disposeScene,
  stationY,
  type Frame,
  type Station,
} from "./kit"
import { STATION_MODELS, type StationFactory } from "./registry"
import type { Callouts } from "./rocket"

/** Station entre le Top 48 h et Rejoindre : un jeu modélisé, un jeu sans modèle, ou la veille. */
export type SceneEntry =
  | { kind: "model"; key: GameKey }
  | { kind: "generic"; name: string; color: THREE.ColorRepresentation }
  | { kind: "idle" }

/** Première place des stations de jeu (après l'accueil et le Top 48 h). */
const FIRST_GAME_SLOT = 2

/** Hauteur visée par la caméra : posée sur chaque station pendant sa fenêtre, interpolée entre deux. */
export function cameraTargetY(v: number) {
  const join = WINDOWS.length - 1
  const keys = WINDOWS.flatMap(([a, b], i) => {
    const offset = i === join ? -1.3 : 0
    return [
      [a, stationY(i) + 0.2 + offset],
      [b, stationY(i) - 0.15 + offset],
    ]
  })
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, y0] = keys[i]
    const [b, y1] = keys[i + 1]
    if (v <= b) return lerp(y0, y1, smoothstep(a, b, v))
  }
  return keys[keys.length - 1][1]
}

/** Crée la scène 3D. Lève une erreur si WebGL est indisponible. */
export function createScene(canvas: HTMLCanvasElement, callouts: Callouts) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(COL.night, 12, 38)
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)

  // Intensités × π : éclairage physique de three r155+
  scene.add(new THREE.HemisphereLight(0x8a96ff, 0x0a0c18, 0.55 * Math.PI))
  const key = new THREE.DirectionalLight(0xffffff, 1.1 * Math.PI)
  key.position.set(-3, 6, 6)
  scene.add(key)

  const kit = createKit()
  const cores = createCores(scene, kit)
  const hype = createHype(scene, kit)
  cores.setJoinSlot(FIRST_GAME_SLOT)

  // Chaque station de jeu vit dans son propre groupe : on la retire et on libère sa mémoire GPU d'un coup.
  let games: { holder: THREE.Group; station: Station }[] = []
  let lineupRun = 0
  let disposed = false

  function buildStation(
    entry: SceneEntry,
    factory: StationFactory | null,
    slot: number,
    holder: THREE.Group,
  ): Station {
    if (entry.kind === "idle") return createIdle(holder, kit, slot)
    if (entry.kind === "model" && factory)
      return factory(holder, kit, slot, callouts)
    // Jeu sans modèle, ou modèle qui n'a pas pu se télécharger : station générique.
    const { name, color } =
      entry.kind === "generic"
        ? entry
        : {
            name: TRACKED_GAMES[entry.key].label,
            color: TRACKED_GAMES[entry.key].hex,
          }
    return createGeneric(holder, kit, slot, name, color)
  }

  /** Remplace les stations de jeu. Les modèles se téléchargent d'abord ; un appel plus récent annule celui-ci. */
  async function setLineup(entries: SceneEntry[]) {
    const run = ++lineupRun
    const factories = await Promise.all(
      entries.map((entry) =>
        entry.kind === "model"
          ? STATION_MODELS[entry.key]().catch(() => null)
          : null,
      ),
    )
    if (run !== lineupRun || disposed) return

    for (const { holder } of games) {
      scene.remove(holder)
      disposeScene(holder)
    }
    // Les textes « Flip reset » et « But ! » appartiennent à Rocket League : on les éteint s'il disparaît.
    for (const el of [callouts.reset, callouts.goal])
      el?.style.setProperty("opacity", "0")

    games = entries.map((entry, i) => {
      const holder = new THREE.Group()
      scene.add(holder)
      const station = buildStation(
        entry,
        factories[i],
        FIRST_GAME_SLOT + i,
        holder,
      )
      return { holder, station }
    })
    cores.setJoinSlot(FIRST_GAME_SLOT + entries.length)
  }

  let baseZ = 9
  let mobile = false
  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.aspect = window.innerWidth / window.innerHeight
    mobile = window.innerWidth < 640
    baseZ = Math.max(
      9,
      2.1 / (Math.tan(THREE.MathUtils.degToRad(16)) * camera.aspect),
    )
    camera.updateProjectionMatrix()
  }
  resize()

  return {
    setMembers: cores.setMembers,
    setGames: hype.setGames,
    setLineup,
    resize,

    /** v : progression lissée, t : temps, mouse : position lissée du pointeur centrée sur 0. */
    render(v: number, t: number, mouse: { x: number; y: number }) {
      const ly = cameraTargetY(v)
      const yOff = mobile ? -1 : 0
      camera.position.set(
        mouse.x * 1.2 + (mobile ? 0 : 0.4),
        ly + yOff + 1.1 - mouse.y * 0.6,
        baseZ,
      )
      camera.lookAt(mobile ? 0 : 0.4, ly + yOff, 0)

      const frame: Frame = { v, t, ly, mobile, camera }
      cores.update(frame)
      hype.update(frame)
      for (const { station } of games) station.update(frame)
      renderer.render(scene, camera)
    },

    dispose() {
      disposed = true
      disposeScene(scene)
      kit.glowTex.dispose()
      renderer.dispose()
    },
  }
}

export type HomeScene = ReturnType<typeof createScene>
