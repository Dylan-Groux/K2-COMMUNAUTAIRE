import * as THREE from "three"
import { gameKeyOf, TRACKED_GAMES } from "../content"
import type { GameStat } from "../data/hype"
import { localProgress, sceneAlpha, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit } from "./kit"

const hexOf = (name: string) => {
  const key = gameKeyOf(name)
  return key ? TRACKED_GAMES[key].hex : 0x8a93b8
}

/** Station 1 : jeu du moment, une colonne par jeu qui monte avec le scroll. */
export function createHype(scene: THREE.Scene, kit: Kit) {
  const group = new THREE.Group()
  group.position.y = stationY(1) - 0.9
  scene.add(group)

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.8, 0.12, 64),
    new THREE.MeshStandardMaterial({
      color: 0x161c38,
      roughness: 0.6,
      metalness: 0.3,
    }),
  )
  plinth.position.y = -0.06
  const plinthRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.62, 0.015, 8, 128),
    new THREE.MeshBasicMaterial({ color: COL.signal }),
  )
  plinthRing.rotation.x = Math.PI / 2
  group.add(plinth, plinthRing)

  const crown = new THREE.Group()
  const crownRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.025, 8, 6),
    kit.emissive(COL.signal, 1.6),
  )
  crownRing.rotation.x = Math.PI / 2
  crown.add(crownRing, kit.glow(COL.signal, 2.2, 0.7))
  group.add(crown)

  type Column = {
    g: THREE.Group
    m: THREE.Mesh
    edges: THREE.LineSegments
    h: number
    i: number
  }
  let columns: Column[] = []

  return {
    setGames(games: GameStat[]) {
      columns.forEach((c) => group.remove(c.g))
      columns = []
      const list = games.slice(0, 5)
      const max = Math.max(...list.map((g) => g.hours))
      const slots = [0, -1, 1, -2, 2] // le n°1 au centre, les suivants alternent
      list.forEach((game, i) => {
        const g = new THREE.Group()
        const color = hexOf(game.name)
        const box = new THREE.BoxGeometry(0.62, 1, 0.62)
        const m = new THREE.Mesh(
          box,
          new THREE.MeshStandardMaterial({
            color: 0x1c2347,
            emissive: color,
            emissiveIntensity: i ? 0.3 : 0.85,
            roughness: 0.35,
            metalness: 0.4,
          }),
        )
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(box),
          new THREE.LineBasicMaterial({ color }),
        )
        g.add(m, edges)
        g.position.set(slots[i] * 0.95, 0, Math.abs(slots[i]) * -0.35)
        group.add(g)
        columns.push({ g, m, edges, h: 0.3 + (1.9 * game.hours) / max, i })
      })
    },

    update({ v, t, mobile }: Frame) {
      group.position.x = mobile ? 0 : 1.1
      const lh = smoothstep(0, 0.8, localProgress(1, v))
      group.rotation.y = Math.sin(t * 0.25) * 0.12 + (v - 0.19) * 1.5
      for (const c of columns) {
        const hh = Math.max(
          0.02,
          c.h * smoothstep(c.i * 0.08, 0.6 + c.i * 0.08, lh),
        )
        c.m.scale.y = c.edges.scale.y = hh
        c.m.position.y = c.edges.position.y = hh / 2
      }
      const first = columns[0]
      if (first) {
        crown.position.set(
          first.g.position.x,
          first.m.scale.y + 0.5 + Math.sin(t * 2) * 0.06,
          first.g.position.z,
        )
        crown.rotation.y = t
      }
      crown.visible = !!first && lh > 0.5 && sceneAlpha(1, v) > 0.01
    },
  }
}
