import * as THREE from 'three'
import type { AppState } from '@/types'

/**
 * Configurable geometry (Phase 3).
 * Full quality is 130×72. Adaptive quality scales both axes on small
 * screens and low-power devices. Pixel ratio never exceeds 2.
 */
export const TERRAIN_CONFIG = {
  cols: 130,
  rows: 72,
  spacing: { x: 0.2, z: 0.22 },
  dotSize: 0.085,
  amplitudeScale: 3.8,
  historyDepth: 3,
  maxPixelRatio: 2,
  adaptiveQuality: true
} as const

const COLS = TERRAIN_CONFIG.cols
const ROWS = TERRAIN_CONFIG.rows
const DX = TERRAIN_CONFIG.spacing.x
const DZ = TERRAIN_CONFIG.spacing.z
const HISTORY_LENGTH = ROWS * TERRAIN_CONFIG.historyDepth + 4

/**
 * State-to-visual mapping. Defined in one place.
 *
 * | State     | Colour (dark)        | Colour (light)       | Motion                                      |
 * |-----------|----------------------|----------------------|---------------------------------------------|
 * | Intro     | Neutral grey         | Neutral grey         | Slow idle drift                             |
 * | Idle      | Neutral white        | Neutral black        | Gentle breathing                            |
 * | Listening | Red accent           | Red accent           | Follows the real microphone level           |
 * | Thinking  | Soft grey            | Soft grey            | Fast, low ripple (not the mic envelope)     |
 * | Speaking  | White                | Black                | Slow rhythmic pulse, plus a word-boundary bump |
 *
 * Listening and speaking differ in both colour and motion, so the
 * difference does not depend on colour alone (WCAG 1.4.1).
 */
export const STATE_VISUALS: Record<
  AppState,
  {
    colorDark: [number, number, number]
    colorLight: [number, number, number]
    /** How much of the incoming amplitude this state uses. */
    amplitudeGain: number
    /** Extra procedural motion, independent of the amplitude envelope. */
    ripple: number
    /** Ripple frequency (radians per second). */
    rippleHz: number
  }
> = {
  intro: {
    colorDark: [0.72, 0.72, 0.74],
    colorLight: [0.42, 0.42, 0.44],
    amplitudeGain: 0.15,
    ripple: 0.012,
    rippleHz: 0.35
  },
  idle: {
    colorDark: [0.9, 0.9, 0.9],
    colorLight: [0.05, 0.05, 0.05],
    amplitudeGain: 0.25,
    ripple: 0.02,
    rippleHz: 0.7
  },
  listening: {
    colorDark: [1, 0.23, 0.12],
    colorLight: [0.85, 0.16, 0.08],
    amplitudeGain: 1,
    ripple: 0.004,
    rippleHz: 0.4
  },
  thinking: {
    colorDark: [0.62, 0.64, 0.7],
    colorLight: [0.32, 0.33, 0.38],
    amplitudeGain: 0.08,
    ripple: 0.045,
    rippleHz: 6.5
  },
  speaking: {
    colorDark: [1, 1, 1],
    colorLight: [0.04, 0.04, 0.05],
    amplitudeGain: 0.55,
    ripple: 0.03,
    rippleHz: 2.2
  }
}

const BG = { light: 0.93, dark: 0.04 }
// Idle floor colour: far enough from BG in both themes that the resting
// wave stays readable (light dots were nearly invisible on the cream bg).
const BASE = { light: 0.3, dark: 0.28 }

export interface TerrainConfigSnapshot {
  cols: number
  rows: number
  spacing: { x: number; z: number }
  dotSize: number
  amplitudeScale: number
  historyDepth: number
  maxPixelRatio: number
  adaptiveQuality: boolean
  currentQuality: number
  effectiveCols: number
  effectiveRows: number
  reducedMotion: boolean
  parallaxEnabled: boolean
  isDark: boolean
  isPageVisible: boolean
  debugMode: boolean
  pointCount: number
  loopRunning: boolean
  lastFrameMs: number
}

interface TerrainRuntime {
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  points: THREE.Points
  geometry: THREE.BufferGeometry
  material: THREE.PointsMaterial
  amplitudeHistory: number[]
  effectiveCols: number
  effectiveRows: number
  currentQuality: number
  isDark: boolean
  reducedMotion: boolean
  isPageVisible: boolean
  debugMode: boolean
  parallaxEnabled: boolean
  mouseX: number
  mouseY: number
  currentColor: [number, number, number]
  listeners: Array<{ target: EventTarget; type: string; handler: EventListener }>
  observer: MutationObserver | null
  debugOverlay: HTMLDivElement | null
  frameCount: number
  lastFpsUpdate: number
  currentFps: number
  lastFrameMs: number
  loopId: number
  loopRunning: boolean
  disposed: boolean
  onContextLost: (event: Event) => void
  onContextRestored: () => void
}

let runtime: TerrainRuntime | null = null

function addListener(rt: TerrainRuntime, target: EventTarget, type: string, handler: EventListener): void {
  target.addEventListener(type, handler)
  rt.listeners.push({ target, type, handler })
}

function readTheme(): boolean {
  const explicit = document.documentElement.dataset.theme
  if (explicit === 'dark') return true
  if (explicit === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Adaptive density: phones and narrow viewports drop to 70%, and to 50%
 * when the CPU reports four or fewer cores. Desktop stays at full density.
 */
export function detectDeviceQuality(): number {
  if (!TERRAIN_CONFIG.adaptiveQuality) return 1
  const ua = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const cores = navigator.hardwareConcurrency || 8
  const narrow = window.innerWidth > 0 && window.innerWidth < 768
  if (isMobile || narrow) {
    return cores <= 4 ? 0.5 : 0.7
  }
  if (cores <= 4) return 0.7
  return 1
}

function makeDotTexture(): THREE.CanvasTexture {
  const canvas2d = document.createElement('canvas')
  canvas2d.width = canvas2d.height = 32
  const ctx = canvas2d.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(16, 16, 14, 0, Math.PI * 2)
    ctx.fill()
  }
  const texture = new THREE.CanvasTexture(canvas2d)
  texture.needsUpdate = true
  return texture
}

function createDebugOverlay(): HTMLDivElement {
  const existing = document.getElementById('debug-overlay')
  if (existing) existing.remove()
  const overlay = document.createElement('div')
  overlay.id = 'debug-overlay'
  overlay.setAttribute('role', 'status')
  overlay.setAttribute('aria-live', 'off')
  overlay.style.cssText = [
    'position:fixed',
    'top:10px',
    'left:10px',
    'background:rgba(0,0,0,0.82)',
    'color:#b6ffb0',
    'font-family:ui-monospace,monospace',
    'font-size:12px',
    'padding:10px 12px',
    'z-index:10000',
    'pointer-events:none',
    'line-height:1.45',
    'max-width:240px'
  ].join(';')
  document.body.appendChild(overlay)
  return overlay
}

function paintDebug(rt: TerrainRuntime): void {
  if (!rt.debugOverlay) return
  const now = performance.now()
  rt.frameCount += 1
  if (now - rt.lastFpsUpdate >= 500) {
    rt.currentFps = Math.round((rt.frameCount * 1000) / (now - rt.lastFpsUpdate))
    rt.frameCount = 0
    rt.lastFpsUpdate = now
  }
  const frameTime = rt.currentFps > 0 ? 1000 / rt.currentFps : rt.lastFrameMs
  const points = rt.effectiveCols * rt.effectiveRows
  rt.debugOverlay.textContent = [
    'DEBUG',
    `FPS ${rt.currentFps}`,
    `Frame ${frameTime.toFixed(2)} ms`,
    `Points ${points}`,
    `Grid ${rt.effectiveCols}×${rt.effectiveRows} of ${COLS}×${ROWS}`,
    `Quality ${(rt.currentQuality * 100).toFixed(0)}%`,
    `Theme ${rt.isDark ? 'dark' : 'light'}`,
    `Motion ${rt.reducedMotion ? 'reduced' : 'normal'}`,
    `Parallax ${rt.parallaxEnabled ? 'on' : 'off'}`,
    `Visible ${rt.isPageVisible ? 'yes' : 'no'}`,
    `Loop ${rt.loopRunning ? 'running' : 'paused'}`
  ].join('\n')
}

/**
 * Build the dot-wave terrain on the given canvas.
 * Calling this again disposes the previous scene first.
 */
export function initTerrain(canvas: HTMLCanvasElement): THREE.Scene {
  if (runtime && !runtime.disposed) {
    disposeTerrain()
  }

  const debugMode = new URLSearchParams(window.location.search).has('debug')
  const isDark = readTheme()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const currentQuality = detectDeviceQuality()
  const effectiveCols = Math.max(8, Math.floor(COLS * currentQuality))
  const effectiveRows = Math.max(6, Math.floor(ROWS * currentQuality))

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: currentQuality >= 1,
    alpha: true,
    powerPreference: currentQuality < 1 ? 'low-power' : 'high-performance'
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TERRAIN_CONFIG.maxPixelRatio))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
  camera.position.set(0, 3.5, 7.2)
  camera.lookAt(0, 0.5, -5.5)

  const count = effectiveCols * effectiveRows
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let r = 0; r < effectiveRows; r++) {
    for (let c = 0; c < effectiveCols; c++) {
      const i = r * effectiveCols + c
      positions[i * 3] = (c - effectiveCols / 2) * DX
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 2 - r * DZ
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()

  const material = new THREE.PointsMaterial({
    size: TERRAIN_CONFIG.dotSize * (0.75 + 0.25 * currentQuality),
    map: makeDotTexture(),
    vertexColors: true,
    transparent: true,
    alphaTest: 0.2,
    depthWrite: false,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  scene.add(points)

  const rt: TerrainRuntime = {
    canvas,
    renderer,
    scene,
    camera,
    points,
    geometry,
    material,
    amplitudeHistory: new Array<number>(HISTORY_LENGTH).fill(0),
    effectiveCols,
    effectiveRows,
    currentQuality,
    isDark,
    reducedMotion,
    isPageVisible: !document.hidden,
    debugMode,
    parallaxEnabled: !reducedMotion,
    mouseX: 0,
    mouseY: 0,
    currentColor: isDark ? [...STATE_VISUALS.intro.colorDark] : [...STATE_VISUALS.intro.colorLight],
    listeners: [],
    observer: null,
    debugOverlay: debugMode ? createDebugOverlay() : null,
    frameCount: 0,
    lastFpsUpdate: performance.now(),
    currentFps: 0,
    lastFrameMs: 0,
    loopId: 0,
    loopRunning: false,
    disposed: false,
    onContextLost: () => undefined,
    onContextRestored: () => undefined
  }

  rt.onContextLost = (event: Event) => {
    event.preventDefault()
    rt.loopRunning = false
  }
  rt.onContextRestored = () => {
    const pos = rt.geometry.attributes.position
    const col = rt.geometry.attributes.color
    if (pos) pos.needsUpdate = true
    if (col) col.needsUpdate = true
    rt.material.needsUpdate = true
  }
  addListener(rt, canvas, 'webglcontextlost', rt.onContextLost)
  addListener(rt, canvas, 'webglcontextrestored', rt.onContextRestored as EventListener)

  addListener(rt, window, 'pointermove', ((e: PointerEvent) => {
    if (!rt.parallaxEnabled) return
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    rt.mouseX = e.clientX / w - 0.5
    rt.mouseY = e.clientY / h - 0.5
  }) as EventListener)

  addListener(rt, document, 'visibilitychange', () => {
    rt.isPageVisible = !document.hidden
  })

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => {
    if (!document.documentElement.dataset.theme) {
      rt.isDark = darkQuery.matches
    }
  }
  addListener(rt, darkQuery, 'change', onScheme)

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onMotion = () => {
    rt.reducedMotion = motionQuery.matches
    rt.parallaxEnabled = !rt.reducedMotion
    if (rt.reducedMotion) {
      rt.mouseX = 0
      rt.mouseY = 0
    }
  }
  addListener(rt, motionQuery, 'change', onMotion)

  const onResize = () => resizeTerrain()
  addListener(rt, window, 'resize', onResize)

  const observer = new MutationObserver(() => {
    rt.isDark = readTheme()
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  rt.observer = observer

  runtime = rt
  resizeTerrain()
  return scene
}

/** Keep the camera aspect matched to the canvas so resize never stretches the scene. */
export function resizeTerrain(): void {
  const rt = runtime
  if (!rt || rt.disposed) return
  const width = window.innerWidth || rt.canvas.clientWidth || 1
  const height = window.innerHeight || rt.canvas.clientHeight || 1
  rt.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TERRAIN_CONFIG.maxPixelRatio))
  rt.renderer.setSize(width, height, false)
  rt.camera.aspect = width / height
  rt.camera.updateProjectionMatrix()
}

/**
 * Advance the wave by one frame.
 * Hidden tabs do no vertex work. Reduced motion scales displacement to 15%.
 */
export function updateTerrain(amplitude: number, state: AppState, nowMs: number = performance.now()): void {
  const rt = runtime
  if (!rt || rt.disposed || !rt.isPageVisible) return

  const visual = STATE_VISUALS[state] ?? STATE_VISUALS.idle
  const target = rt.isDark ? visual.colorDark : visual.colorLight
  const colorSpeed = rt.reducedMotion ? 0.45 : 0.12
  for (let i = 0; i < 3; i++) {
    const next = target[i] ?? 0
    const current = rt.currentColor[i] ?? next
    rt.currentColor[i] = current + (next - current) * colorSpeed
  }

  const motionScale = rt.reducedMotion ? 0.15 : 1
  const driven = Math.max(0, amplitude) * visual.amplitudeGain * motionScale
  rt.amplitudeHistory.unshift(driven)
  if (rt.amplitudeHistory.length > HISTORY_LENGTH) {
    rt.amplitudeHistory.length = HISTORY_LENGTH
  }

  const positions = rt.geometry.attributes.position as THREE.BufferAttribute
  const colors = rt.geometry.attributes.color as THREE.BufferAttribute
  const pos = positions.array as Float32Array
  const col = colors.array as Float32Array
  const bgValue = rt.isDark ? BG.dark : BG.light
  const baseValue = rt.isDark ? BASE.dark : BASE.light
  const time = nowMs / 1000
  const cols = rt.effectiveCols
  const rows = rt.effectiveRows
  const sig2 = 2 * 5 * 5
  const depth = TERRAIN_CONFIG.historyDepth

  for (let r = 0; r < rows; r++) {
    const histIndex = Math.min(rt.amplitudeHistory.length - 1, r * depth)
    const a = rt.amplitudeHistory[histIndex] ?? 0
    const fade = 1 - (r / rows) * 0.88
    const rowPhase = r * 0.35

    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const xx = (c - cols / 2) * DX
      const gaussian = Math.exp((-xx * xx) / sig2)
      const noise = 0.55 + 0.45 * Math.sin(c * 0.55 + rowPhase) * Math.sin(c * 0.21 - r * 0.45 + 1.3)
      const ripple =
        visual.ripple *
        motionScale *
        Math.sin(c * 0.42 + rowPhase + time * visual.rippleHz)
      const y = a * TERRAIN_CONFIG.amplitudeScale * gaussian * noise + ripple
      const t = Math.min(1, Math.max(0, y / 1.6))

      pos[i * 3 + 1] = y

      const cr = baseValue + ((rt.currentColor[0] ?? baseValue) - baseValue) * t
      const cg = baseValue + ((rt.currentColor[1] ?? baseValue) - baseValue) * t
      const cb = baseValue + ((rt.currentColor[2] ?? baseValue) - baseValue) * t
      col[i * 3] = bgValue + (cr - bgValue) * fade
      col[i * 3 + 1] = bgValue + (cg - bgValue) * fade
      col[i * 3 + 2] = bgValue + (cb - bgValue) * fade
    }
  }

  positions.needsUpdate = true
  colors.needsUpdate = true
}

export function updateCamera(): void {
  const rt = runtime
  if (!rt || rt.disposed) return
  if (rt.parallaxEnabled && !rt.reducedMotion) {
    rt.camera.position.set(rt.mouseX * 1.6, 3.5 + rt.mouseY * -0.6, 7.2)
  } else {
    rt.camera.position.set(0, 3.5, 7.2)
  }
  rt.camera.lookAt(0, 0.5, -5.5)
}

export function render(): void {
  const rt = runtime
  if (!rt || rt.disposed || !rt.isPageVisible) return
  const started = performance.now()
  rt.renderer.render(rt.scene, rt.camera)
  rt.lastFrameMs = performance.now() - started
  if (rt.debugMode) paintDebug(rt)
}

/**
 * Own the animation loop so a hidden tab stops scheduling frames.
 * Returns a stop function. Safe to call once; a second call replaces the loop.
 */
export function startTerrainLoop(
  getFrame: () => { amplitude: number; state: AppState }
): () => void {
  const rt = runtime
  if (!rt || rt.disposed) return () => undefined
  if (rt.loopId) {
    cancelAnimationFrame(rt.loopId)
    rt.loopId = 0
  }
  rt.loopRunning = true

  const tick = () => {
    const current = runtime
    if (!current || current.disposed || !current.loopRunning) return
    current.loopId = requestAnimationFrame(tick)
    if (!current.isPageVisible) return
    const frame = getFrame()
    updateTerrain(frame.amplitude, frame.state)
    updateCamera()
    render()
  }

  rt.loopId = requestAnimationFrame(tick)
  return () => {
    const current = runtime
    if (!current) return
    current.loopRunning = false
    if (current.loopId) {
      cancelAnimationFrame(current.loopId)
      current.loopId = 0
    }
  }
}

export function getScene(): THREE.Scene {
  if (!runtime) {
    throw new Error('Terrain is not initialized')
  }
  return runtime.scene
}

export function getTerrainConfig(): TerrainConfigSnapshot {
  const quality = runtime?.currentQuality ?? detectDeviceQuality()
  const cols = runtime?.effectiveCols ?? Math.max(8, Math.floor(COLS * quality))
  const rows = runtime?.effectiveRows ?? Math.max(6, Math.floor(ROWS * quality))
  return {
    cols: TERRAIN_CONFIG.cols,
    rows: TERRAIN_CONFIG.rows,
    spacing: { ...TERRAIN_CONFIG.spacing },
    dotSize: TERRAIN_CONFIG.dotSize,
    amplitudeScale: TERRAIN_CONFIG.amplitudeScale,
    historyDepth: TERRAIN_CONFIG.historyDepth,
    maxPixelRatio: TERRAIN_CONFIG.maxPixelRatio,
    adaptiveQuality: TERRAIN_CONFIG.adaptiveQuality,
    currentQuality: quality,
    effectiveCols: cols,
    effectiveRows: rows,
    reducedMotion: runtime?.reducedMotion ?? false,
    parallaxEnabled: runtime?.parallaxEnabled ?? true,
    isDark: runtime?.isDark ?? false,
    isPageVisible: runtime?.isPageVisible ?? true,
    debugMode: runtime?.debugMode ?? false,
    pointCount: cols * rows,
    loopRunning: runtime?.loopRunning ?? false,
    lastFrameMs: runtime?.lastFrameMs ?? 0
  }
}

/** Camera position, so tests can prove parallax without touching the renderer. */
export function getCameraPosition(): { x: number; y: number; z: number } {
  const rt = runtime
  if (!rt) return { x: 0, y: 0, z: 0 }
  return { x: rt.camera.position.x, y: rt.camera.position.y, z: rt.camera.position.z }
}

/** Mean absolute Y of the front row. Used to prove motion differs by state. */
export function measureFrontRowEnergy(): number {
  const rt = runtime
  if (!rt) return 0
  const pos = rt.geometry.attributes.position?.array as Float32Array | undefined
  if (!pos) return 0
  let sum = 0
  const cols = rt.effectiveCols
  for (let c = 0; c < cols; c++) {
    sum += Math.abs(pos[c * 3 + 1] ?? 0)
  }
  return cols > 0 ? sum / cols : 0
}

/** Free geometries, materials, textures, listeners, and the renderer. */
export function disposeTerrain(): void {
  const rt = runtime
  if (!rt || rt.disposed) {
    runtime = null
    return
  }
  rt.disposed = true
  rt.loopRunning = false
  if (rt.loopId) {
    cancelAnimationFrame(rt.loopId)
    rt.loopId = 0
  }
  for (const { target, type, handler } of rt.listeners) {
    target.removeEventListener(type, handler)
  }
  rt.listeners.length = 0
  rt.observer?.disconnect()
  rt.observer = null
  rt.debugOverlay?.remove()
  rt.debugOverlay = null

  rt.scene.remove(rt.points)
  rt.geometry.dispose()
  if (rt.material.map) rt.material.map.dispose()
  rt.material.dispose()
  rt.renderer.dispose()
  runtime = null
}
