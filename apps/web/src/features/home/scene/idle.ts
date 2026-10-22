import * as THREE from "three"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const TAU = Math.PI * 2
/** Angle d'une heure sur un cadran de 24 h : minuit en haut, sens des aiguilles d'une montre. */
const hourAngle = (h: number) => Math.PI / 2 - (TAU * h) / 24

const parisTime = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
})
/** Heure de Paris en heures décimales : les horaires du serveur sont donnés à l'heure française. */
function parisHour(date = new Date()) {
  const parts = parisTime.formatToParts(date)
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)
  return get("hour") + get("minute") / 60
}

/** Arc du cadran entre deux heures (de `from` à `to`, dans le sens des aiguilles). */
function arc(
  from: number,
  to: number,
  radius: number,
  tube: number,
  color: number,
) {
  const length = (TAU * (to - from)) / 24
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 8, 64, length),
    new THREE.MeshBasicMaterial({ color }),
  )
  // Le tore part de l'axe x et tourne dans le sens inverse : on le cale sur l'heure de fin.
  mesh.rotation.z = hourAngle(to)
  return mesh
}

/**
 * Station de veille, affichée quand personne ne joue : un cadran de 24 h où s'allument
 * les heures actives du serveur (18:30 → minuit, jusqu'à 2 h le vendredi et le samedi),
 * l'aiguille à l'heure de Paris et le noyau du serveur qui respire lentement.
 */
export function createIdle(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(slot) - 0.1
  group.rotation.x = -0.28
  group.scale.setScalar(0.62)
  parent.add(group)

  const dial = new THREE.Mesh(
    new THREE.TorusGeometry(2, 0.012, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0x2a3470 }),
  )
  group.add(dial)
  for (let h = 0; h < 24; h++) {
    const major = h % 6 === 0
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, major ? 0.26 : 0.1, 0.03),
      new THREE.MeshBasicMaterial({ color: major ? 0xc9cff0 : 0x5b638c }),
    )
    const a = hourAngle(h)
    tick.position.set(Math.cos(a) * 2.22, Math.sin(a) * 2.22, 0)
    tick.rotation.z = a - Math.PI / 2
    group.add(tick)
  }
  group.add(arc(18.5, 24, 2, 0.05, COL.cyan), arc(24, 26, 2, 0.03, COL.signal))

  const hand = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 1.75, 0.035),
    kit.emissive(0xeef0ff, 0.9),
  )
  hand.geometry.translate(0, 0.875, 0)
  const tip = kit.glow(0xeef0ff, 0.5, 0.9)
  group.add(hand, tip)

  const shell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.5, 1)),
    new THREE.LineBasicMaterial({
      color: COL.cyan,
      transparent: true,
      opacity: 0.45,
    }),
  )
  const coreGlow = kit.glow(COL.cyan, 1.8, 0.4)
  group.add(shell, coreGlow)

  const DP = 120
  const dust = kit.points(DP, { color: COL.cyan, size: 0.04, opacity: 0.6 })
  const dustData = Array.from({ length: DP }, () => [
    (Math.random() - 0.5) * 6,
    Math.random(),
    (Math.random() - 0.5) * 2,
    0.03 + Math.random() * 0.05,
  ])
  group.add(dust.mesh)

  let hour = parisHour()
  let lastRead = 0
  return {
    update({ t, mobile }: Frame) {
      group.position.x = mobile ? 0 : 1.1
      group.rotation.y = Math.sin(t * 0.2) * 0.12
      if (t - lastRead > 1 || t < lastRead) {
        hour = parisHour()
        lastRead = t
      }
      const a = hourAngle(hour)
      hand.rotation.z = a - Math.PI / 2
      tip.position.set(Math.cos(a) * 1.75, Math.sin(a) * 1.75, 0.02)

      const breath = 0.5 + 0.5 * Math.sin(t * 0.7)
      shell.rotation.set(t * 0.08, t * 0.12, 0)
      shell.scale.setScalar(1 + breath * 0.06)
      coreGlow.material.opacity = 0.25 + breath * 0.25

      for (let i = 0; i < DP; i++) {
        const [x, y, z, s] = dustData[i]
        dust.positions[i * 3] = x + Math.sin(t * s * 4 + i) * 0.1
        dust.positions[i * 3 + 1] = -2.4 + ((y + t * s) % 1) * 4.8
        dust.positions[i * 3 + 2] = z
      }
      dust.commit()
    },
  }
}
