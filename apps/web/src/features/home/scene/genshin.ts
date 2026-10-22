import * as THREE from "three"
import { lerp, localProgress, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const TAU = Math.PI * 2
/** Anemo, Geo, Electro, Dendro, Hydro, Pyro, Cryo. */
const ELEMENTS = [
  0x74e2c4, 0xf5c451, 0xb57cff, 0x9ad84a, 0x4cc2ff, 0xff6b3d, 0xa8e8ff,
]

/**
 * Station Genshin Impact : un téléporteur sur une île d'herbe, le vent qui tourne autour,
 * et les sept éléments en orbite qui se rejoignent en réaction élémentaire avec le scroll.
 */
export function createGenshin(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 0.7
  parent.add(group)

  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.7, 0.2, 10),
    new THREE.MeshStandardMaterial({
      color: 0x24433d,
      roughness: 0.9,
      flatShading: true,
    }),
  )
  const rock = new THREE.Mesh(
    new THREE.ConeGeometry(1.7, 1.3, 10),
    new THREE.MeshStandardMaterial({
      color: 0x252a40,
      roughness: 0.9,
      flatShading: true,
    }),
  )
  rock.rotation.x = Math.PI
  rock.position.y = -0.75
  group.add(grass, rock)

  // Le téléporteur : un cristal allongé qui flotte au-dessus d'un socle
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.4, 0.3, 6),
    new THREE.MeshStandardMaterial({
      color: 0x3a4060,
      roughness: 0.5,
      flatShading: true,
    }),
  )
  plinth.position.y = 0.25
  const waypoint = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    kit.emissive(COL.genshin, 1.2),
  )
  waypoint.scale.set(1, 2, 1)
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.015, 8, 64),
    new THREE.MeshBasicMaterial({ color: COL.genshin }),
  )
  halo.rotation.x = Math.PI / 2
  group.add(plinth, waypoint, halo)

  const orbs = ELEMENTS.map((hex, i) => {
    const orb = new THREE.Group()
    orb.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 12),
        kit.emissive(hex, 1.5),
      ),
      kit.glow(hex, 0.7, 0.8),
    )
    group.add(orb)
    return { orb, a: (i / ELEMENTS.length) * TAU }
  })
  const burst = kit.glow(0xffffff, 3, 0)
  burst.position.y = 1.4
  group.add(burst)

  const WP = 90
  const wind = kit.points(WP, { color: 0xd8fff4, size: 0.05, opacity: 0.7 })
  const windData = Array.from({ length: WP }, () => [
    Math.random() * TAU,
    1.1 + Math.random() * 1.3,
    Math.random() * 2,
    0.3 + Math.random() * 0.4,
  ])
  group.add(wind.mesh)

  return {
    update({ v, t, mobile }: Frame) {
      const lg = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = 0.4 + v * 1.1 + Math.sin(t * 0.2) * 0.05
      waypoint.position.y = 1.05 + Math.sin(t * 1.5) * 0.08
      waypoint.rotation.y = t * 0.7
      halo.position.y = 0.55 + Math.sin(t * 1.5) * 0.03

      const r = lerp(2.1, 0.35, smoothstep(0.1, 0.85, lg))
      for (const { orb, a } of orbs) {
        const ang = a + t * 0.6
        orb.position.set(
          Math.cos(ang) * r,
          1.4 + Math.sin(t * 2 + a) * 0.1,
          Math.sin(ang) * r,
        )
      }
      const react = smoothstep(0.8, 0.95, lg)
      burst.material.opacity = react * (0.6 + 0.4 * Math.sin(t * 8))
      burst.scale.setScalar(2 + react * 2)

      for (let i = 0; i < WP; i++) {
        const [a, rr, y, s] = windData[i]
        const ang = a + t * s
        wind.positions[i * 3] = Math.cos(ang) * rr
        wind.positions[i * 3 + 1] = 0.2 + y + Math.sin(ang * 3) * 0.1
        wind.positions[i * 3 + 2] = Math.sin(ang) * rr
      }
      wind.commit()
    },
  }
}
