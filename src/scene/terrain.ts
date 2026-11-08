import * as THREE from 'three'
import type { AppState } from '@/types'

const COLS = 130
const ROWS = 72
const DX = 0.2
const DZ = 0.22
const HISTORY_LENGTH = ROWS * 3 + 4

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let points: THREE.Points
const amplitudeHistory: number[] = []
let isDark = false

// Color states
const BG = { light: 0.93, dark: 0.04 }
const BASE = { light: 0.7, dark: 0.34 }
const ACCENT_COLORS: Record<AppState, [number, number, number]> = {
  idle: [0.9, 0.9, 0.9],
  listening: [1, 0.23, 0.12],
  speaking: [1, 1, 1],
  thinking: [0.7, 0.7, 0.74],
  intro: [0.9, 0.9, 0.9]
}

const ACCENT_COLORS_LIGHT: Record<AppState, [number, number, number]> = {
  idle: [0.05, 0.05, 0.05],
  listening: [1, 0.23, 0.12],
  speaking: [0.05, 0.05, 0.05],
  thinking: [0.3, 0.3, 0.32],
  intro: [0.9, 0.9, 0.9]
}

const currentColor: [number, number, number] = [0.9, 0.9, 0.9]
let targetColor: [number, number, number] = [0.9, 0.9, 0.9]
let mouseX = 0
let mouseY = 0

/**
 * Initialize the 3D dot terrain
 */
export function initTerrain(canvas: HTMLCanvasElement): THREE.Scene {
  isDark = !window.matchMedia('(prefers-color-scheme: light)').matches ||
           document.documentElement.dataset.theme === 'dark'

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)

  // Initialize amplitude history
  for (let i = 0; i < HISTORY_LENGTH; i++) {
    amplitudeHistory.push(0)
  }

  // Create dot grid
  const positions = new Float32Array(COLS * ROWS * 3)
  const colors = new Float32Array(COLS * ROWS * 3)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c
      positions[i * 3] = (c - COLS / 2) * DX
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 2 - r * DZ
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Create circular dot texture
  const canvas2d = document.createElement('canvas')
  canvas2d.width = canvas2d.height = 32
  const ctx = canvas2d.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(16, 16, 14, 0, Math.PI * 2)
  ctx.fill()

  const material = new THREE.PointsMaterial({
    size: 0.085,
    map: new THREE.CanvasTexture(canvas2d),
    vertexColors: true,
    transparent: true,
    alphaTest: 0.2,
    depthWrite: false
  })

  points = new THREE.Points(geometry, material)
  scene.add(points)

  // Mouse tracking
  window.addEventListener('pointermove', (e: PointerEvent) => {
    mouseX = e.clientX / window.innerWidth - 0.5
    mouseY = e.clientY / window.innerHeight - 0.5
  })

  // Resize handling
  const handleResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', handleResize)
  handleResize()

  return scene
}

/**
 * Update terrain animation
 */
export function updateTerrain(amplitude: number, state: AppState): void {
  if (!points) return

  // Update amplitude history
  amplitudeHistory.unshift(amplitude)
  amplitudeHistory.pop()

  // Update target color based on state
  const nextColor = (isDark ? ACCENT_COLORS[state] : ACCENT_COLORS_LIGHT[state]) || [0.9, 0.9, 0.9]
  targetColor = nextColor

  // Smooth color transition
  for (let i = 0; i < 3; i++) {
    const currentVal = currentColor[i]
    const targetVal = targetColor[i]
    if (currentVal !== undefined && targetVal !== undefined) {
      currentColor[i] = currentVal + (targetVal - currentVal) * 0.12
    }
  }

  const positions = points.geometry.attributes.position as THREE.BufferAttribute | undefined
  const colors = points.geometry.attributes.color as THREE.BufferAttribute | undefined

  if (!positions || !colors) return
  const bgValue = isDark ? BG.dark : BG.light
  const baseValue = isDark ? BASE.dark : BASE.light
  const sig2 = 2 * 5 * 5

  for (let r = 0; r < ROWS; r++) {
    const a = amplitudeHistory[r * 3] || 0
    const fade = 1 - (r / ROWS) * 0.88

    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c
      const xx = (c - COLS / 2) * DX
      const gaussian = Math.exp(-xx * xx / sig2)
      const noise = 0.5 + 0.5 * Math.sin(c * 0.55 + r * 0.3) * Math.sin(c * 0.21 - r * 0.45 + 1.3)
      const timeOffset = performance.now() / 1000
      const y = a * 3.8 * gaussian * noise + 0.015 * Math.sin(c * 0.8 + r * 0.9 + timeOffset * 0.5)
      const t = Math.min(1, y / 1.6)

      positions.array[i * 3 + 1] = y

      const cr = baseValue + (currentColor[0] - baseValue) * t
      const cg = baseValue + (currentColor[1] - baseValue) * t
      const cb = baseValue + (currentColor[2] - baseValue) * t

      colors.array[i * 3] = bgValue + (cr - bgValue) * fade
      colors.array[i * 3 + 1] = bgValue + (cg - bgValue) * fade
      colors.array[i * 3 + 2] = bgValue + (cb - bgValue) * fade
    }
  }

  positions.needsUpdate = true
  colors.needsUpdate = true
}

/**
 * Update camera position
 */
export function updateCamera(): void {
  if (!camera) return
  camera.position.set(mouseX * 2, 3.5 + mouseY * -0.8, 7.2)
  camera.lookAt(0, 0.5, -5.5)
}

/**
 * Render the scene
 */
export function render(): void {
  if (!renderer || !scene || !camera) return
  renderer.render(scene, camera)
}

/**
 * Get the scene for adding stage objects
 */
export function getScene(): THREE.Scene {
  return scene
}
