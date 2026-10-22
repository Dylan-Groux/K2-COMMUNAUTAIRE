import * as THREE from "three"
import { localProgress, smoothstep } from "../scroll"
import {
  canvasTexture,
  stationY,
  type Frame,
  type Kit,
  type Station,
} from "./kit"

/** Enseigne au nom du jeu, réduite jusqu'à tenir dans la largeur. */
function labelSprite(name: string, color: THREE.Color) {
  const text = name.toUpperCase()
  const texture = canvasTexture(1024, 192, (g, w, h) => {
    let size = 150
    do {
      g.font = `900 ${size}px "Big Shoulders Display", Impact, sans-serif`
      size -= 6
    } while (g.measureText(text).width > w - 40 && size > 40)
    g.textAlign = "center"
    g.textBaseline = "middle"
    g.fillStyle = `#${color.getHexString()}`
    g.fillText(text, w / 2, h / 2)
  })
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  )
  sprite.scale.set(3.2, 0.6, 1)
  return sprite
}

/**
 * Station d'un jeu qui n'a pas encore son modèle 3D : une colonne et un anneau à la couleur du jeu,
 * et son nom en enseigne. La colonne monte avec le scroll, comme celles du Top 48 h.
 */
export function createGeneric(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
  name: string,
  color: THREE.ColorRepresentation,
): Station {
  const tint = new THREE.Color(color)
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 0.9
  parent.add(group)

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.4, 0.12, 64),
    new THREE.MeshStandardMaterial({
      color: 0x161c38,
      roughness: 0.6,
      metalness: 0.3,
    }),
  )
  plinth.position.y = -0.06
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.22, 0.015, 8, 128),
    new THREE.MeshBasicMaterial({ color: tint }),
  )
  ring.rotation.x = Math.PI / 2
  group.add(plinth, ring)

  const box = new THREE.BoxGeometry(0.72, 1, 0.72)
  const column = new THREE.Mesh(
    box,
    new THREE.MeshStandardMaterial({
      color: 0x1c2347,
      emissive: tint,
      emissiveIntensity: 0.65,
      roughness: 0.35,
      metalness: 0.4,
    }),
  )
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(box),
    new THREE.LineBasicMaterial({ color: tint }),
  )
  group.add(column, edges)

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.02, 8, 96),
    new THREE.MeshBasicMaterial({ color: tint }),
  )
  const glow = kit.glow(tint.getHex(), 2, 0.6)
  const label = labelSprite(name, tint)
  group.add(halo, glow, label)

  const OP = 80
  const orbit = kit.points(OP, { color: tint.getHex(), size: 0.05 })
  const orbitData = Array.from({ length: OP }, () => [
    Math.random() * Math.PI * 2,
    0.7 + Math.random() * 1.2,
    Math.random(),
    0.15 + Math.random() * 0.3,
  ])
  group.add(orbit.mesh)

  return {
    update({ v, t, mobile }: Frame) {
      const lg = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = Math.sin(t * 0.25) * 0.15 + v * 1.2
      const h = 0.3 + 1.3 * smoothstep(0, 0.7, lg)
      column.scale.y = edges.scale.y = h
      column.position.y = edges.position.y = h / 2
      halo.position.y = glow.position.y = h + 0.45 + Math.sin(t * 2) * 0.05
      halo.rotation.set(Math.PI / 2 + Math.sin(t * 0.8) * 0.2, 0, t * 0.6)
      label.position.y = h + 1.05

      for (let i = 0; i < OP; i++) {
        const [a, r, y, s] = orbitData[i]
        const ang = a + t * s
        orbit.positions[i * 3] = Math.cos(ang) * r
        orbit.positions[i * 3 + 1] = ((y + t * s * 0.15) % 1) * (h + 0.6)
        orbit.positions[i * 3 + 2] = Math.sin(ang) * r
      }
      orbit.commit()
    },
  }
}
