<script setup lang="ts">
import { usePointer } from '@vueuse/core'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useRobot } from '~/composables/robot.js'

const props = defineProps<{
  targetX: number
  targetY: number
  targetZ: number
  jointAngles?: JointAngles[]
}>()

// Référence
const canvas = useTemplateRef('canvas')
const scene = new THREE.Scene()
const renderer = shallowRef<THREE.WebGLRenderer | undefined>()
const controleOrbite = shallowRef<OrbitControls | undefined>()

// Mouse / Pointer
const { x, y, pressure } = usePointer({
  target: canvas,
})

const ratio = computed(() => {
  return canvas.value ? (canvas.value.clientWidth / canvas.value.clientHeight) : 1
})

// Load robot
const { robot } = useRobot('robot_arm')

// Debug
const axesHelper = new THREE.AxesHelper(200)
scene.add(axesHelper)

// Préparation de la caméra.
const camera = new THREE.PerspectiveCamera(75, ratio.value, 100, 5000)
camera.position.set(0, 0, 1500)
camera.rotateY(-Math.PI / 4)
camera.rotateZ(-Math.PI / 4)
scene.add(camera)

// Preparing interactions
const pointer = new THREE.Vector2(0, 0)
const raycaster = new THREE.Raycaster()
let targetedObject: THREE.Intersection | undefined
let _clickedObject: THREE.Intersection | undefined

// Adding light
const color = 0xFFFFFF
const intensity = 5
const light = new THREE.AmbientLight(color, intensity)
scene.add(light)

// Adding a grid helper
const gridHelper = new THREE.GridHelper(20, 20)
gridHelper.scale.set(100, 100, 100)
gridHelper.position.set(0, 0, 0)
scene.add(gridHelper)

// Setting background color
scene.background = new THREE.Color('#F6E6B1')

// Target
const offset = new THREE.Vector3(0, 0, 0)
const targetPos = reactive(new THREE.Vector3(0, 0, 0))
const geometry = new THREE.SphereGeometry(30, 32, 16)
const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 })
const target = new THREE.Mesh(geometry.clone(), material.clone())
target.position.set(offset.x, offset.y, offset.z)
scene.add(target)

// Update target position
watch(() => props.targetX, (x) => {
  targetPos.setX(x)
})

watch(() => props.targetY, (y) => {
  targetPos.setY(y)
})

watch(() => props.targetZ, (z) => {
  targetPos.setZ(z)
})

watch(targetPos, () => {
  target.position.set(targetPos.x + offset.x, targetPos.y + offset.y, targetPos.z + offset.z)
})

// If model is loaded, add it to the scene
watch(robot, (robot) => {
  if (robot?.model instanceof THREE.Object3D) {
    scene.add(robot.model)
  }
})

// Update joint angles
watch(() => props.jointAngles, (angles) => {
  angles?.forEach((name, angle) => {
    console.warn(name, angle)
    // TODO : Rotate the joints
  })
})

// Update / rendering loop
function animation() {
  // Get the closest object intersected by the ray (mouse pointer)
  raycaster.setFromCamera(pointer, camera)
  const intersections = raycaster.intersectObjects(scene.children)
  targetedObject = intersections.length ? intersections[0] : undefined

  // Navigate through the scene
  controleOrbite.value?.update()

  // Render the image
  renderer.value?.render(scene, camera)
}

// When the component is mounted, initialize the renderer and controls
onMounted(() => {
  if (!canvas.value)
    return

  renderer.value = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
  })

  renderer.value?.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false)
  controleOrbite.value = new OrbitControls(camera, renderer.value.domElement)

  renderer.value.setAnimationLoop(animation)
})

// Update the pointer coordinates when the mouse moves
watch([x, y], () => {
  if (!canvas.value)
    return
  pointer.x = (x.value / canvas.value.clientWidth) * 2 - 1
  pointer.y = -(y.value / canvas.value.clientHeight) * 2 + 1
})

// Handle click events
watch(pressure, () => {
  if (pressure.value <= 0)
    return

  _clickedObject = targetedObject
})

// Handle window resize
watch(ratio, () => {
  if (canvas.value)
    renderer.value?.setSize(canvas.value.clientWidth, canvas.value.clientHeight, false)

  camera.aspect = ratio.value
  camera.updateProjectionMatrix()
})
</script>

<template>
  <canvas ref="canvas" />
</template>

<style>
canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>
