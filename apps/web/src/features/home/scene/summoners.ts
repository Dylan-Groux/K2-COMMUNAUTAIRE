import * as THREE from "three"
import { localProgress, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const TAU = Math.PI * 2
/** Feu, eau, vent, lumière, ténèbres : les cinq éléments des monstres. */
const ELEMENTS = [0xff5a3c, 0x3fa8ff, 0xf0d74a, 0xfff4d6, 0x9a5cff]

const backOut = (k: number) =>
  1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2)

/**
 * Station Summoners War : un cercle d'invocation et ses runes, les cinq éléments à ses pointes,
 * et un monstre qui apparaît dans la colonne de lumière au fil du scroll.
 */
export function createSummoners(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 0.9
  parent.add(group)

  const lineMaterial = new THREE.MeshBasicMaterial({ color: COL.summoners })
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(2, 0.02, 6, 128),
    lineMaterial,
  )
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.015, 6, 128),
    lineMaterial,
  )
  outer.rotation.x = inner.rotation.x = Math.PI / 2

  // Runes : petites plaques réparties entre les deux anneaux, qui tournent ensemble
  const runes = new THREE.Group()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU
    const rune = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.02, 0.22),
      kit.emissive(COL.summoners, 0.9),
    )
    rune.position.set(Math.cos(a) * 1.78, 0, Math.sin(a) * 1.78)
    rune.rotation.y = -a
    runes.add(rune)
  }

  // Étoile à cinq branches, une branche par élément
  const star: number[] = []
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU
    const b = ((i + 2) / 5) * TAU
    star.push(
      Math.cos(a) * 1.55,
      0,
      Math.sin(a) * 1.55,
      Math.cos(b) * 1.55,
      0,
      Math.sin(b) * 1.55,
    )
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(star, 3),
  )
  const pentagram = new THREE.LineSegments(
    starGeometry,
    new THREE.LineBasicMaterial({ color: COL.summoners }),
  )
  const circle = new THREE.Group()
  circle.add(outer, inner, runes, pentagram)
  circle.position.y = 0.02
  group.add(circle)

  const orbs = ELEMENTS.map((hex, i) => {
    const orb = new THREE.Group()
    orb.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 12),
        kit.emissive(hex, 1.4),
      ),
      kit.glow(hex, 0.8, 0.8),
    )
    group.add(orb)
    return { orb, a: (i / 5) * TAU }
  })

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: COL.summoners,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 4, 48, 1, true),
    beamMaterial,
  )
  beam.position.y = 2
  group.add(beam)

  // Le monstre invoqué : un corps de cristal, deux cornes et des yeux lumineux
  const monster = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({
      color: 0x3a2f5c,
      emissive: COL.summoners,
      emissiveIntensity: 0.35,
      flatShading: true,
    }),
  )
  const hornMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e0ff,
    flatShading: true,
  })
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.4, 6),
      hornMaterial,
    )
    horn.position.set(side * 0.22, 0.42, 0)
    horn.rotation.z = -side * 0.4
    const eye = kit.glow(0xfff4d6, 0.22, 1)
    eye.position.set(side * 0.13, 0.08, 0.36)
    monster.add(horn, eye)
  }
  monster.add(body)
  group.add(monster)

  return {
    update({ v, t, mobile }: Frame) {
      const ls = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = v * 0.9 + Math.sin(t * 0.2) * 0.05
      runes.rotation.y = t * 0.25
      pentagram.rotation.y = -t * 0.12

      for (const { orb, a } of orbs) {
        const ang = a - t * 0.12
        orb.position.set(
          Math.cos(ang) * 1.55,
          0.25 + Math.sin(t * 2 + a) * 0.08 + ls * 0.4,
          Math.sin(ang) * 1.55,
        )
      }
      beamMaterial.opacity =
        smoothstep(0.15, 0.55, ls) * (0.22 + 0.06 * Math.sin(t * 5))

      const appear = smoothstep(0.15, 0.55, ls)
      monster.scale.setScalar(Math.max(0.001, backOut(appear)))
      monster.position.y = 0.9 + appear * 0.5 + Math.sin(t * 1.8) * 0.08
      monster.rotation.y = Math.sin(t * 0.7) * 0.4
    },
  }
}
