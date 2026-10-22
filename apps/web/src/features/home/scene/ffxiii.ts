import * as THREE from "three"
import { localProgress, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const TAU = Math.PI * 2

/**
 * Station FINAL FANTASY XIII : Cocoon, le monde-coquille suspendu au-dessus de Gran Pulse,
 * des cristaux qui percent le sol, un pilier de cristal qui monte vers Cocoon avec le scroll,
 * et la jauge ATB en trois segments qui se remplit.
 */
export function createFfxiii(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 1
  parent.add(group)

  // Gran Pulse : un plateau sauvage
  const pulse = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.5, 0.25, 9),
    new THREE.MeshStandardMaterial({
      color: 0x22333a,
      roughness: 0.9,
      flatShading: true,
    }),
  )
  group.add(pulse)

  const crystal = new THREE.MeshStandardMaterial({
    color: 0xc8d8ff,
    emissive: COL.ffxiii,
    emissiveIntensity: 0.35,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    flatShading: true,
  })
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3
    const r = 1.2 + (i % 3) * 0.35
    const h = 0.35 + ((i * 7) % 5) * 0.12
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.1, h, 5), crystal)
    shard.position.set(Math.cos(a) * r, 0.12 + h / 2, Math.sin(a) * r)
    shard.rotation.set(Math.sin(i) * 0.3, 0, Math.cos(i) * 0.3)
    group.add(shard)
  }

  // Le pilier de cristal qui relie le sol à Cocoon
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.3, 1, 6),
    crystal,
  )
  group.add(pillar)

  // Cocoon : une coquille à facettes, éclairée de l'intérieur par ses villes
  const cocoon = new THREE.Group()
  cocoon.position.y = 2
  const shellGeometry = new THREE.IcosahedronGeometry(0.6, 1)
  const shell = new THREE.Mesh(
    shellGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x2b3150,
      roughness: 0.6,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    }),
  )
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(shellGeometry),
    new THREE.LineBasicMaterial({
      color: COL.ffxiii,
      transparent: true,
      opacity: 0.6,
    }),
  )
  const inner = kit.glow(0xffd9a0, 1.2, 0.5)
  cocoon.add(shell, edges, inner)
  group.add(cocoon)

  // Jauge ATB : trois arcs autour du plateau
  const atb = Array.from({ length: 3 }, (_, i) => {
    const material = new THREE.MeshBasicMaterial({ color: 0x3a4060 })
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(2.55, 0.035, 6, 48, TAU / 3 - 0.12),
      material,
    )
    arc.rotation.set(Math.PI / 2, 0, (i * TAU) / 3)
    arc.position.y = 0.16
    group.add(arc)
    return material
  })
  const empty = new THREE.Color(0x3a4060)
  const full = new THREE.Color(0x7fe7ff)

  return {
    update({ v, t, mobile }: Frame) {
      const lf = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = -0.2 + v * 1 + Math.sin(t * 0.2) * 0.05

      const grow = smoothstep(0.05, 0.75, lf)
      const h = Math.max(0.01, grow * 1.45)
      pillar.scale.y = h
      pillar.position.y = 0.12 + h / 2

      cocoon.position.y = 2 + Math.sin(t * 0.6) * 0.08
      cocoon.rotation.y = t * 0.1
      inner.material.opacity = 0.35 + 0.25 * grow + 0.05 * Math.sin(t * 2)

      atb.forEach((m, i) =>
        m.color.copy(empty).lerp(full, smoothstep(i / 3, (i + 1) / 3, lf)),
      )
    },
  }
}
