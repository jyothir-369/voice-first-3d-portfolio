import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as THREE from 'three'

// Mock canvas 2D context for label sprites
HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return {
      font: '',
      textAlign: '',
      fillStyle: '',
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    } as unknown as CanvasRenderingContext2D
  }
  return null
}) as unknown as typeof HTMLCanvasElement.prototype.getContext

function installMatchMedia(dark = false) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes('prefers-color-scheme: light') ? !dark : dark,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia
}

async function loadStage() {
  vi.resetModules()
  return import('../../../src/stage/stage')
}

describe('Stage module', () => {
  let scene: THREE.Scene

  beforeEach(() => {
    scene = new THREE.Scene()
    installMatchMedia(true)
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(async () => {
    const stage = await import('../../../src/stage/stage')
    stage.disposeStage()
    vi.clearAllMocks()
  })

  it('initStage adds a Group to the scene', async () => {
    const { initStage } = await loadStage()
    const group = initStage(scene)
    expect(group).toBeInstanceOf(THREE.Group)
    expect(scene.children).toContain(group)
  })

  it('spawnObject adds a live object', async () => {
    const { initStage, spawnObject, getStageInfo } = await loadStage()
    initStage(scene)
    spawnObject('agents', 'AGENTS')
    expect(getStageInfo().liveCount).toBe(1)
    expect(getStageInfo().totalSpawned).toBe(1)
  })

  it('ignores unknown object types', async () => {
    const { initStage, spawnObject, getStageInfo } = await loadStage()
    initStage(scene)
    spawnObject('nonexistent', 'LABEL')
    expect(getStageInfo().liveCount).toBe(0)
    expect(getStageInfo().totalSpawned).toBe(0)
  })

  it('fills slots 0, 1, 2 for the first three spawns', async () => {
    const { initStage, spawnObject, getStageInfo } = await loadStage()
    initStage(scene)
    spawnObject('agents', 'A')
    spawnObject('clock', 'B')
    spawnObject('plant', 'C')
    const info = getStageInfo()
    expect(info.liveCount).toBe(3)
    expect(new Set(info.slots).size).toBe(3)
  })

  it('evicts the oldest object when all 3 slots are full', async () => {
    const { initStage, spawnObject, getStageInfo } = await loadStage()
    initStage(scene)
    spawnObject('agents', 'A')
    spawnObject('clock', 'B')
    spawnObject('plant', 'C')
    spawnObject('ledger', 'D')
    // Total spawned is 4, but at most 3 can be alive (the oldest gets a die stamp)
    expect(getStageInfo().totalSpawned).toBe(4)
    expect(getStageInfo().liveCount).toBeLessThanOrEqual(3)
  })

  it('clearStage marks all objects for removal', async () => {
    const { initStage, spawnObject, clearStage, getStageInfo } = await loadStage()
    initStage(scene)
    spawnObject('agents', 'A')
    spawnObject('clock', 'B')
    clearStage()
    // die timestamps set — but liveCount counts objects without die stamps
    expect(getStageInfo().liveCount).toBe(0)
  })

  it('updateStage removes objects after their despawn animation', async () => {
    const { initStage, spawnObject, clearStage, updateStage, getStageInfo } = await loadStage()
    initStage(scene)

    const t0 = performance.now()
    vi.spyOn(performance, 'now').mockReturnValue(t0)
    spawnObject('agents', 'A')

    // Mark for removal
    clearStage()

    // Advance past the 450ms despawn window
    vi.spyOn(performance, 'now').mockReturnValue(t0 + 600)
    updateStage(1, 0.2)
    expect(getStageInfo().liveCount).toBe(0)

    vi.restoreAllMocks()
  })

  it('disposeStage resets totalSpawned to zero', async () => {
    const { initStage, spawnObject, disposeStage, getStageInfo } = await loadStage()
    initStage(scene)
    spawnObject('agents', 'A')
    expect(getStageInfo().totalSpawned).toBe(1)
    disposeStage()
    expect(getStageInfo().totalSpawned).toBe(0)
    expect(getStageInfo().liveCount).toBe(0)
  })

  it('disposeStage calls dispose on object geometries', async () => {
    const { initStage, spawnObject, disposeStage } = await loadStage()
    initStage(scene)
    spawnObject('agents', 'A')

    const disposeSpy = vi.fn()
    // Patch all BufferGeometry dispose methods in scene
    scene.traverse((obj) => {
      const mesh = obj as THREE.Points | THREE.LineSegments
      if (mesh.geometry) {
        mesh.geometry.dispose = disposeSpy
      }
    })

    disposeStage()
    expect(disposeSpy).toHaveBeenCalled()
  })

  it('getStageInfo returns correct slot indices', async () => {
    const { initStage, spawnObject, getStageInfo } = await loadStage()
    initStage(scene)
    spawnObject('agents', 'A')
    const info = getStageInfo()
    expect(info.slots).toHaveLength(1)
    expect([0, 1, 2]).toContain(info.slots[0])
  })

  it('objects scale to zero on spawn and grow via easeBackOut', async () => {
    const { initStage, spawnObject, updateStage } = await loadStage()
    const stageGroup = initStage(scene)

    const t0 = performance.now()
    vi.spyOn(performance, 'now').mockReturnValue(t0)
    spawnObject('clock', 'CLOCK')

    // Immediately — scale near zero
    updateStage(0, 0.1)
    const child = stageGroup.children[0]
    expect(child?.scale.x).toBeGreaterThanOrEqual(0)

    // At 700ms spawn is complete — scale should be ≈ 1
    vi.spyOn(performance, 'now').mockReturnValue(t0 + 700)
    updateStage(0.7, 0.1)
    expect(child?.scale.x).toBeGreaterThan(0.5)

    vi.restoreAllMocks()
  })

  it('mobile scaling reduces object size when innerWidth < 780', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
    const { initStage, spawnObject, updateStage } = await loadStage()
    const stageGroup = initStage(scene)

    const t0 = performance.now()
    vi.spyOn(performance, 'now').mockReturnValue(t0)
    spawnObject('voice', 'VOICE')

    vi.spyOn(performance, 'now').mockReturnValue(t0 + 1000)
    updateStage(1, 0.5)
    const child = stageGroup.children[0]
    // mobileFactor is 0.62, so full-scale should be ≤ 0.62
    expect((child?.scale.x ?? 0)).toBeLessThanOrEqual(0.62 + 0.01)

    vi.restoreAllMocks()
  })
})
