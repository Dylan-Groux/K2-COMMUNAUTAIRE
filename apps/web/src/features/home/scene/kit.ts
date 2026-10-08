import * as THREE from "three"

export const COL = {
  night: 0x080b16,
  cyan: 0x45e1ff,
  apex: 0xff4d3a,
  rl: 0x3aa0ff,
  aniimo: 0x6fe0a8,
  lol: 0xd4ad55,
  signal: 0xff6a3d,
}

/** Espacement vertical des stations. */
export const STEP = 7
export const stationY = (i: number) => -i * STEP

/** État partagé par toutes les stations à chaque image. */
export type Frame = {
  /** Progression lissée du scroll, [0, 1]. */
  v: number
  /** Temps écoulé en secondes (figé si mouvement réduit). */
  t: number
  /** Hauteur que regarde la caméra. */
  ly: number
  mobile: boolean
  camera: THREE.PerspectiveCamera
}

export type Station = { update(frame: Frame): void }

export function canvasTexture(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext("2d")!, w, h)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Petits outils partagés (texture de halo, matériaux émissifs…). */
export function createKit() {
  const glowTex = canvasTexture(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    r.addColorStop(0, "rgba(255,255,255,1)")
    r.addColorStop(0.25, "rgba(255,255,255,.45)")
    r.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
  })

  const glow = (color: number, size: number, opacity = 1) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    sprite.scale.setScalar(size)
    return sprite
  }

  const emissive = (hex: number, intensity = 1) =>
    new THREE.MeshStandardMaterial({
      color: hex,
      emissive: hex,
      emissiveIntensity: intensity,
      roughness: 0.4,
    })

  /** Nuage de points additifs dont on réécrit les positions (et couleurs) à chaque image. */
  const points = (
    count: number,
    material: THREE.PointsMaterialParameters,
    withColors = false,
  ) => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const colors = withColors ? new Float32Array(count * 3) : null
    if (colors)
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    const mesh = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: glowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: withColors,
        ...material,
      }),
    )
    const commit = () => {
      geometry.attributes.position.needsUpdate = true
      if (colors) geometry.attributes.color.needsUpdate = true
    }
    return { mesh, positions, colors: colors!, commit }
  }

  return { glowTex, glow, emissive, points }
}

export type Kit = ReturnType<typeof createKit>

/** Libère la mémoire GPU de tout ce qui est attaché à la scène. */
export function disposeScene(scene: THREE.Object3D) {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh
    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : []
    for (const material of materials) {
      ;(material as THREE.MeshBasicMaterial).map?.dispose()
      material.dispose()
    }
  })
}
