import * as THREE from "three"
import { fract, localProgress } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const TAU = Math.PI * 2
const SEGMENTS = 24

/**
 * Station VALORANT : la Spike posée au centre d'un site, des caisses de couverture et deux fumées.
 * L'anneau de désamorçage se remplit avec le scroll, et le bip de la Spike accélère.
 */
export function createValorant(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 0.9
  parent.add(group)

  const floorGeometry = new THREE.CylinderGeometry(2.4, 2.4, 0.1, 6)
  const floor = new THREE.Mesh(
    floorGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x1d2238,
      roughness: 0.8,
      flatShading: true,
    }),
  )
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(floorGeometry),
    new THREE.LineBasicMaterial({ color: COL.valorant }),
  )
  group.add(floor, outline)

  const crate = new THREE.MeshStandardMaterial({
    color: 0x2e3550,
    roughness: 0.7,
    flatShading: true,
  })
  for (const [x, z, s] of [
    [-1.5, 0.6, 0.55],
    [-1.1, 1.2, 0.4],
    [1.4, -0.9, 0.6],
    [1.6, 0.8, 0.45],
    [-0.4, -1.6, 0.5],
  ]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), crate)
    box.position.set(x, 0.05 + s / 2, z)
    box.rotation.y = x * z
    group.add(box)
  }

  const smokeMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a6a9a,
    transparent: true,
    opacity: 0.22,
    roughness: 1,
    depthWrite: false,
  })
  const smokes = [
    [-1.4, -0.5],
    [0.9, 1.5],
  ].map(([x, z]) => {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 16),
      smokeMaterial,
    )
    smoke.position.set(x, 0.7, z)
    group.add(smoke)
    return smoke
  })

  // La Spike : un cylindre sombre cerclé d'une bande lumineuse
  const spike = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, 0.55, 8),
    new THREE.MeshStandardMaterial({
      color: 0x22263a,
      metalness: 0.6,
      roughness: 0.3,
    }),
  )
  body.position.y = 0.33
  const coreMaterial = kit.emissive(COL.valorant, 1.4)
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.07, 16),
    coreMaterial,
  )
  core.position.y = 0.4
  const tip = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09),
    kit.emissive(0xffffff, 1.2),
  )
  tip.position.y = 0.68
  const spikeGlow = kit.glow(COL.valorant, 1.6, 0.6)
  spikeGlow.position.y = 0.45
  spike.add(body, core, tip, spikeGlow)
  group.add(spike)

  // Anneau de désamorçage : des segments qui s'allument un à un
  const segments = Array.from({ length: SEGMENTS }, (_, i) => {
    const a = (i / SEGMENTS) * TAU
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.04, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x3a3f58 }),
    )
    seg.position.set(Math.cos(a) * 0.75, 0.08, Math.sin(a) * 0.75)
    seg.rotation.y = -a + Math.PI / 2
    group.add(seg)
    return seg.material
  })
  const dim = new THREE.Color(0x3a3f58)
  const lit = new THREE.Color(0x7fe7ff)

  const shockMaterial = new THREE.MeshBasicMaterial({
    color: COL.valorant,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const shock = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.012, 6, 96),
    shockMaterial,
  )
  shock.rotation.x = Math.PI / 2
  shock.position.y = 0.1
  group.add(shock)

  return {
    update({ v, t, mobile }: Frame) {
      const lv = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = -0.3 + v * 1.2 + Math.sin(t * 0.2) * 0.05

      const beep = fract(t * (0.8 + lv * 3))
      coreMaterial.emissiveIntensity = 0.6 + 2.4 * Math.max(0, 1 - beep * 4)
      spikeGlow.material.opacity = 0.35 + 0.5 * Math.max(0, 1 - beep * 4)

      const filled = Math.floor(lv * SEGMENTS)
      segments.forEach((m, i) => m.color.copy(i < filled ? lit : dim))

      const wave = fract(t * 0.5)
      shock.scale.setScalar(0.3 + wave * 2.2)
      shockMaterial.opacity = (1 - wave) * 0.7
      smokes.forEach((s, i) =>
        s.scale.setScalar(1 + Math.sin(t * 0.6 + i * 2) * 0.05),
      )
    },
  }
}
