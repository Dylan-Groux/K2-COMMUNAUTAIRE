import * as THREE from "three"
import { fract, localProgress, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const LOTS = 6
const GAP = 0.62

/**
 * Station Cities: Skylines II : une ville en damier qui sort de terre avec le scroll, du centre
 * vers les quartiers, ses toits éclairés et la circulation sur les avenues.
 */
export function createCities(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 1
  parent.add(group)

  const span = LOTS * GAP
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(span + 0.4, 0.1, span + 0.4),
    new THREE.MeshStandardMaterial({ color: 0x161c30, roughness: 0.9 }),
  )
  group.add(ground)

  // Avenues entre les îlots
  const roadPoints: number[] = []
  const half = span / 2
  for (let i = 0; i <= LOTS; i++) {
    const p = -half + i * GAP
    roadPoints.push(
      p,
      0.06,
      -half,
      p,
      0.06,
      half,
      -half,
      0.06,
      p,
      half,
      0.06,
      p,
    )
  }
  const roadGeometry = new THREE.BufferGeometry()
  roadGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(roadPoints, 3),
  )
  group.add(
    new THREE.LineSegments(
      roadGeometry,
      new THREE.LineBasicMaterial({ color: 0x4a3a2a }),
    ),
  )

  // Immeubles : plus hauts au centre, ils sortent de terre du centre vers l'extérieur
  const buildings: { x: number; z: number; h: number; delay: number }[] = []
  for (let i = 0; i < LOTS; i++)
    for (let j = 0; j < LOTS; j++) {
      const x = -half + (i + 0.5) * GAP
      const z = -half + (j + 0.5) * GAP
      const d = Math.hypot(x, z) / half
      buildings.push({
        x,
        z,
        h: 0.25 + (1 - d * 0.7) * (0.6 + Math.random() * 1.4),
        delay: d * 0.5,
      })
    }
  const towers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.4, 1, 0.4),
    new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.2,
      flatShading: true,
    }),
    buildings.length,
  )
  const palette = [0x5a6fa8, 0x7083bd, 0x4b5d92]
  buildings.forEach((_, i) =>
    towers.setColorAt(i, new THREE.Color(palette[i % 3])),
  )
  group.add(towers)

  const roofs = kit.points(buildings.length, { color: COL.cities, size: 0.16 })
  group.add(roofs.mesh)

  const CARS = 24
  const cars = kit.points(CARS, { size: 0.06 }, true)
  const carData = Array.from({ length: CARS }, (_, i) => ({
    lane: -half + (i % (LOTS + 1)) * GAP,
    along: i % 2 === 0,
    ph: Math.random(),
    s: 0.05 + Math.random() * 0.06,
    red: i % 3 === 0,
  }))
  group.add(cars.mesh)

  const dummy = new THREE.Object3D()
  return {
    update({ v, t, mobile }: Frame) {
      const lc = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = 0.6 + v * 1.1 + Math.sin(t * 0.15) * 0.05

      buildings.forEach((b, i) => {
        const h = Math.max(0.02, b.h * smoothstep(b.delay, b.delay + 0.45, lc))
        dummy.position.set(b.x, 0.05 + h / 2, b.z)
        dummy.scale.set(1, h, 1)
        dummy.updateMatrix()
        towers.setMatrixAt(i, dummy.matrix)
        roofs.positions.set([b.x, 0.08 + h, b.z], i * 3)
      })
      towers.instanceMatrix.needsUpdate = true
      roofs.commit()

      carData.forEach((c, i) => {
        const k = -half + fract(c.ph + t * c.s) * span
        cars.positions.set(
          c.along ? [c.lane, 0.09, k] : [k, 0.09, c.lane],
          i * 3,
        )
        cars.colors.set(c.red ? [1, 0.3, 0.25] : [1, 0.95, 0.8], i * 3)
      })
      cars.commit()
    },
  }
}
