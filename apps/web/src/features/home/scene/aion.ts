import * as THREE from "three"
import { lerp, localProgress, sceneAlpha, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

const TAU = Math.PI * 2
const UP = new THREE.Vector3(0, 1, 0)
/** Pied de la statue (dessus du socle) et hauteur jusqu'au halo. */
const FOOT = 0.75
const HEIGHT = 4.9

const ease = (k: number) => k * k * (3 - 2 * k)

/** Plume d'aile : une feuille effilée, de la base (0, 0) vers la pointe (0, 1). */
function featherShape() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.quadraticCurveTo(0.16, 0.45, 0.02, 1)
  s.quadraticCurveTo(-0.1, 0.5, 0, 0)
  return s
}

/** Cylindre tendu entre deux points (bras de la statue). */
function limb(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const dir = to.clone().sub(from)
  const geometry = new THREE.CylinderGeometry(
    radius * 0.8,
    radius,
    dir.length(),
    7,
  )
  geometry.translate(0, dir.length() / 2, 0)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(from)
  mesh.quaternion.setFromUnitVectors(UP, dir.normalize())
  return mesh
}

/**
 * Station AION 2 : une statue géante de Daeva aux ailes déployées, l'épée plantée devant elle,
 * dressée sur un cercle de téléportation. Pendant la station, la caméra la remonte des pieds
 * jusqu'au halo en diagonale, à 45°.
 */
export function createAion(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  const baseY = stationY(slot) - 1.6
  group.position.y = baseY
  parent.add(group)

  const stone = new THREE.MeshStandardMaterial({
    color: 0x4a4f72,
    roughness: 0.75,
    metalness: 0.1,
    flatShading: true,
  })

  // Socle à trois marches et cercle de téléportation
  ;[1.7, 1.4, 1.1].forEach((r, i) => {
    const step = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r + 0.08, 0.25, 8),
      stone,
    )
    step.position.y = 0.125 + i * 0.25
    group.add(step)
  })
  const rune = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.025, 8, 96),
    kit.emissive(COL.aion, 1.6),
  )
  rune.rotation.x = Math.PI / 2
  rune.position.y = FOOT + 0.01
  const runeInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.012, 6, 6),
    new THREE.MeshBasicMaterial({ color: COL.aion }),
  )
  runeInner.rotation.x = Math.PI / 2
  runeInner.position.y = FOOT + 0.01
  group.add(rune, runeInner)

  // Corps : une robe tournée (silhouette de la cheville au cou)
  const robe = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0.001, 0],
        [0.72, 0],
        [0.6, 0.8],
        [0.46, 1.6],
        [0.33, 2.3],
        [0.43, 2.85],
        [0.52, 3.25],
        [0.22, 3.45],
        [0.12, 3.55],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      10,
    ),
    stone,
  )
  robe.position.y = FOOT
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), stone)
  head.position.y = FOOT + 3.8

  // Bras repliés sur la garde de l'épée, plantée devant la statue
  const hands = new THREE.Vector3(0, FOOT + 2.55, 0.62)
  const arms = [-1, 1].map((side) =>
    limb(new THREE.Vector3(side * 0.48, FOOT + 3.2, 0.05), hands, 0.11, stone),
  )
  const bladeMaterial = kit.emissive(0xcfc2ff, 0.5)
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 2.1, 0.03),
    bladeMaterial,
  )
  blade.position.set(0, FOOT + 1.4, 0.66)
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 0.07), stone)
  guard.position.set(0, FOOT + 2.48, 0.66)
  group.add(robe, head, ...arms, blade, guard)

  // Ailes : sept plumes par côté, en éventail depuis le dos
  const featherGeometry = new THREE.ShapeGeometry(featherShape(), 8)
  const featherMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a95c8,
    emissive: COL.aion,
    emissiveIntensity: 0.25,
    roughness: 0.6,
    side: THREE.DoubleSide,
    flatShading: true,
  })
  const featherEdge = new THREE.LineBasicMaterial({ color: COL.aion })
  const edgeGeometry = new THREE.EdgesGeometry(featherGeometry)
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Group()
    wing.position.set(side * 0.22, FOOT + 3.2, -0.3)
    for (let i = 0; i < 7; i++) {
      const k = i / 6
      // De presque horizontal (bas de l'aile) à presque vertical (haut de l'aile)
      const angle = lerp(0.25, 1.45, k)
      const length = lerp(2.4, 1.3, Math.abs(k - 0.35) * 1.5)
      const feather = new THREE.Group()
      feather.add(
        new THREE.Mesh(featherGeometry, featherMaterial),
        new THREE.LineSegments(edgeGeometry, featherEdge),
      )
      feather.scale.set(length * 0.55, length, 1)
      feather.rotation.z = side * -(Math.PI / 2 - angle)
      feather.position.z = -i * 0.015
      wing.add(feather)
    }
    group.add(wing)
    return { wing, side }
  })

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.022, 8, 64),
    kit.emissive(0xe6dcff, 1.6),
  )
  halo.position.y = FOOT + 4.25
  halo.rotation.x = Math.PI / 2.4
  const haloGlow = kit.glow(COL.aion, 1.8, 0.6)
  haloGlow.position.y = FOOT + 4.25
  group.add(halo, haloGlow)

  // Éther qui monte en spirale le long de la statue
  const EP = 180
  const ether = kit.points(EP, { color: 0xcdb8ff, size: 0.05 })
  const etherData = Array.from({ length: EP }, () => [
    Math.random() * TAU,
    0.9 + Math.random() * 0.9,
    Math.random(),
    0.08 + Math.random() * 0.12,
  ])
  group.add(ether.mesh)

  const eye = new THREE.Vector3()
  const look = new THREE.Vector3()

  return {
    update({ v, t, ly, mobile, camera }: Frame) {
      const la = localProgress(slot, v)
      const ra = sceneAlpha(slot, v)
      const x = mobile ? 0 : 1.1
      group.position.x = x
      group.rotation.y = Math.sin(t * 0.15) * 0.06

      const breath = Math.sin(t * 0.8) * 0.05
      for (const { wing, side } of wings)
        wing.rotation.y = side * (0.35 + breath)
      rune.rotation.z = t * 0.3
      runeInner.rotation.z = -t * 0.5
      ;(rune.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.2 + 0.6 * Math.sin(t * 3)
      halo.rotation.z = t * 0.4

      for (let i = 0; i < EP; i++) {
        const [a, r, h, s] = etherData[i]
        const k = (h + t * s * 0.25) % 1
        const ang = a + t * s * 2
        ether.positions[i * 3] = Math.cos(ang) * r
        ether.positions[i * 3 + 1] = FOOT + k * HEIGHT
        ether.positions[i * 3 + 2] = Math.sin(ang) * r
      }
      ether.commit()

      // Caméra : montée en diagonale (autant de côté que de hauteur, soit 45°), des pieds au halo,
      // en regardant la statue un peu au-dessus de soi.
      if (ra > 0.01) {
        const k = ease(smoothstep(0, 1, la))
        const y = baseY + FOOT + 0.3 + k * (HEIGHT - 1.9)
        eye.set(x + lerp(-2.2, 2.2, k), y - 1, mobile ? 6.2 : 5)
        // Le regard se redresse en haut : on finit face à la tête et au halo, pas dans le vide.
        look.set(x, y + lerp(1.1, 0.4, k), 0)
        camera.position.lerp(eye, ra)
        const lookY = lerp(ly + (mobile ? -1 : 0), look.y, ra)
        camera.lookAt(lerp(mobile ? 0 : 0.4, look.x, ra), lookY, 0)
      }
    },
  }
}
