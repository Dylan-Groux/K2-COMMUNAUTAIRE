import * as THREE from "three"
import { fract, localProgress } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

/** Station 5 : cristal du Nexus et sbires sur trois lanes. */
export function createLol(scene: THREE.Scene, kit: Kit): Station {
  const group = new THREE.Group()
  group.position.y = stationY(5)
  scene.add(group)

  const stone = new THREE.MeshStandardMaterial({
    color: 0x262c45,
    roughness: 0.8,
    flatShading: true,
  })
  for (const [top, bottom, h, y] of [
    [1.25, 1.35, 0.22, -1.05],
    [0.95, 1.05, 0.22, -0.83],
  ]) {
    const step = new THREE.Mesh(
      new THREE.CylinderGeometry(top, bottom, h, 8),
      stone,
    )
    step.position.y = y
    group.add(step)
  }
  const goldRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.025, 8, 8),
    kit.emissive(COL.lol, 0.9),
  )
  goldRim.rotation.set(Math.PI / 2, 0, Math.PI / 8)
  goldRim.position.y = -0.72
  group.add(goldRim)

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.62, 0),
    new THREE.MeshStandardMaterial({
      color: 0x7fd8ff,
      emissive: 0x1f6fa8,
      emissiveIntensity: 1,
      roughness: 0.12,
      metalness: 0.3,
      flatShading: true,
      transparent: true,
      opacity: 0.92,
    }),
  )
  crystal.scale.set(1, 1.75, 1)
  crystal.position.y = 0.45
  const crystalGlow = kit.glow(0x7fd8ff, 3.2, 0.5)
  crystalGlow.position.y = 0.45
  group.add(crystal, crystalGlow)

  const rings = [1.05, 1.35].map((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.014, 8, 6 + i * 2),
      kit.emissive(COL.lol, 1.2),
    )
    ring.position.y = 0.45
    group.add(ring)
    return ring
  })

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 64),
    new THREE.MeshStandardMaterial({ color: 0x0d1226, roughness: 1 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.17
  group.add(floor)

  const lanes = [-Math.PI / 2 - 0.7, -Math.PI / 2, -Math.PI / 2 + 0.7]
  for (const a of lanes) {
    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 5.5),
      new THREE.MeshBasicMaterial({
        color: COL.lol,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    lane.rotation.set(-Math.PI / 2, 0, -a - Math.PI / 2)
    lane.position.set(Math.cos(a) * 4.05, -1.15, Math.sin(a) * 4.05)
    group.add(lane)
  }

  const units = Array.from({ length: 18 }, (_, i) => {
    const blue = i % 2 === 0
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 8),
      kit.emissive(blue ? 0x5ab0ff : 0xff5a5a, 1.4),
    )
    group.add(m)
    return { m, lane: lanes[i % 3], ph: Math.random(), blue }
  })

  return {
    update({ v, t }: Frame) {
      const ll = localProgress(5, v)
      group.rotation.y = 0.3 + v * 0.8
      crystal.rotation.y = t * 0.5
      crystal.position.y = 0.45 + Math.sin(t * 1.4) * 0.08
      rings.forEach((r, i) =>
        r.rotation.set(
          Math.PI / 2 + Math.sin(t * 0.6 + i) * 0.3,
          t * (i ? -0.4 : 0.3),
          0,
        ),
      )
      for (const u of units) {
        const k = fract(u.ph + t * 0.08 + ll * 0.6)
        const d = u.blue ? 6.6 - k * 5.4 : 1.2 + k * 5.4
        u.m.position.set(
          Math.cos(u.lane) * d + (u.blue ? 0.08 : -0.08),
          -1.08,
          Math.sin(u.lane) * d,
        )
      }
    },
  }
}
