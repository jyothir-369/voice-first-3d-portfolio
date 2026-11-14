import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as THREE from 'three'
import type { AppState } from '../../../src/types'

HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    } as unknown as CanvasRenderingContext2D
  }
  return null
}) as unknown as typeof HTMLCanvasElement.prototype.getContext

const setPixelRatio = vi.fn()
const setSize = vi.fn()
const renderMock = vi.fn()
const disposeRenderer = vi.fn()
const forceContextLoss = vi.fn()

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three')
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setPixelRatio,
      setSize,
      render: renderMock,
      dispose: disposeRenderer,
      forceContextLoss,
      domElement: document.createElement('canvas')
    }))
  }
})

function installMatchMedia(reduced = false, dark = false) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion')
      ? reduced
      : query.includes('prefers-color-scheme: dark')
        ? dark
        : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia
}

async function loadTerrain() {
  vi.resetModules()
  return import('../../../src/scene/terrain')
}

describe('Terrain module', () => {
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    canvas = document.createElement('canvas')
    canvas.id = 'gl'
    document.body.appendChild(canvas)
    installMatchMedia(false, true)
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true })
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true
    })
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    document.documentElement.removeAttribute('data-theme')
    history.replaceState(null, '', '/')
    setPixelRatio.mockClear()
    setSize.mockClear()
    renderMock.mockClear()
    disposeRenderer.mockClear()
  })

  afterEach(async () => {
    const terrain = await import('../../../src/scene/terrain')
    terrain.disposeTerrain()
    canvas.remove()
    document.getElementById('debug-overlay')?.remove()
    vi.clearAllMocks()
  })

  it('builds a point cloud from the configured grid', async () => {
    const { initTerrain, getTerrainConfig, TERRAIN_CONFIG } = await loadTerrain()
    const scene = initTerrain(canvas)
    const points = scene.children.find((child) => child instanceof THREE.Points) as THREE.Points
    const config = getTerrainConfig()

    expect(scene).toBeInstanceOf(THREE.Scene)
    expect(points).toBeInstanceOf(THREE.Points)
    expect(points.geometry.attributes.position?.count).toBe(config.effectiveCols * config.effectiveRows)
    expect(points.geometry.attributes.color?.itemSize).toBe(3)
    expect(config.cols).toBe(TERRAIN_CONFIG.cols)
    expect(config.rows).toBe(TERRAIN_CONFIG.rows)
    expect(config.pointCount).toBe(130 * 72)
  })

  it('lays the grid out in XZ and leaves Y at rest', async () => {
    const { initTerrain } = await loadTerrain()
    const scene = initTerrain(canvas)
    const points = scene.children[0] as THREE.Points
    const pos = points.geometry.attributes.position?.array as Float32Array
    const ys = []
    for (let i = 1; i < pos.length; i += 3) ys.push(pos[i])
    expect(Math.max(...ys)).toBe(0)
    expect(pos[0]).not.toBe(pos[3])
    expect(pos[2]).not.toBe(pos[pos.length - 1])
  })

  it('caps the pixel ratio at 2', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 4, configurable: true })
    const { initTerrain } = await loadTerrain()
    initTerrain(canvas)
    expect(setPixelRatio).toHaveBeenCalledWith(2)
  })

  it('drops point density on a phone', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true
    })
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 6, configurable: true })
    const { initTerrain, getTerrainConfig } = await loadTerrain()
    initTerrain(canvas)
    const config = getTerrainConfig()
    expect(config.currentQuality).toBe(0.7)
    expect(config.pointCount).toBeLessThan(130 * 72)
  })

  it('drops further on a low-core phone', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13; Pixel)',
      configurable: true
    })
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 4, configurable: true })
    const { detectDeviceQuality } = await loadTerrain()
    expect(detectDeviceQuality()).toBe(0.5)
  })

  it('follows an explicit light theme over the OS dark preference', async () => {
    installMatchMedia(false, true)
    document.documentElement.dataset.theme = 'light'
    const { initTerrain, getTerrainConfig } = await loadTerrain()
    initTerrain(canvas)
    expect(getTerrainConfig().isDark).toBe(false)
  })

  it('disables parallax when reduced motion is requested', async () => {
    installMatchMedia(true, true)
    const { initTerrain, getTerrainConfig, updateCamera } = await loadTerrain()
    initTerrain(canvas)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1400, clientY: 20 }))
    updateCamera()
    const config = getTerrainConfig()
    expect(config.reducedMotion).toBe(true)
    expect(config.parallaxEnabled).toBe(false)
  })

  it('holds the camera when reduced motion is on', async () => {
    installMatchMedia(true, true)
    const { initTerrain, updateCamera, getCameraPosition } = await loadTerrain()
    initTerrain(canvas)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1400, clientY: 20 }))
    updateCamera()
    expect(getCameraPosition()).toEqual({ x: 0, y: 3.5, z: 7.2 })
  })

  it('shifts the camera with the pointer when parallax is on', async () => {
    const { initTerrain, updateCamera, getCameraPosition } = await loadTerrain()
    initTerrain(canvas)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 0, clientY: 0 }))
    updateCamera()
    const position = getCameraPosition()
    expect(position.x).not.toBe(0)
    expect(position.z).toBe(7.2)
  })

  it('does not write vertices while the page is hidden', async () => {
    const { initTerrain, updateTerrain } = await loadTerrain()
    const scene = initTerrain(canvas)
    const points = scene.children[0] as THREE.Points
    const before = (points.geometry.attributes.position?.array as Float32Array).slice()

    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    updateTerrain(1, 'listening', 1000)

    const after = points.geometry.attributes.position?.array as Float32Array
    expect(Array.from(after)).toEqual(Array.from(before))
  })

  it('gives listening a taller wave than thinking for the same amplitude', async () => {
    const { initTerrain, updateTerrain, measureFrontRowEnergy, disposeTerrain } = await loadTerrain()
    initTerrain(canvas)

    const settle = (state: AppState, amplitude: number) => {
      for (let i = 0; i < 40; i++) updateTerrain(amplitude, state, 2000 + i * 16)
      return measureFrontRowEnergy()
    }

    const listening = settle('listening', 0.9)
    const thinking = settle('thinking', 0.9)
    expect(listening).toBeGreaterThan(thinking)
    expect(listening).toBeGreaterThan(0.05)
    disposeTerrain()
  })

  it('keeps reduced-motion displacement well below the full wave', async () => {
    installMatchMedia(true, true)
    const { initTerrain, updateTerrain, measureFrontRowEnergy } = await loadTerrain()
    initTerrain(canvas)
    for (let i = 0; i < 30; i++) updateTerrain(1, 'listening', 3000 + i * 16)
    expect(measureFrontRowEnergy()).toBeLessThan(0.7)
  })

  it('changes vertex colour when the state changes', async () => {
    const { initTerrain, updateTerrain, getScene } = await loadTerrain()
    const scene = initTerrain(canvas)
    const colors = () => {
      const points = scene.children[0] as THREE.Points
      return Array.from((points.geometry.attributes.color?.array as Float32Array).slice(0, 3))
    }
    for (let i = 0; i < 25; i++) updateTerrain(0.4, 'listening', 1000 + i)
    const listening = colors()
    for (let i = 0; i < 25; i++) updateTerrain(0.4, 'thinking', 2000 + i)
    const thinking = colors()
    expect(listening.join(',')).not.toBe(thinking.join(','))
  })

  it('survives context loss and restore', async () => {
    const { initTerrain, updateTerrain } = await loadTerrain()
    initTerrain(canvas)
    const lost = new Event('webglcontextlost', { cancelable: true })
    canvas.dispatchEvent(lost)
    expect(lost.defaultPrevented).toBe(true)
    expect(() => canvas.dispatchEvent(new Event('webglcontextrestored'))).not.toThrow()
    expect(() => updateTerrain(0.2, 'idle', 10)).not.toThrow()
  })

  it('updates the camera aspect on resize', async () => {
    const { initTerrain } = await loadTerrain()
    initTerrain(canvas)
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true })
    window.dispatchEvent(new Event('resize'))
    expect(setSize).toHaveBeenCalledWith(800, 400, false)
  })

  it('shows frame time and point count when ?debug=1', async () => {
    history.replaceState(null, '', '/?debug=1')
    const { initTerrain, render } = await loadTerrain()
    initTerrain(canvas)
    render()
    const overlay = document.getElementById('debug-overlay')
    expect(overlay?.textContent).toContain('Points')
    expect(overlay?.textContent).toContain('Frame')
  })

  it('stops scheduling frames when the tab hides', async () => {
    const { initTerrain, startTerrainLoop, getTerrainConfig } = await loadTerrain()
    initTerrain(canvas)
    let frames = 0
    const stop = startTerrainLoop(() => {
      frames += 1
      return { amplitude: 0.2, state: 'idle' }
    })
    expect(getTerrainConfig().loopRunning).toBe(true)

    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const hiddenFrames = frames
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    expect(frames).toBe(hiddenFrames)
    expect(renderMock).not.toHaveBeenCalled()
    stop()
    expect(getTerrainConfig().loopRunning).toBe(false)
  })

  it('disposes geometry, texture, material, and the renderer', async () => {
    const { initTerrain, disposeTerrain, getScene } = await loadTerrain()
    const scene = initTerrain(canvas)
    const points = scene.children[0] as THREE.Points
    const geometry = points.geometry
    const material = points.material as THREE.PointsMaterial
    const disposeGeo = vi.spyOn(geometry, 'dispose')
    const disposeMat = vi.spyOn(material, 'dispose')
    const disposeMap = vi.spyOn(material.map as THREE.Texture, 'dispose')

    disposeTerrain()

    expect(disposeGeo).toHaveBeenCalled()
    expect(disposeMat).toHaveBeenCalled()
    expect(disposeMap).toHaveBeenCalled()
    expect(disposeRenderer).toHaveBeenCalled()
    expect(() => getScene()).toThrow(/not initialized/)
  })

  it('removes the debug overlay on dispose', async () => {
    history.replaceState(null, '', '/?debug=1')
    const { initTerrain, disposeTerrain } = await loadTerrain()
    initTerrain(canvas)
    expect(document.getElementById('debug-overlay')).not.toBeNull()
    disposeTerrain()
    expect(document.getElementById('debug-overlay')).toBeNull()
  })

  it('documents a visual for every application state', async () => {
    const { STATE_VISUALS } = await loadTerrain()
    const states: AppState[] = ['intro', 'idle', 'listening', 'thinking', 'speaking']
    for (const state of states) {
      expect(STATE_VISUALS[state].amplitudeGain).toBeGreaterThan(0)
      expect(STATE_VISUALS[state].colorDark).toHaveLength(3)
      expect(STATE_VISUALS[state].colorLight).toHaveLength(3)
    }
    expect(STATE_VISUALS.listening.amplitudeGain).toBeGreaterThan(STATE_VISUALS.speaking.amplitudeGain)
    expect(STATE_VISUALS.thinking.rippleHz).toBeGreaterThan(STATE_VISUALS.speaking.rippleHz)
    expect(STATE_VISUALS.listening.colorDark.join(',')).not.toBe(STATE_VISUALS.speaking.colorDark.join(','))
  })
})
