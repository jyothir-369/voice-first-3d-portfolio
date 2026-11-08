import * as THREE from 'three'
import type { BuilderFunction } from '@/types'

const isDark = !window.matchMedia('(prefers-color-scheme: light)').matches ||
               document.documentElement.dataset.theme === 'dark'

const INK = isDark ? 0xf4f3ef : 0x0b0b0c
const ACC = 0xff3b1f

// Material cache
const materialCache: Record<string, THREE.Material> = {}

function lineMaterial(color: number): THREE.LineBasicMaterial {
  const key = `l${color}`
  if (!materialCache[key]) {
    materialCache[key] = new THREE.LineBasicMaterial({ color })
  }
  return materialCache[key] as THREE.LineBasicMaterial
}

function pointMaterial(color: number, dotTexture: THREE.Texture): THREE.PointsMaterial {
  const key = `p${color}`
  if (!materialCache[key]) {
    materialCache[key] = new THREE.PointsMaterial({
      color,
      size: 0.07,
      map: dotTexture,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false
    })
  }
  return materialCache[key] as THREE.PointsMaterial
}

// Create dot texture
const canvas = document.createElement('canvas')
canvas.width = canvas.height = 32
const ctx = canvas.getContext('2d')!
ctx.fillStyle = '#fff'
ctx.beginPath()
ctx.arc(16, 16, 14, 0, Math.PI * 2)
ctx.fill()
const dotTexture = new THREE.CanvasTexture(canvas)

function holo(
  geometry: THREE.BufferGeometry,
  color: number,
  wireframe = false
): THREE.Group {
  const group = new THREE.Group()
  const edges = wireframe
    ? new THREE.WireframeGeometry(geometry)
    : new THREE.EdgesGeometry(geometry)
  group.add(new THREE.LineSegments(edges, lineMaterial(color)))
  group.add(new THREE.Points(geometry, pointMaterial(color, dotTexture)))
  return group
}

function add(parent: THREE.Group, child: THREE.Group, x = 0, y = 0, z = 0): THREE.Group {
  child.position.set(x, y, z)
  parent.add(child)
  return child
}

// Geometry shortcuts
const Bx = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const Ic = (r: number, detail: number) => new THREE.IcosahedronGeometry(r, detail)
const Tr = (r: number, tube: number, segments: number) =>
  new THREE.TorusGeometry(r, tube, 4, segments)
const Cy = (top: number, bottom: number, height: number, segments: number) =>
  new THREE.CylinderGeometry(top, bottom, height, segments)

/**
 * Object builders - each returns a group and update function
 */
export const BUILDERS: Record<string, BuilderFunction> = {
  agents: () => {
    const g = new THREE.Group()
    const core = add(g, holo(Ic(0.42, 1), ACC, true))
    const satellites: THREE.Group[] = []
    for (let i = 0; i < 6; i++) {
      satellites.push(add(g, holo(Bx(0.2, 0.2, 0.2), INK)))
    }
    const ring = add(g, holo(Tr(1.1, 0.004, 64), INK, true))
    ring.rotation.x = Math.PI / 2

    return {
      g,
      u: (t, a) => {
        core.rotation.y = t
        satellites.forEach((obj, i) => {
          const angle = t * (1 + a * 2) + i * 1.047
          obj.position.set(Math.cos(angle) * 1.1, Math.sin(angle * 1.7) * 0.4, Math.sin(angle) * 1.1)
          obj.rotation.x = t * 2
        })
      }
    }
  },

  clock: () => {
    const g = new THREE.Group()
    add(g, holo(Tr(0.9, 0.012, 48), INK, true))
    const h1 = new THREE.Group()
    const h2 = new THREE.Group()
    g.add(h1)
    g.add(h2)
    add(h1, holo(Bx(0.05, 0.62, 0.02), ACC), 0, 0.31, 0)
    add(h2, holo(Bx(0.04, 0.42, 0.02), INK), 0, 0.21, 0)
    const envs: THREE.Group[] = []
    for (let i = 0; i < 3; i++) {
      envs.push(add(g, holo(Bx(0.42, 0.28, 0.02), INK)))
    }

    return {
      g,
      u: t => {
        h1.rotation.z = -t * 5
        h2.rotation.z = -t * 0.6
        envs.forEach((e, i) => {
          const angle = t * 0.8 + i * 2.09
          e.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 0.9, 0)
          e.rotation.z = angle * 0.3
        })
      }
    }
  },

  plant: () => {
    const g = new THREE.Group()
    add(g, holo(Cy(0.42, 0.3, 0.5, 10), INK), 0, -0.6, 0)
    const p = new THREE.Group()
    p.position.y = -0.35
    g.add(p)
    add(p, holo(Cy(0.03, 0.03, 1.2, 6), INK), 0, 0.6, 0)
    const leaves = [
      [0.3, 0.35, 0.5],
      [-0.3, 0.6, -0.6],
      [0.32, 0.85, 0.5],
      [-0.3, 1.05, -0.5]
    ]
    leaves.forEach((coords: number[]) => {
      const [x = 0, y = 0, z = 0] = coords
      const leaf = add(p, holo(new THREE.SphereGeometry(0.2, 6, 4), INK, true), x, y, 0)
      leaf.scale.set(1.4, 0.35, 0.8)
      leaf.rotation.z = z
    })
    const flower = add(p, holo(Ic(0.18, 0), ACC), 0, 1.3, 0)

    return {
      g,
      u: (t, _a, age) => {
        const k = Math.min(1, age * 0.6)
        p.scale.set(1, 0.05 + 0.95 * k, 1)
        flower.scale.setScalar(k * k)
        g.rotation.y = t * 0.5
        p.rotation.z = Math.sin(t * 2) * 0.04
      }
    }
  },

  ledger: () => {
    const g = new THREE.Group()
    const book = new THREE.Group()
    g.add(book)
    add(book, holo(Bx(0.95, 1.2, 0.12), INK), 0, 0, -0.1)
    add(book, holo(Bx(0.9, 1.14, 0.1), INK), 0, 0, 0.02)
    add(book, holo(Bx(0.4, 0.06, 0.02), ACC), 0, 0.35, 0.1)
    for (let i = 0; i < 4; i++) {
      add(book, holo(Bx(0.6, 0.02, 0.02), INK), 0, 0.15 - i * 0.2, 0.1)
    }
    const coin = add(g, holo(Cy(0.35, 0.35, 0.06, 16), ACC), 1.1, -0.2, 0)
    coin.rotation.x = 1.2

    return {
      g,
      u: t => {
        book.rotation.y = Math.sin(t) * 0.5
        coin.rotation.z = t * 3
      }
    }
  },

  notes: () => {
    const g = new THREE.Group()
    const notes: THREE.Group[] = []
    for (let i = 0; i < 5; i++) {
      notes.push(add(g, holo(Bx(0.7, 0.7, 0.02), i === 2 ? ACC : INK)))
    }

    return {
      g,
      u: (t, _a, age) => {
        const f = Math.min(1, age * 1.2)
        notes.forEach((note, i) => {
          const angle = (i - 2) * 0.38 * f + Math.sin(t + i) * 0.04
          note.position.set(Math.sin(angle) * 1.1, Math.cos(angle) * 0.2 * f - 0.1, i * 0.03)
          note.rotation.z = -angle
        })
      }
    }
  },

  model: () => {
    const g = new THREE.Group()
    const outer = add(g, holo(Ic(0.85, 1), INK, true))
    const inner = add(g, holo(Ic(0.4, 0), ACC))
    const ring = add(g, holo(Tr(1.2, 0.004, 64), INK, true))

    return {
      g,
      u: (t, a) => {
        outer.rotation.y = t * 0.6
        outer.rotation.x = t * 0.3
        inner.scale.setScalar(1 + a * 0.6)
        ring.rotation.x = 1.2 + t * 0.5
      }
    }
  },

  tests: () => {
    const g = new THREE.Group()
    const cells: Array<{ w: THREE.Group; s: THREE.Mesh }> = []
    for (let i = 0; i < 12; i++) {
      const cell = new THREE.Group()
      const wireframe = holo(Bx(0.28, 0.28, 0.28), INK)
      const solid = new THREE.Mesh(Bx(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: ACC }))
      solid.visible = false
      cell.add(wireframe)
      cell.add(solid)
      cell.position.set(((i % 4) - 1.5) * 0.5, (1 - Math.floor(i / 4)) * 0.5, 0)
      g.add(cell)
      cells.push({ w: wireframe, s: solid })
    }

    return {
      g,
      u: (t, _a, age) => {
        const n = Math.floor(age * 7)
        cells.forEach((cell, i) => {
          cell.s.visible = i < n
          cell.w.rotation.y = i < n ? 0 : t
        })
      }
    }
  },

  bars: () => {
    const g = new THREE.Group()
    const bars: THREE.Group[] = []
    for (let i = 0; i < 5; i++) {
      const geo = Bx(0.28, 1, 0.28)
      geo.translate(0, 0.5, 0)
      bars.push(add(g, holo(geo, i === 4 ? ACC : INK), (i - 2) * 0.45, -0.7, 0))
    }

    return {
      g,
      u: (t, _a, age) => {
        bars.forEach((bar, i) => {
          let k = Math.max(0, Math.min(1, age * 1.1 - i * 0.14))
          k = 1 - Math.pow(1 - k, 3)
          bar.scale.y = 0.02 + k * (0.4 + i * 0.34)
        })
        g.rotation.y = Math.sin(t * 0.6) * 0.5
      }
    }
  },

  tower: () => {
    const g = new THREE.Group()
    const slices: THREE.Group[] = []
    for (let i = 0; i < 4; i++) {
      slices.push(add(g, holo(Bx(1.3, 0.26, 1.3), i === 3 ? ACC : INK), 0, 2, 0))
    }

    return {
      g,
      u: (t, _a, age) => {
        slices.forEach((slice, i) => {
          let k = Math.max(0, Math.min(1, age * 1.3 - i * 0.25))
          k = 1 - Math.pow(1 - k, 3)
          slice.position.y = -0.6 + i * 0.38 + (1 - k) * 2.2
        })
        g.rotation.y = t * 0.5
      }
    }
  },

  rocket: () => {
    const g = new THREE.Group()
    const rocket = new THREE.Group()
    g.add(rocket)
    add(rocket, holo(Cy(0.22, 0.22, 0.9, 10), INK))
    add(rocket, holo(new THREE.ConeGeometry(0.22, 0.4, 10), ACC), 0, 0.65, 0)
    ;[1, -1].forEach(side => {
      const fin = add(rocket, holo(Bx(0.28, 0.3, 0.03), INK), side * 0.28, -0.35, 0)
      fin.rotation.z = -side * 0.3
    })
    const flame = add(rocket, holo(new THREE.ConeGeometry(0.12, 0.4, 6), ACC), 0, -0.7, 0)
    flame.rotation.x = Math.PI

    return {
      g,
      u: (t, _a, age) => {
        rocket.position.y = -0.5 + Math.min(1, age * 0.5) + Math.sin(t * 3) * 0.05
        rocket.rotation.z = Math.sin(t * 2) * 0.08
        flame.scale.y = 0.7 + Math.abs(Math.sin(t * 20)) * 0.8
      }
    }
  },

  team: () => {
    const g = new THREE.Group()
    const heads: THREE.Group[] = []
    for (let i = 0; i < 6; i++) {
      const person = new THREE.Group()
      const angle = i * 1.047
      person.position.set(Math.cos(angle), 0, Math.sin(angle))
      g.add(person)
      add(person, holo(Cy(0.14, 0.18, 0.5, 8), INK), 0, -0.25, 0)
      heads.push(add(person, holo(Ic(0.14, 0), i === 0 ? ACC : INK), 0, 0.1, 0))
    }

    return {
      g,
      u: t => {
        g.rotation.y = t * 0.5
        heads.forEach((head, i) => {
          head.position.y = 0.1 + Math.abs(Math.sin(t * 2 + i)) * 0.12
        })
      }
    }
  },

  mail: () => {
    const g = new THREE.Group()
    add(g, holo(Bx(1.3, 0.85, 0.05), INK))
    ;[1, -1].forEach(side => {
      const flap = add(g, holo(Bx(0.78, 0.03, 0.03), ACC), side * 0.33, 0.2, 0.03)
      flap.rotation.z = -side * 0.55
    })

    return {
      g,
      u: t => {
        g.rotation.y = Math.sin(t * 1.2) * 0.5
        g.rotation.z = Math.sin(t * 0.9) * 0.08
        g.position.y = Math.sin(t * 2) * 0.08
      }
    }
  },

  person: () => {
    const g = new THREE.Group()
    add(g, holo(Ic(0.3, 1), INK, true), 0, 0.75, 0)
    add(g, holo(Cy(0.3, 0.45, 0.85, 10), INK))
    add(g, holo(Tr(0.14, 0.01, 24), ACC, true), 0, 0.12, 0.42)

    return {
      g,
      u: t => {
        g.rotation.y = Math.sin(t * 0.8) * 0.6
      }
    }
  },

  voice: () => {
    const g = new THREE.Group()
    const rings: THREE.Group[] = []
    for (let i = 0; i < 4; i++) {
      rings.push(add(g, holo(Tr(0.35 + i * 0.28, 0.006, 64), i === 0 ? ACC : INK, true)))
    }

    return {
      g,
      u: (t, a) => {
        rings.forEach((ring, i) => {
          const scale = 1 + a * 0.5 * (i % 2 ? 1 : -0.5) + Math.sin(t * 3 - i) * 0.05
          ring.scale.set(scale, scale, 1)
        })
        g.rotation.x = -0.5 + Math.sin(t) * 0.1
      }
    }
  },

  phone: () => {
    const g = new THREE.Group()
    add(g, holo(Bx(0.6, 1.1, 0.07), INK))
    const chip = add(g, holo(Bx(0.28, 0.28, 0.05), ACC), 0, 0.05, 0.05)

    return {
      g,
      u: (t, a) => {
        g.rotation.y = Math.sin(t * 0.9) * 0.7
        chip.scale.setScalar(1 + a * 0.5 + Math.sin(t * 5) * 0.1)
      }
    }
  },

  hub: () => {
    const g = new THREE.Group()
    add(g, holo(Ic(0.3, 0), ACC))
    const nodes = [
      [-1, 0.6],
      [1, 0.6],
      [-1, -0.6],
      [1, -0.6]
    ]
    nodes.forEach((coords: number[]) => {
      const [x = 0, y = 0] = coords
      add(g, holo(Bx(0.3, 0.3, 0.3), INK), x * 0.95, y * 0.9, 0)
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(x * 0.95, y * 0.9, 0)
        ]),
        lineMaterial(INK)
      )
      g.add(line)
    })

    return {
      g,
      u: t => {
        g.rotation.y = Math.sin(t * 0.7) * 0.6
        g.rotation.x = Math.sin(t * 0.5) * 0.2
      }
    }
  }
}
