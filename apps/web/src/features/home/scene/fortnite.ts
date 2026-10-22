import * as THREE from "three"
import { fract, localProgress, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const TAU = Math.PI * 2
const TILE = 0.6

const backOut = (k: number) =>
  1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2)

/** Pièces de la tour, dans l'ordre de construction : [type, x, étage, z, rotation]. */
const BUILD: ["wall" | "ramp" | "floor", number, number, number, number][] = [
  ["floor", 0, 0, 0, 0],
  ["wall", 0, 0, -1, 0],
  ["ramp", 0, 0, 0, 0],
  ["wall", -1, 0, 0, Math.PI / 2],
  ["floor", 0, 1, 0, 0],
  ["wall", 0, 1, -1, 0],
  ["ramp", 0, 1, 0, Math.PI / 2],
  ["wall", 1, 1, 0, Math.PI / 2],
  ["floor", 0, 2, 0, 0],
  ["ramp", 0, 2, 0, Math.PI],
  ["wall", 0, 2, 1, 0],
  ["floor", 0, 3, 0, 0],
]

/**
 * Station Fortnite : une île, une tour de murs, rampes et planchers qui se construit pièce par pièce
 * avec le scroll, le Bus de combat qui passe au-dessus et des planeurs qui descendent vers l'île.
 */
export function createFortnite(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 1.1
  parent.add(group)

  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 1.7, 0.35, 24),
    new THREE.MeshStandardMaterial({
      color: 0x2b4d3a,
      roughness: 0.9,
      flatShading: true,
    }),
  )
  const sand = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.06, 6, 64),
    new THREE.MeshStandardMaterial({ color: 0xd9c08a, roughness: 1 }),
  )
  sand.rotation.x = Math.PI / 2
  sand.position.y = 0.12
  group.add(island, sand)

  const wood = new THREE.MeshStandardMaterial({
    color: 0xb98552,
    roughness: 0.8,
    flatShading: true,
  })
  const edgeMaterial = new THREE.LineBasicMaterial({ color: COL.fortnite })
  const tower = new THREE.Group()
  tower.position.y = 0.18
  group.add(tower)
  const pieces = BUILD.map(([type, x, floor, z, rot]) => {
    const geometry =
      type === "floor"
        ? new THREE.BoxGeometry(TILE, 0.04, TILE)
        : new THREE.BoxGeometry(
            TILE,
            type === "ramp" ? 0.04 : TILE,
            type === "ramp" ? TILE * 1.41 : 0.04,
          )
    const piece = new THREE.Group()
    piece.add(
      new THREE.Mesh(geometry, wood),
      new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial),
    )
    piece.position.set(
      (x * TILE) / 2,
      floor * TILE + (type === "floor" ? 0 : TILE / 2),
      (z * TILE) / 2,
    )
    piece.rotation.y = rot
    if (type === "ramp") piece.rotation.x = Math.PI / 4
    tower.add(piece)
    return piece
  })

  // Le Bus de combat : une carrosserie bleue sous son ballon
  const bus = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.32, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x3a7bd5, roughness: 0.5 }),
  )
  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x5aa0ff, roughness: 0.4 }),
  )
  balloon.position.y = 0.55
  const tether = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xdfe6ff }),
  )
  tether.position.y = 0.3
  bus.add(body, balloon, tether)
  bus.scale.setScalar(0.75)
  group.add(bus)

  const glider = new THREE.Shape()
  glider.moveTo(-0.14, 0)
  glider.lineTo(0, 0.1)
  glider.lineTo(0.14, 0)
  glider.lineTo(0, 0.03)
  const gliderGeometry = new THREE.ShapeGeometry(glider)
  const gliders = Array.from({ length: 6 }, (_, i) => {
    const g = new THREE.Mesh(
      gliderGeometry,
      new THREE.MeshBasicMaterial({
        color: i % 2 ? COL.fortnite : 0xff7ad9,
        side: THREE.DoubleSide,
      }),
    )
    g.rotation.x = -Math.PI / 2.4
    group.add(g)
    return { g, ph: i / 6, a: (i / 6) * TAU }
  })

  return {
    update({ v, t, mobile }: Frame) {
      const lf = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = 0.5 + v * 1.1 + Math.sin(t * 0.2) * 0.05

      pieces.forEach((piece, i) => {
        const k = smoothstep(
          i / pieces.length,
          (i + 1) / pieces.length,
          lf * 1.1,
        )
        piece.scale.setScalar(Math.max(0.001, backOut(k)))
        piece.visible = k > 0
      })

      const busAngle = t * 0.25
      bus.position.set(Math.cos(busAngle) * 2.1, 2.5, Math.sin(busAngle) * 2.1)
      bus.rotation.y = -busAngle

      for (const { g, ph, a } of gliders) {
        const k = fract(ph + t * 0.12)
        const r = 2.4 * (1 - k * 0.7)
        g.position.set(Math.cos(a + k) * r, 2.4 - k * 2.1, Math.sin(a + k) * r)
        g.visible = k < 0.95
      }
    },
  }
}
