import * as THREE from "three"
import { clamp, lerp, localProgress, sceneAlpha, smoothstep } from "../scroll"
import { COL, stationY, type Frame, type Kit, type Station } from "./kit"

export type Callouts = { reset: HTMLElement | null; goal: HTMLElement | null }

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z)
const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a), 0, 1)
const ease = (k: number) => k * k * (3 - 2 * k)
const backOut = (k: number) =>
  1 + 2.9 * Math.pow(k - 1, 3) + 1.9 * Math.pow(k - 1, 2)
const bezier3 = (
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3,
  k: number,
) => {
  const m = 1 - k
  return a
    .clone()
    .multiplyScalar(m * m * m)
    .add(b.clone().multiplyScalar(3 * m * m * k))
    .add(c.clone().multiplyScalar(3 * m * k * k))
    .add(d.clone().multiplyScalar(k * k * k))
}

/**
 * Station 3 : plan « héros » piloté par la progression locale u ∈ [0, 1].
 * La voiture surgit en bas à droite, file vers le ballon, prend son flip reset (0.62 → 0.72),
 * se replace, front flip, frappe (0.84) et but avec explosion (0.92 → 1).
 */
export function createRocket(
  scene: THREE.Scene,
  kit: Kit,
  callouts: Callouts,
): Station {
  const group = new THREE.Group()
  group.position.y = stationY(3)
  scene.add(group)

  const grid = new THREE.GridHelper(10, 20, COL.rl, 0x1b2a55)
  grid.position.y = -0.8
  const gridMaterial = grid.material as THREE.LineBasicMaterial
  gridMaterial.transparent = true
  gridMaterial.opacity = 0.5
  group.add(grid)

  const pads = [-1.6, 0.2].map((x) => {
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 32),
      new THREE.MeshBasicMaterial({
        color: COL.signal,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      }),
    )
    pad.rotation.x = -Math.PI / 2
    pad.position.set(x, -0.79, 0.9)
    group.add(pad)
    return pad
  })

  const S = 2.6 // échelle du plan héros
  const hero = new THREE.Group()
  hero.scale.setScalar(S)
  group.add(hero)

  // Ballon
  const ball = new THREE.Group()
  ball.add(
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      new THREE.MeshStandardMaterial({
        color: 0xd9dde8,
        roughness: 0.35,
        metalness: 0.4,
        flatShading: true,
      }),
    ),
    new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.425, 1)),
      new THREE.LineBasicMaterial({ color: COL.rl }),
    ),
  )
  const BR = 0.336
  ball.scale.setScalar(0.8)
  hero.add(ball)

  const TR = 46
  const ballTrail = kit.points(TR, { size: 0.11 }, true)
  hero.add(ballTrail.mesh)

  // Trajectoires
  let mx = 1 // resserre les positions horizontales sur mobile
  const BALL = () => V(-0.15 * mx, 0.5, 1.23)
  const CONTACT_DY = BR + 0.21 // rayon du ballon + hauteur des roues
  const GOAL = () => V(-1.7 * mx, 0.75, -3.4) // centre du but, au loin en haut à gauche
  const RESET_YAW = Math.PI - 0.25
  const yawTo = (from: THREE.Vector3, to: THREE.Vector3) =>
    Math.atan2(-(to.z - from.z), to.x - from.x)

  function ballAt(u: number, t: number) {
    const b = BALL()
    const k = 1 - ease(seg(u, 0, 0.62))
    b.x += 0.1 * k * mx
    b.y += 0.12 * k
    if (u > 0.62) {
      const c = ease(seg(u, 0.62, 0.72))
      b.x -= 0.08 * c * mx
      b.y += 0.06 * c
    }
    if (u > 0.72) b.y += 0.05 * Math.sin(seg(u, 0.72, 0.84) * Math.PI)
    if (u <= 0.84) b.y += Math.sin(t * 1.6) * 0.02 * seg(u, 0.7, 0.8)
    if (u > 0.84) {
      // Frappe : départ sec puis ralenti, en cloche jusqu'au but
      const k2 = seg(u, 0.84, 0.92)
      const e = 1 - (1 - k2) * (1 - k2)
      const g = GOAL()
      const m = 1 - e
      const ctrl = V(
        (b.x + g.x) / 2,
        Math.max(b.y, g.y) + 0.55,
        (b.z + g.z) / 2,
      )
      const p = b
        .clone()
        .multiplyScalar(m * m)
        .add(ctrl.multiplyScalar(2 * m * e))
        .add(g.clone().multiplyScalar(e * e))
      if (u > 0.92)
        p.add(V(-0.12 * mx, -0.1, -0.25).multiplyScalar(ease(seg(u, 0.92, 1))))
      return p
    }
    return b
  }

  type CarState = {
    p: THREE.Vector3
    roll: number
    pitch: number
    yaw: number
    scale: number
  }
  function carAt(u: number, t: number): CarState {
    const scale = backOut(seg(u, 0, 0.1))
    if (u < 0.62) {
      const b = ballAt(u, t)
      const contact = V(b.x, b.y - CONTACT_DY, b.z)
      const k = ease(seg(u, 0.04, 0.62))
      const p = bezier3(
        V(0.78 * mx, -0.18, 1.9),
        V(0.6 * mx, -0.2, 1.8),
        V(0.15 * mx, -0.25, 1.45),
        contact,
        k,
      )
      return {
        p,
        roll: Math.PI * ease(seg(u, 0.36, 0.62)),
        pitch: lerp(0.35, 0.6, seg(u, 0, 0.3)) * (1 - ease(seg(u, 0.42, 0.62))),
        yaw: lerp(2.62, RESET_YAW, ease(seg(u, 0.2, 0.62))),
        scale,
      }
    }
    const b72 = ballAt(0.72, t)
    const b84 = ballAt(0.84, t)
    const contact = V(b72.x, b72.y - CONTACT_DY, b72.z)
    const Q = b84.clone().add(V(0.75 * mx, -0.1, 0.25)) // derrière le ballon, côté caméra
    const yawGoal = yawTo(Q, GOAL())
    if (u < 0.72) {
      const b = ballAt(u, t)
      return {
        p: V(b.x, b.y - CONTACT_DY, b.z),
        roll: Math.PI,
        pitch: 0,
        yaw: RESET_YAW,
        scale,
      }
    }
    if (u < 0.8) {
      const k = ease(seg(u, 0.72, 0.8))
      return {
        p: contact.clone().lerp(Q, k),
        roll: Math.PI * (1 + k),
        pitch: 0,
        yaw: lerp(RESET_YAW, yawGoal, k),
        scale,
      }
    }
    const toBall = b84.clone().sub(Q)
    const hitPoint = b84.clone().sub(toBall.normalize().multiplyScalar(0.78))
    if (u < 0.86) {
      const k = ease(seg(u, 0.8, 0.86))
      return {
        p: Q.clone().lerp(hitPoint, k),
        roll: 0,
        pitch: -Math.PI * 2 * k,
        yaw: yawGoal,
        scale,
      }
    }
    const k = seg(u, 0.86, 1)
    const forward = GOAL().sub(Q).setY(0).normalize()
    return {
      p: hitPoint
        .clone()
        .add(forward.multiplyScalar(1.5 * (1 - (1 - k) * (1 - k))))
        .add(V(0, -0.45 * k * k, 0)),
      roll: 0,
      pitch: -Math.PI * 2 - 0.25 * ease(k),
      yaw: yawGoal,
      scale,
    }
  }
  const boostAt = (u: number) => u < 0.58 || (u > 0.73 && u < 0.8)

  // Voiture-fusée originale
  const car = new THREE.Group()
  car.rotation.order = "YZX"
  hero.add(car)
  const shape = new THREE.Shape()
  ;[
    [-0.55, 0],
    [0.5, 0],
    [0.6, 0.07],
    [0.58, 0.13],
    [0.18, 0.2],
    [-0.02, 0.34],
    [-0.32, 0.35],
    [-0.52, 0.26],
    [-0.58, 0.12],
  ].forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)))
  const bodyGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.54,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 4,
  })
  bodyGeometry.translate(0, -0.08, -0.27)
  car.add(
    new THREE.Mesh(
      bodyGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x2a3470,
        metalness: 0.65,
        roughness: 0.28,
      }),
    ),
  )

  const dark = () =>
    new THREE.MeshStandardMaterial({ color: 0x10131f, roughness: 0.6 })
  const part = (
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z)
    car.add(mesh)
    return mesh
  }
  const cockpit = part(
    0.3,
    0.08,
    0.5,
    new THREE.MeshStandardMaterial({
      color: 0x0b1022,
      emissive: COL.cyan,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.8,
    }),
    -0.17,
    0.22,
    0,
  )
  cockpit.rotation.z = 0.1
  for (const s of [-1, 1]) {
    part(0.95, 0.025, 0.01, kit.emissive(COL.cyan, 1.5), 0.02, 0.02, s * 0.305) // filet latéral
    part(0.16, 0.07, 0.012, dark(), -0.12, 0.1, s * 0.306) // prise d'air
    part(0.012, 0.028, 0.11, kit.emissive(0xffffff, 2.5), 0.605, 0.1, s * 0.17) // phares
    part(0.012, 0.03, 0.13, kit.emissive(0xff3b3b, 2), -0.605, 0.17, s * 0.19) // feux arrière
    part(0.02, 0.09, 0.02, dark(), -0.52, 0.3, s * 0.2) // pieds d'aileron
  }
  part(0.14, 0.02, 0.64, dark(), 0.57, -0.075, 0) // lame avant
  part(0.02, 0.03, 0.5, kit.emissive(COL.cyan, 2), 0.6, 0.06, 0) // néon de calandre
  part(0.13, 0.025, 0.62, kit.emissive(COL.signal, 1), -0.56, 0.36, 0) // aileron
  part(0.32, 0.06, 0.014, kit.emissive(COL.cyan, 1.3), -0.36, 0.39, 0) // aileron de toit
  part(0.1, 0.05, 0.5, dark(), -0.6, -0.04, 0) // diffuseur

  const cyan = new THREE.Color(COL.cyan)
  const white = new THREE.Color(1, 1, 1)
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d1020,
    emissive: COL.cyan,
    emissiveIntensity: 1.2,
    roughness: 0.3,
  })
  const wheels = (
    [
      [0.34, 0.31, 0.13],
      [0.34, -0.31, 0.13],
      [-0.34, 0.31, 0.145],
      [-0.34, -0.31, 0.145],
    ] as const
  ).map(([x, z, r]) => {
    const wheel = new THREE.Group()
    const tire = new THREE.CylinderGeometry(r, r, 0.12, 28)
    tire.rotateX(Math.PI / 2)
    const rim = new THREE.CylinderGeometry(r * 0.58, r * 0.58, 0.125, 18)
    rim.rotateX(Math.PI / 2)
    wheel.add(new THREE.Mesh(tire, dark()), new THREE.Mesh(rim, rimMaterial))
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(r * 1.05, 0.016, 0.13),
        dark(),
      )
      spoke.rotation.z = (i / 5) * Math.PI * 2
      wheel.add(spoke)
    }
    wheel.position.set(x, -0.08 - (r - 0.13), z)
    car.add(wheel)
    return wheel
  })

  const additive = (color: number, opacity: number) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.55, 16),
    additive(COL.signal, 0.85),
  )
  flame.rotation.z = Math.PI / 2
  flame.position.set(-0.86, 0.05, 0)
  const flameCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.32, 12),
    additive(0xfff1c2, 0.9),
  )
  flameCore.rotation.z = Math.PI / 2
  flameCore.position.set(-0.76, 0.05, 0)
  const flameGlow = kit.glow(COL.signal, 1.1, 0.8)
  flameGlow.position.set(-0.7, 0.05, 0)
  car.add(flame, flameCore, flameGlow)

  // Traînée de boost : positions passées de l'échappement, recalculées depuis le scroll
  const BT = 50
  const boostTrail = kit.points(BT, { size: 0.12 }, true)
  hero.add(boostTrail.mesh)
  const ghost = new THREE.Object3D()
  ghost.rotation.order = "YZX"
  const exhaust = new THREE.Vector3()
  const EXHAUST = V(-0.62, 0.05, 0)

  // Halo du flip reset
  const halo = new THREE.Group()
  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.018, 10, 96),
    additive(0xffffff, 0),
  )
  const haloRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.01, 10, 96),
    additive(COL.cyan, 0),
  )
  haloRing.rotation.x = haloRing2.rotation.x = Math.PI / 2
  const haloGlow = kit.glow(COL.cyan, 1.8, 0)
  halo.add(haloRing, haloRing2, haloGlow)
  hero.add(halo)

  // But au loin + explosion
  const goal = new THREE.Group()
  const goalMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d1020,
    emissive: COL.cyan,
    emissiveIntensity: 1.6,
    fog: false,
  })
  for (const [x, y, z, w, h, d] of [
    [0, 0.4, -0.75, 0.05, 0.85, 0.05],
    [0, 0.4, 0.75, 0.05, 0.85, 0.05],
    [0, 0.82, 0, 0.05, 0.05, 1.55],
    [-0.35, 0.82, -0.75, 0.7, 0.04, 0.04],
    [-0.35, 0.82, 0.75, 0.7, 0.04, 0.04],
  ]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), goalMaterial)
    bar.position.set(x, y, z)
    goal.add(bar)
  }
  const net: number[] = []
  for (let i = 0; i <= 10; i++) {
    const z = -0.75 + i * 0.15
    net.push(-0.7, 0, z, -0.7, 0.82, z)
  }
  for (let j = 0; j <= 5; j++) {
    const y = (j * 0.82) / 5
    net.push(-0.7, y, -0.75, -0.7, y, 0.75)
  }
  const netGeometry = new THREE.BufferGeometry()
  netGeometry.setAttribute("position", new THREE.Float32BufferAttribute(net, 3))
  goal.add(
    new THREE.LineSegments(
      netGeometry,
      new THREE.LineBasicMaterial({
        color: COL.cyan,
        transparent: true,
        opacity: 0.45,
        fog: false,
      }),
    ),
  )
  hero.add(goal)

  const EX = 460
  const explosion = kit.points(EX, { size: 0.32, opacity: 0, fog: false }, true)
  const explosionMaterial = explosion.mesh.material as THREE.PointsMaterial
  const PALETTE = [
    [1, 0.75, 0.25],
    [1, 0.42, 0.15],
    [1, 0.95, 0.8],
    [0.35, 0.9, 1],
  ]
  const explosionData = Array.from({ length: EX }, (_, i) => {
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(1 - 2 * Math.random())
    const dir = V(
      Math.sin(ph) * Math.cos(th),
      Math.abs(Math.cos(ph)) * 0.9 + 0.1,
      Math.sin(ph) * Math.sin(th),
    ).normalize()
    const [r, g, b] = PALETTE[i % 7 === 0 ? 3 : i % 3]
    explosion.colors.set([r, g, b], i * 3)
    return { dir, speed: 0.6 + Math.random() * 1.8 }
  })
  explosion.commit()
  hero.add(explosion.mesh)
  const shock = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.03, 10, 96),
    additive(0xff8a3d, 0),
  )
  ;(shock.material as THREE.MeshBasicMaterial).fog = false
  const flash = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: kit.glowTex,
      color: 0xffd9a0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  )
  hero.add(shock, flash)

  const haloMaterials = [
    haloRing.material,
    haloRing2.material,
    haloGlow.material,
    shock.material as THREE.MeshBasicMaterial,
  ]
  const [haloMat, halo2Mat, haloGlowMat, shockMat] = haloMaterials

  return {
    update({ v, t, ly, mobile, camera }: Frame) {
      const lr = localProgress(3, v)
      const ra = sceneAlpha(3, v)
      mx = mobile ? 0.42 : 1

      const bp = ballAt(lr, t)
      ball.position.copy(bp)
      ball.rotation.set(
        lr * 6 + t * 0.2 + smoothstep(0.84, 0.92, lr) * 14,
        lr * 4,
        0,
      )

      const cs = carAt(lr, t)
      car.position.copy(cs.p)
      car.rotation.set(cs.roll, cs.yaw, cs.pitch)
      car.scale.setScalar(Math.max(0.001, cs.scale))
      for (const wheel of wheels) wheel.rotation.z = -lr * 70

      flame.visible = flameCore.visible = flameGlow.visible = boostAt(lr)
      flame.scale.set(1, 1 + Math.sin(t * 40) * 0.15, 1)
      flameCore.scale.set(1, 1 + Math.sin(t * 53) * 0.2, 1)

      for (let i = 0; i < BT; i++) {
        const uu = lr - i * 0.0035
        const c = carAt(Math.max(0, uu), t)
        ghost.position.copy(c.p)
        ghost.rotation.set(c.roll, c.yaw, c.pitch)
        ghost.scale.setScalar(Math.max(0.001, c.scale))
        ghost.updateMatrix()
        exhaust.copy(EXHAUST).applyMatrix4(ghost.matrix)
        boostTrail.positions.set(
          [exhaust.x, exhaust.y + Math.sin(i * 1.7) * 0.02, exhaust.z],
          i * 3,
        )
        const f = (1 - i / BT) * (uu > 0.01 && boostAt(uu) ? 1 : 0)
        boostTrail.colors.set([f, 0.45 * f, 0.2 * f], i * 3)
      }
      boostTrail.commit()

      // Traînée du ballon après la frappe
      for (let i = 0; i < TR; i++) {
        const uu = lr - i * 0.0025
        const q = ballAt(Math.max(0, uu), t)
        ballTrail.positions.set([q.x, q.y, q.z], i * 3)
        const f = (1 - i / TR) * (uu > 0.84 && uu < 0.93 ? 1 : 0)
        ballTrail.colors.set([0.35 * f, 0.8 * f, f], i * 3)
      }
      ballTrail.commit()

      // Flip reset : les roues touchent le ballon et s'illuminent
      const hitR = smoothstep(0.6, 0.64, lr)
      const reset = hitR * (1 - smoothstep(0.74, 0.8, lr))
      rimMaterial.emissiveIntensity = 1.2 + reset * 5
      rimMaterial.emissive.copy(cyan).lerp(white, reset)
      halo.position.set(bp.x, bp.y - BR, bp.z)
      const pulse = 1 + 0.06 * Math.sin(t * 5)
      haloMat.opacity = reset
      haloRing.scale.setScalar((1 + smoothstep(0.62, 0.74, lr) * 0.45) * pulse)
      halo2Mat.opacity = reset * 0.7
      haloRing2.scale.setScalar((1.2 + smoothstep(0.62, 0.8, lr) * 0.6) * pulse)
      haloGlowMat.opacity = reset * 0.8
      pads.forEach(
        (pad, i) =>
          ((pad.material as THREE.MeshBasicMaterial).opacity =
            0.35 + 0.3 * Math.sin(t * 4 + i)),
      )

      // But et explosion
      const gc = GOAL()
      const Qg = ballAt(0.84, t).add(V(0.75 * mx, -0.1, 0.25))
      const fwd = gc.clone().sub(Qg).setY(0).normalize()
      goal.position.set(gc.x, gc.y - 0.38, gc.z)
      goal.rotation.y = Math.atan2(fwd.z, -fwd.x)
      goal.visible = lr > 0.7
      const ex = seg(lr, 0.92, 0.99)
      const exE = 1 - Math.pow(1 - ex, 3)
      explosion.mesh.visible = shock.visible = flash.visible = ex > 0
      if (ex > 0) {
        explosionData.forEach(({ dir, speed }, i) => {
          const d = speed * exE * 1.2
          explosion.positions.set(
            [
              gc.x + dir.x * d,
              gc.y + dir.y * d - 0.7 * ex * ex,
              gc.z + dir.z * d,
            ],
            i * 3,
          )
        })
        explosion.commit()
        explosionMaterial.opacity = 1 - smoothstep(0.55, 1, ex) * 0.85
        shock.position.copy(gc)
        shock.lookAt(
          camera.position.clone().sub(group.position).divideScalar(S),
        )
        shock.scale.setScalar(0.4 + exE * 2.4)
        shockMat.opacity = (1 - ex) * 0.8
        flash.position.copy(gc)
        flash.scale.setScalar(1.5 + exE * 3)
        flash.material.opacity =
          smoothstep(0, 0.06, ex) * (1 - smoothstep(0.1, 0.6, ex))
      }
      goalMaterial.emissiveIntensity =
        1.6 +
        smoothstep(0.92, 0.95, lr) * 3 * (1 - smoothstep(0.97, 1, lr) * 0.6)

      if (callouts.reset) {
        callouts.reset.style.opacity = String(
          hitR * (1 - smoothstep(0.74, 0.78, lr)) * ra,
        )
        callouts.reset.style.transform = `translate(-50%,0) scale(${0.9 + hitR * 0.1})`
      }
      if (callouts.goal) {
        const gA = smoothstep(0.925, 0.95, lr)
        callouts.goal.style.opacity = String(gA * ra)
        callouts.goal.style.transform = `translate(-50%,0) scale(${0.8 + gA * 0.2})`
      }

      // Caméra : recul pendant l'action, puis accompagne la frappe vers le but
      if (ra > 0.01) {
        camera.position.z +=
          (mobile ? 1.5 : 1.1) * ease(seg(lr, 0.05, 0.7)) * ra +
          (mobile ? 1.5 : 1.2) * ease(seg(lr, 0.8, 0.92)) * ra
        camera.position.y += 0.5 * ra
        const follow = ease(seg(lr, 0.82, 0.94)) * ra
        const fx =
          (mobile ? (cs.p.x + bp.x) * 0.5 * S * 0.6 * ra : 0.4) +
          follow * gc.x * S * 0.45
        const fy = ly + 0.5 * ra + follow * 0.6
        camera.position.x += (mobile ? fx : 0) + follow * gc.x * S * 0.15
        camera.lookAt(fx, fy, 0)
      }
    },
  }
}
