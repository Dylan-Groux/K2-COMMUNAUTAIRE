import * as THREE from "three"
import { JOIN_STATION } from "../content"
import { sceneAlpha } from "../scroll"
import { canvasTexture, COL, stationY, type Frame, type Kit } from "./kit"

export type AvatarInput = { name: string; avatarUrl?: string | null }

const circle = (g: CanvasRenderingContext2D) => {
  g.beginPath()
  g.arc(64, 64, 58, 0, 6.283)
}
const ring = (g: CanvasRenderingContext2D) => {
  circle(g)
  g.lineWidth = 6
  g.strokeStyle = "#080b16"
  g.stroke()
}

/** Stations 0 et finale : le noyau (le serveur), ses particules et les avatars des membres. */
export function createCores(scene: THREE.Scene, kit: Kit) {
  const makeCore = () => {
    const group = new THREE.Group()
    const shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.15, 1)),
      new THREE.LineBasicMaterial({
        color: COL.cyan,
        transparent: true,
        opacity: 0.8,
      }),
    )
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62, 2),
      new THREE.MeshStandardMaterial({
        color: 0x1a2050,
        emissive: COL.signal,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        flatShading: true,
      }),
    )
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.012, 8, 128),
      new THREE.MeshBasicMaterial({
        color: COL.cyan,
        transparent: true,
        opacity: 0.5,
      }),
    )
    const ring2 = new THREE.Mesh(
      ring1.geometry.clone(),
      new THREE.MeshBasicMaterial({
        color: COL.signal,
        transparent: true,
        opacity: 0.35,
      }),
    )
    ring2.scale.setScalar(1.25)
    group.add(
      shell,
      inner,
      ring1,
      ring2,
      kit.glow(COL.signal, 3.2, 0.55),
      kit.glow(COL.cyan, 6, 0.18),
    )
    scene.add(group)
    return { group, shell, inner, ring1, ring2 }
  }

  const cores = [makeCore(), makeCore()]
  cores[0].group.position.y = stationY(0)
  cores[1].group.position.y = stationY(JOIN_STATION)

  // Particules en orbite autour du noyau le plus proche
  const OP = 400
  const orbit = kit.points(OP, { color: COL.cyan, size: 0.05 })
  const orbitData = Array.from({ length: OP }, () => [
    Math.random() * 6.283,
    1.5 + Math.random() * 2.2,
    (Math.random() - 0.5) * 1.4,
    0.2 + Math.random() * 0.5,
  ])
  scene.add(orbit.mesh)
  const orbitMaterial = orbit.mesh.material as THREE.PointsMaterial

  // Avatars des membres autour du noyau final
  const avatars = new THREE.Group()
  avatars.position.y = stationY(JOIN_STATION)
  scene.add(avatars)

  /** Pastille aux initiales, remplacée par la photo de profil Discord dès qu'elle est chargée. */
  const avatarSprite = ({ name, avatarUrl }: AvatarInput) => {
    const texture = canvasTexture(128, 128, (g) => {
      let hue = 0
      for (const c of name) hue = (hue * 31 + c.charCodeAt(0)) % 360
      g.fillStyle = `hsl(${hue} 70% 68%)`
      circle(g)
      g.fill()
      ring(g)
      g.fillStyle = "#080b16"
      g.font = "600 46px Rubik, system-ui, sans-serif"
      g.textAlign = "center"
      g.textBaseline = "middle"
      g.fillText(
        (name.replace(/[^p{L}p{N}]/gu, "").slice(0, 2) || "?").toUpperCase(),
        64,
        68,
      )
    })
    if (avatarUrl) {
      // crossOrigin obligatoire : sans en-tête CORS, l'image ne charge pas et on garde les initiales
      // (une image chargée sans CORS « salirait » le canvas et WebGL refuserait la texture).
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const g = (texture.image as HTMLCanvasElement).getContext("2d")!
        g.save()
        circle(g)
        g.clip()
        g.drawImage(img, 6, 6, 116, 116)
        g.restore()
        ring(g)
        texture.needsUpdate = true
      }
      img.src = avatarUrl
    }
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true }),
    )
    sprite.scale.setScalar(0.42)
    return sprite
  }

  return {
    setMembers(members: AvatarInput[]) {
      for (const child of avatars.children as THREE.Sprite[]) {
        child.material.map?.dispose()
        child.material.dispose()
      }
      avatars.clear()
      const list = members.slice(0, 16)
      list.forEach((member, i) => {
        const sprite = avatarSprite({ ...member, name: member.name || "?" })
        sprite.userData = {
          a: (i / list.length) * 6.283,
          r: 2.2 + (i % 3) * 0.35,
          y: ((i % 4) - 1.5) * 0.45,
        }
        avatars.add(sprite)
      })
    },

    update({ v, t, ly }: Frame) {
      cores.forEach((c, k) => {
        c.shell.rotation.set(t * 0.15 + v * 3, t * 0.2 + v * 4, 0)
        c.inner.rotation.y = -t * 0.3
        ;(c.inner.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.7 + 0.3 * Math.sin(t * 2 + k)
        c.ring1.rotation.set(1.2 + Math.sin(t * 0.3) * 0.1, 0, t * 0.2)
        c.ring2.rotation.set(1.4, t * 0.15, 0)
      })
      const near =
        Math.abs(cores[0].group.position.y - ly) < 3.5 ? cores[0] : cores[1]
      for (let i = 0; i < OP; i++) {
        const [a, r, y, s] = orbitData[i]
        const ang = a + t * s * 0.4 + v * 6 * s
        orbit.positions[i * 3] = Math.cos(ang) * r
        orbit.positions[i * 3 + 1] =
          near.group.position.y + y + Math.sin(ang * 2) * 0.2
        orbit.positions[i * 3 + 2] = Math.sin(ang) * r
      }
      orbit.commit()
      orbitMaterial.opacity = Math.max(
        sceneAlpha(0, v),
        sceneAlpha(JOIN_STATION, v),
      )

      for (const sprite of avatars.children) {
        const d = sprite.userData
        const ang = d.a + t * 0.25 + v * 2
        sprite.position.set(
          Math.cos(ang) * d.r,
          d.y + Math.sin(t + d.a) * 0.08,
          Math.sin(ang) * d.r,
        )
      }
      avatars.visible = sceneAlpha(JOIN_STATION, v) > 0.01
    },
  }
}
