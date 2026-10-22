import * as THREE from "three"
import { clamp, lerp, localProgress, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const W = 2.5
const D = 1.6

/** Trajet du ballon : passe, rebond sur le mur du bas, rebond sur le mur du haut, puis but. */
const BALL_PATH = [
  [-1.6, 0.5],
  [-0.2, -D + 0.12],
  [1.0, D - 0.12],
  [W + 0.15, 0],
].map(([x, z]) => new THREE.Vector2(x, z))

function ballAt(k: number, out: THREE.Vector2) {
  const n = BALL_PATH.length - 1
  const s = clamp(k, 0, 1) * n
  const i = Math.min(n - 1, Math.floor(s))
  return out.copy(BALL_PATH[i]).lerp(BALL_PATH[i + 1], s - i)
}

/**
 * Station Rematch : un terrain fermé par des murs, sans touche ni corner. Deux équipes de cinq,
 * et un ballon qui rebondit sur les murs jusqu'au but au fil du scroll.
 */
export function createRematch(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 0.9
  parent.add(group)

  const pitch = new THREE.Mesh(
    new THREE.BoxGeometry(W * 2, 0.1, D * 2),
    new THREE.MeshStandardMaterial({ color: 0x1f4a3c, roughness: 0.9 }),
  )
  group.add(pitch)

  // Lignes : contour, ligne médiane et rond central
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xcfe8dc,
    transparent: true,
    opacity: 0.6,
  })
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(
      [
        [-W, -D, W, -D],
        [W, -D, W, D],
        [W, D, -W, D],
        [-W, D, -W, -D],
        [0, -D, 0, D],
      ].flatMap(([x1, z1, x2, z2]) => [
        new THREE.Vector3(x1, 0.06, z1),
        new THREE.Vector3(x2, 0.06, z2),
      ]),
    ),
    lineMaterial,
  )
  const circle = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.01, 4, 64),
    new THREE.MeshBasicMaterial({ color: 0xcfe8dc }),
  )
  circle.rotation.x = Math.PI / 2
  circle.position.y = 0.06
  group.add(lines, circle)

  // Murs vitrés : le ballon ne sort jamais du terrain
  const glass = new THREE.MeshStandardMaterial({
    color: COL.rematch,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const wallEdge = new THREE.LineBasicMaterial({ color: COL.rematch })
  for (const [w, d, x, z] of [
    [W * 2, 0.04, 0, -D],
    [W * 2, 0.04, 0, D],
    [0.04, D * 2, -W, 0],
    [0.04, D * 2, W, 0],
  ]) {
    const geometry = new THREE.BoxGeometry(w, 0.45, d)
    const wall = new THREE.Mesh(geometry, glass)
    wall.position.set(x, 0.27, z)
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      wallEdge,
    )
    edge.position.copy(wall.position)
    group.add(wall, edge)
  }

  // Buts : un cadre à chaque bout, celui de droite s'illumine au but
  const goalMaterial = kit.emissive(0xffffff, 0.6)
  for (const side of [-1, 1]) {
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3, 0.4, 0.9)),
      new THREE.LineBasicMaterial({ color: 0xffffff }),
    )
    frame.position.set(side * (W - 0.15), 0.25, 0)
    group.add(frame)
  }
  const net = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.38, 0.88),
    goalMaterial,
  )
  net.position.set(W - 0.15, 0.25, 0)
  ;(net.material as THREE.MeshStandardMaterial).transparent = true
  group.add(net)
  const flash = kit.glow(COL.rematch, 3, 0)
  flash.position.set(W - 0.2, 0.4, 0)
  group.add(flash)

  // Deux équipes de cinq, qui suivent un peu le ballon
  const body = new THREE.CapsuleGeometry(0.07, 0.18, 4, 8)
  const formation = [
    [-2.1, 0],
    [-1.3, -0.8],
    [-1.3, 0.8],
    [-0.6, -0.3],
    [-0.4, 0.6],
  ]
  const players = [COL.rematch, 0xff8a5c].flatMap((color, team) =>
    formation.map(([fx, fz]) => {
      const m = new THREE.Mesh(body, kit.emissive(color, 0.5))
      group.add(m)
      return {
        m,
        x: team ? -fx : fx,
        z: team ? -fz : fz,
        ph: Math.random() * 6,
      }
    }),
  )

  const ball = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.08, 1),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      flatShading: true,
    }),
  )
  group.add(ball)
  const trail = kit.points(30, { size: 0.05 }, true)
  group.add(trail.mesh)

  const p = new THREE.Vector2()
  return {
    update({ v, t, mobile }: Frame) {
      const lr = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = 0.5 + v * 0.8 + Math.sin(t * 0.2) * 0.05

      const k = smoothstep(0.05, 0.9, lr)
      ballAt(k, p)
      ball.position.set(p.x, 0.12 + Math.abs(Math.sin(k * 18)) * 0.12, p.y)
      ball.rotation.set(k * 30, k * 20, 0)
      for (let i = 0; i < 30; i++) {
        ballAt(k - i * 0.008, p)
        trail.positions.set([p.x, 0.12, p.y], i * 3)
        const f = (1 - i / 30) * (k > 0.02 && k < 0.99 ? 1 : 0)
        trail.colors.set([0.55 * f, 0.6 * f, f], i * 3)
      }
      trail.commit()

      ballAt(k, p)
      for (const pl of players) {
        const x = lerp(pl.x, p.x, 0.25) + Math.sin(t * 1.5 + pl.ph) * 0.05
        const z = lerp(pl.z, p.y, 0.25) + Math.cos(t * 1.3 + pl.ph) * 0.05
        pl.m.position.set(
          clamp(x, -W + 0.15, W - 0.15),
          0.2,
          clamp(z, -D + 0.15, D - 0.15),
        )
      }

      const goal = smoothstep(0.88, 0.95, lr)
      flash.material.opacity = goal * (0.6 + 0.4 * Math.sin(t * 10))
      ;(net.material as THREE.MeshStandardMaterial).opacity = 0.15 + goal * 0.6
    },
  }
}
