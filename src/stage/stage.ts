import * as THREE from 'three'
import type { StageObject, BuilderFunction } from '@/types'
import { BUILDERS } from './objects'

const SLOTS = [0, -3.2, 3.2]
const objects: StageObject[] = []
let stage: THREE.Group

/**
 * Initialize the stage
 */
export function initStage(sceneObj: THREE.Scene): THREE.Group {
  stage = new THREE.Group()
  stage.position.set(0, 2.05, -3.2)
  sceneObj.add(stage)
  return stage
}

/**
 * Create a label sprite for an object
 */
function createLabelSprite(text: string, isDark: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 96
  const ctx = canvas.getContext('2d')!
  ctx.font = '900 54px Doto, "DM Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = isDark ? '#f4f3ef' : '#0b0b0c'
  ctx.fillText(text, 256, 64)

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false
    })
  )
  sprite.scale.set(2.4, 0.45, 1)
  return sprite
}

/**
 * Spawn a new object on the stage
 */
export function spawnObject(type: string, label: string): void {
  const builder = BUILDERS[type as keyof typeof BUILDERS] as BuilderFunction | undefined
  if (!builder) return

  const isMobile = window.innerWidth < 780
  const scaleFactor = isMobile ? 0.5 : 1
  const isDark = !window.matchMedia('(prefers-color-scheme: light)').matches ||
                 document.documentElement.dataset.theme === 'dark'

  // Find available slot
  const usedSlots: Record<number, boolean> = {}
  objects.forEach(obj => {
    if (obj && !obj.die) usedSlots[obj.slot] = true
  })

  let slot = -1
  for (let i = 0; i < 3; i++) {
    if (!usedSlots[i]) {
      slot = i
      break
    }
  }

  // If all slots taken, remove oldest object
  if (slot < 0) {
    const liveObjects = objects.filter(obj => obj && !obj.die)
    if (liveObjects.length > 0 && liveObjects[0]) {
      liveObjects[0].die = performance.now()
      slot = liveObjects[0].slot
    } else {
      slot = 0
    }
  }

  // Build object
  const built = builder()
  const hierarchy = new THREE.Group()
  hierarchy.add(built.g)

  const labelSprite = createLabelSprite(label, isDark)
  labelSprite.position.y = -1.35
  hierarchy.add(labelSprite)

  hierarchy.position.x = (SLOTS[slot] ?? 0) * scaleFactor
  hierarchy.scale.setScalar(0)
  stage.add(hierarchy)

  objects.push({
    h: hierarchy,
    u: built.u,
    born: performance.now(),
    die: 0,
    slot
  })
}

/**
 * Clear all objects from the stage
 */
export function clearStage(): void {
  const now = performance.now()
  objects.forEach(obj => {
    if (!obj.die) obj.die = now
  })
}

/**
 * Ease function for spawn/despawn animation
 */
function easeBackOut(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Update all stage objects
 */
export function updateStage(time: number, amplitude: number): void {
  const now = performance.now()
  const isMobile = window.innerWidth < 780
  const mobileFactor = isMobile ? 0.62 : 1

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    if (!obj || !obj.h || !obj.u) continue

    const age = (now - obj.born) / 1000
    let scale: number

    if (obj.die) {
      const elapsed = (now - obj.die) / 450
      scale = Math.max(0, 1 - elapsed)
      if (elapsed >= 1) {
        if (stage && obj.h) {
          stage.remove(obj.h)
        }
        objects.splice(i, 1)
        continue
      }
    } else {
      scale = easeBackOut(Math.min(1, age / 0.7))
      // Auto-remove after 16 seconds if not speaking
      if (age > 16) {
        obj.die = now
      }
    }

    obj.h.scale.setScalar(scale * mobileFactor)
    if (obj.u) {
      obj.u(time, amplitude, age)
    }
  }
}
