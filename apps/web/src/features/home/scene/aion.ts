import * as THREE from "three"
import { localProgress } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

/** Silhouette d'une aile de Daeva, de l'épaule (0, 0) vers la pointe. */
function wingShape() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.3, 0.35, 0.75, 0.48, 1.08, 0.4)
  s.bezierCurveTo(0.82, 0.24, 0.86, 0.06, 0.96, -0.06)
  s.bezierCurveTo(0.72, 0, 0.62, -0.12, 0.64, -0.26)
  s.bezierCurveTo(0.42, -0.12, 0.2, -0.1, 0, 0)
  return s
}

/** Station AION 2 : île suspendue, tour de cristal et Daeva ailé qui s'élève en spirale avec le scroll. */
export function createAion(
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
): Station {
  const group = new THREE.Group()
  const baseY = stationY(slot) - 0.35
  group.position.y = baseY
  group.scale.setScalar(0.8)
  parent.add(group)

  const stone = new THREE.MeshStandardMaterial({
    color: 0x2a2f4a,
    roughness: 0.85,
    flatShading: true,
  })
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.55, 0.22, 9),
    stone,
  )
  // Dessous de l'île : un cône retourné, bosselé pour ressembler à de la roche arrachée.
  const underGeometry = new THREE.ConeGeometry(1.55, 1.9, 9, 3)
  const pos = underGeometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0.9) continue
    pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.22)
    pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.22)
  }
  underGeometry.computeVertexNormals()
  const under = new THREE.Mesh(underGeometry, stone)
  under.rotation.x = Math.PI
  under.position.y = -1.06
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.66, 0.015, 6, 90),
    new THREE.MeshBasicMaterial({ color: COL.aion }),
  )
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.12
  group.add(top, under, rim)

  // La tour de cristal au centre de l'île
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.14, 1.9, 6),
    kit.emissive(COL.aion, 0.7),
  )
  tower.position.y = 1.05
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    kit.emissive(0xe6dcff, 1.6),
  )
  crystal.position.y = 2.25
  const crown = kit.glow(COL.aion, 2.2, 0.8)
  crown.position.y = 2.25
  group.add(tower, crystal, crown)

  // Îlots en orbite autour de l'île
  const islets = Array.from({ length: 5 }, (_, i) => {
    const m = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.16, 0),
      stone,
    )
    group.add(m)
    return {
      m,
      a: (i / 5) * Math.PI * 2,
      r: 2.3 + Math.random() * 0.6,
      y: -0.6 + Math.random() * 1.8,
      s: 0.12 + Math.random() * 0.12,
    }
  })

  // Le Daeva : un corps lumineux et deux ailes qui battent
  const wingGeometry = new THREE.ShapeGeometry(wingShape(), 12)
  const wingMaterial = new THREE.MeshBasicMaterial({
    color: COL.aion,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const wingR = new THREE.Mesh(wingGeometry, wingMaterial)
  const wingL = new THREE.Mesh(wingGeometry, wingMaterial)
  wingR.scale.setScalar(0.85)
  wingL.scale.set(-0.85, 0.85, 0.85)
  const daeva = new THREE.Group()
  daeva.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 8),
      kit.emissive(0xffffff, 1.5),
    ),
    wingR,
    wingL,
    kit.glow(COL.aion, 0.9, 0.9),
  )
  group.add(daeva)

  const TR = 48
  const trail = kit.points(TR, { size: 0.07 }, true)
  group.add(trail.mesh)

  // Éther qui monte le long de la tour
  const EP = 140
  const ether = kit.points(EP, { color: 0xcdb8ff, size: 0.05 })
  const etherData = Array.from({ length: EP }, () => [
    Math.random() * Math.PI * 2,
    0.3 + Math.random() * 1.3,
    Math.random(),
    0.1 + Math.random() * 0.2,
  ])
  group.add(ether.mesh)

  /** Trajectoire du Daeva : une spirale qui monte avec la progression locale. */
  const path = (time: number, la: number, out: THREE.Vector3) => {
    const ang = time * 0.9 + la * 6
    const r = 1.15 + 0.25 * Math.sin(time * 0.7)
    return out.set(
      Math.cos(ang) * r,
      0.5 + la * 1.8 + Math.sin(time * 1.6) * 0.08,
      Math.sin(ang) * r,
    )
  }
  const p = new THREE.Vector3()

  return {
    update({ v, t, mobile }: Frame) {
      const la = localProgress(slot, v)
      group.position.x = mobile ? 0 : 1.1
      group.position.y = baseY + Math.sin(t * 0.8) * 0.06
      group.rotation.y = 0.2 + v * 1.1 + Math.sin(t * 0.2) * 0.05
      crystal.rotation.y = t * 0.8

      for (const it of islets) {
        const ang = it.a + t * it.s
        it.m.position.set(
          Math.cos(ang) * it.r,
          it.y + Math.sin(t * 0.9 + it.a) * 0.12,
          Math.sin(ang) * it.r,
        )
        it.m.rotation.set(t * 0.3 + it.a, t * 0.2, 0)
      }

      path(t, la, daeva.position)
      daeva.rotation.y = -(t * 0.9 + la * 6)
      const flap = 0.25 + Math.sin(t * 9) * 0.55
      wingR.rotation.y = flap
      wingL.rotation.y = -flap

      for (let i = 0; i < TR; i++) {
        path(t - i * 0.03, la, p)
        trail.positions.set([p.x, p.y, p.z], i * 3)
        const f = 1 - i / TR
        trail.colors.set([0.7 * f, 0.55 * f, f], i * 3)
      }
      trail.commit()

      for (let i = 0; i < EP; i++) {
        const [a, r, h, s] = etherData[i]
        const k = (h + t * s * 0.3) % 1
        const ang = a + t * s
        ether.positions[i * 3] = Math.cos(ang) * r * (1 - k * 0.6)
        ether.positions[i * 3 + 1] = 0.15 + k * 2.3
        ether.positions[i * 3 + 2] = Math.sin(ang) * r * (1 - k * 0.6)
      }
      ether.commit()
    },
  }
}
