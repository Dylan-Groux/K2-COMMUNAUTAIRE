import * as THREE from "three"
import { lerp, localProgress, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

/** Station 4 : un œuf qui s'éveille et trois créatures en orbite. */
export function createAniimo(scene: THREE.Scene, kit: Kit): Station {
  const group = new THREE.Group()
  group.position.y = stationY(4)
  scene.add(group)

  const profile: THREE.Vector2[] = []
  for (let i = 0; i <= 32; i++) {
    const t = (i / 32) * Math.PI
    profile.push(
      new THREE.Vector2(
        Math.max(0.001, 0.72 * Math.sin(t) * (1 + 0.12 * Math.cos(t))),
        -Math.cos(t),
      ),
    )
  }
  const eggMaterial = new THREE.MeshStandardMaterial({
    color: 0xeafff5,
    emissive: 0x1d7a5a,
    emissiveIntensity: 0.6,
    roughness: 0.25,
    metalness: 0.15,
  })
  const egg = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), eggMaterial)
  const eggGlow = kit.glow(COL.aniimo, 4.5, 0.45)
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.015, 8, 96),
    kit.emissive(COL.aniimo, 1.5),
  )
  band.rotation.x = Math.PI / 2
  band.position.y = -0.1
  group.add(egg, eggGlow, band)

  const creature = (hex: number) => {
    const g = new THREE.Group()
    const skin = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.5 })
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), skin)
    body.scale.set(1, 0.9, 1)
    g.add(body)
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 12), skin)
      ear.position.set(s * 0.11, 0.21, 0)
      ear.rotation.z = -s * 0.35
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 10, 8),
        new THREE.MeshBasicMaterial({ color: COL.night }),
      )
      eye.position.set(s * 0.075, 0.04, 0.19)
      g.add(ear, eye)
    }
    const tail = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 8),
      kit.emissive(COL.aniimo, 1.2),
    )
    tail.position.set(0, -0.05, -0.24)
    g.add(tail)
    group.add(g)
    return g
  }
  const critters = [0x9ff0c8, 0xffc49a, 0xc9b6ff].map((hex, i) => ({
    g: creature(hex),
    a: (i / 3) * 6.283,
  }))

  const WS = 160
  const wisps = kit.points(WS, { color: COL.aniimo, size: 0.06 })
  const wispData = Array.from({ length: WS }, () => [
    Math.random() * 6.283,
    1 + Math.random() * 1.8,
    (Math.random() - 0.5) * 2.2,
    0.2 + Math.random() * 0.6,
  ])
  group.add(wisps.mesh)

  const glowMaterial = eggGlow.material
  return {
    update({ v, t }: Frame) {
      const ln = localProgress(4, v)
      group.rotation.y = v * 1.2
      egg.rotation.z = Math.sin(t * 5) * 0.06 * smoothstep(0.3, 1, ln)
      egg.position.y = Math.sin(t * 1.2) * 0.06
      eggMaterial.emissiveIntensity =
        0.5 + 0.5 * smoothstep(0.2, 1, ln) + 0.15 * Math.sin(t * 3)
      glowMaterial.opacity = 0.3 + 0.35 * smoothstep(0.2, 1, ln)
      critters.forEach((c, i) => {
        const r = lerp(1.9, 1.25, ln)
        const ang = c.a + t * 0.5 + v * 5
        c.g.position.set(
          Math.cos(ang) * r,
          0.1 + Math.sin(t * 2 + i) * 0.18,
          Math.sin(ang) * r,
        )
        c.g.rotation.y = -ang + Math.PI
      })
      for (let i = 0; i < WS; i++) {
        const [a, r, y, s] = wispData[i]
        const ang = a + t * s * 0.5
        wisps.positions[i * 3] = Math.cos(ang) * r
        wisps.positions[i * 3 + 1] = y + Math.sin(t * s + a) * 0.15
        wisps.positions[i * 3 + 2] = Math.sin(ang) * r
      }
      wisps.commit()
    },
  }
}
