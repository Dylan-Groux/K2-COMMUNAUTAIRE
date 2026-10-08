import * as THREE from "three"
import { JOIN_STATION } from "../content"
import { lerp, smoothstep, WINDOWS } from "../scroll"
import { createAniimo } from "./aniimo"
import { createApex } from "./apex"
import { createCores } from "./core"
import { createHype } from "./hype"
import { COL, createKit, disposeScene, stationY, type Frame } from "./kit"
import { createLol } from "./lol"
import { createRocket, type Callouts } from "./rocket"

/** Hauteur visée par la caméra : posée sur chaque station pendant sa fenêtre, interpolée entre deux. */
const CAMERA_KEYS = WINDOWS.flatMap(([a, b], i) => {
  const offset = i === JOIN_STATION ? -1.3 : 0
  return [
    [a, stationY(i) + 0.2 + offset],
    [b, stationY(i) - 0.15 + offset],
  ]
})

export function cameraTargetY(v: number) {
  for (let i = 0; i < CAMERA_KEYS.length - 1; i++) {
    const [a, y0] = CAMERA_KEYS[i]
    const [b, y1] = CAMERA_KEYS[i + 1]
    if (v <= b) return lerp(y0, y1, smoothstep(a, b, v))
  }
  return CAMERA_KEYS[CAMERA_KEYS.length - 1][1]
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
  const stations = [
    cores,
    hype,
    createApex(scene, kit),
    createRocket(scene, kit, callouts),
    createAniimo(scene, kit),
    createLol(scene, kit),
  ]

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
      for (const station of stations) station.update(frame)
      renderer.render(scene, camera)
    },

    dispose() {
      disposeScene(scene)
      kit.glowTex.dispose()
      renderer.dispose()
    },
  }
}

export type HomeScene = ReturnType<typeof createScene>
