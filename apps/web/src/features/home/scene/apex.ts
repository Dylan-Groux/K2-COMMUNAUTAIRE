import * as THREE from "three"
import { fract, lerp, localProgress, sceneAlpha, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

/** Station 2 : terrain hexagonal, zone qui se referme et largages. */
export function createApex(scene: THREE.Scene, kit: Kit): Station {
  const group = new THREE.Group()
  group.position.y = stationY(2) - 1
  scene.add(group)

  const HR = 7
  const HS = 0.32
  const hexes: { x: number; z: number; h: number }[] = []
  for (let q = -HR; q <= HR; q++)
    for (let r = Math.max(-HR, -q - HR); r <= Math.min(HR, -q + HR); r++) {
      const x = HS * Math.sqrt(3) * (q + r / 2)
      const z = HS * 1.5 * r
      const h =
        0.12 +
        Math.max(
          0,
          0.45 * Math.sin(x * 1.2 + 0.5) * Math.cos(z * 1.05) +
            0.25 * Math.sin(x * 0.5 - z * 0.8),
        ) +
        Math.random() * 0.05
      hexes.push({ x, z, h })
    }
  const hexMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(HS * 0.96, HS * 0.96, 1, 6),
    new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
    }),
    hexes.length,
  )
  const dummy = new THREE.Object3D()
  const base = new THREE.Color(0x283252)
  const high = new THREE.Color(0x46557f)
  const red = new THREE.Color(0x7a2a24)
  hexes.forEach((hx, i) => {
    dummy.position.set(hx.x, hx.h / 2, hx.z)
    dummy.scale.set(1, hx.h, 1)
    dummy.updateMatrix()
    hexMesh.setMatrixAt(i, dummy.matrix)
    hexMesh.setColorAt(i, base)
  })
  group.add(hexMesh)

  const zoneMaterial = new THREE.MeshBasicMaterial({
    color: COL.apex,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const zone = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 2.4, 96, 1, true),
    zoneMaterial,
  )
  zone.position.y = 1.1
  const zoneEdge = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.02, 8, 128),
    new THREE.MeshBasicMaterial({ color: COL.apex }),
  )
  zoneEdge.rotation.x = Math.PI / 2
  zoneEdge.position.y = 0.05
  group.add(zone, zoneEdge)
  const center = new THREE.Vector2(0.5, 0.2)

  const drops = Array.from({ length: 7 }, (_, i) => {
    const g = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.22, 10),
      kit.emissive(COL.signal, 1.4),
    )
    body.rotation.x = Math.PI
    const trail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 1.2, 6),
      new THREE.MeshBasicMaterial({
        color: COL.signal,
        transparent: true,
        opacity: 0.5,
      }),
    )
    trail.position.y = 0.7
    g.add(body, kit.glow(COL.signal, 0.7, 0.8), trail)
    group.add(g)
    return {
      g,
      ph: i / 7,
      x: (Math.random() - 0.5) * 2.4,
      z: (Math.random() - 0.5) * 2,
    }
  })

  const color = new THREE.Color()
  return {
    update({ v, t }: Frame) {
      const la = localProgress(2, v)
      group.rotation.y = -0.4 + v * 1.5 + Math.sin(t * 0.2) * 0.05
      const zr = lerp(3.4, 0.9, smoothstep(0, 1, la))
      zone.scale.set(zr, 1, zr)
      zone.position.x = zoneEdge.position.x = center.x
      zone.position.z = zoneEdge.position.z = center.y
      zoneEdge.scale.set(zr, zr, 1)
      zoneMaterial.opacity = 0.22 + 0.08 * Math.sin(t * 3)
      hexes.forEach((hx, i) => {
        color.copy(base).lerp(high, Math.min(1, hx.h))
        if (Math.hypot(hx.x - center.x, hx.z - center.y) > zr)
          color.lerp(red, 0.75)
        hexMesh.setColorAt(i, color)
      })
      hexMesh.instanceColor!.needsUpdate = true
      const visible = sceneAlpha(2, v) > 0.01
      for (const d of drops) {
        const u = fract(d.ph + t * 0.18 + v * 3)
        d.g.position.set(
          d.x * (1 - u * 0.4),
          5.5 - u * 5.2,
          d.z * (1 - u * 0.4),
        )
        d.g.visible = visible
      }
    },
  }
}
