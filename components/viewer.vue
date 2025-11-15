<script setup lang="ts">
import { usePointer } from '@vueuse/core'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FBXLoader } from 'three/examples/jsm/Addons.js';

import type { Angle } from 'unrobot/robot.t'
import type { Robot, JointNode } from 'unrobot/robot.t'

const props = defineProps<{
  targetX: number
  targetY: number
  targetZ: number
  jointAngles: Map<string, Ref<Angle>>
}>()

// References and state
const { robot, joints: robotJoints } = useRobot()
const canvas = useTemplateRef('canvas')
const scene = new THREE.Scene()
const loader = new FBXLoader()
const renderer = shallowRef<THREE.WebGLRenderer | undefined>()
const controleOrbite = shallowRef<OrbitControls | undefined>()

let groupJoints = new Map<string, THREE.Group>()

// Mouse / Pointer
const { x, y, pressure } = usePointer({
  target: canvas,
})

const ratio = computed(() => {
  return canvas.value ? (canvas.value.clientWidth / canvas.value.clientHeight) : 1
})

// Debug
const axesHelper = new THREE.AxesHelper(200)
scene.add(axesHelper)

// Preparing camera
const camera = new THREE.PerspectiveCamera(75, ratio.value, 100, 5000)
camera.up.set( 0, 0, 1 )
camera.position.set(0, 0, 1500)
camera.rotateY(-Math.PI / 4)
camera.rotateZ(-Math.PI / 4)
scene.add(camera)

// Preparing interactions
const pointer = new THREE.Vector2(0, 0)
const raycaster = new THREE.Raycaster()
let targetedObject: THREE.Intersection | undefined
let clickedObject: THREE.Intersection | undefined

// Adding light
const color = 0xFFFFFF
const intensity = 5
const light = new THREE.AmbientLight(color, intensity)
scene.add(light)

// Adding a grid helper
const gridHelper = new THREE.GridHelper(20, 20)
gridHelper.scale.set(100, 100, 100)
gridHelper.position.set(0, 0, 0)
gridHelper.rotateX(Math.PI / 2)
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

// Recursive function to create the tree structure
function deepTree(model: THREE.Object3D, groupMap: Map<string, THREE.Group>, joint: JointNode, offset: THREE.Vector3) {
  // Check if the joint name is unique
  if (groupMap.has(joint.name))
    throw new Error(`Joint name "${joint.name}" is not unique (Circular Tree).`)

  // Create a group for the joint
  const parentGroup = new THREE.Group()
  parentGroup.name = joint.name + '_group'
  groupMap.set(joint.name, parentGroup)

  // Set the position of the group using joint origin
  parentGroup.position.set(joint.origin.x, joint.origin.y, joint.origin.z)
  parentGroup.position.sub(offset)

  // Create the offset
  offset = new THREE.Vector3(joint.origin.x, joint.origin.y, joint.origin.z)

  // Find the corresponding object in the model
  const obj = model.getObjectByName(joint.name)
  if (obj) {
    obj.position.set(0,0,0)
    parentGroup.add(obj)
  } else {
    throw new Error(`Joint name "${joint.name}" not found in the model.`)
  }

  // Recursively add child joints
  joint.joints.forEach((child) => {
    const childGroup = deepTree(model, groupMap, child, offset)
    parentGroup.add(childGroup)
  })

  return parentGroup
}

// Create a Three.JS Tree based on the robot.
function createTree(robot: Robot, model: THREE.Object3D) {
  const groupMap = new Map<string, THREE.Group>()
  const rootGroup = deepTree(model, groupMap, robot.rootJoint, new THREE.Vector3(0,0,0))

  return { rootGroup, groupMap }
}

// If robot changes, load the model and prepare a list of joints
watch(robot, (robot) => {
  if (!robot)
    return

  // Load the model
  loader.load(`/models/${robot.information.name}/model.fbx`, (fbx) => {
    fbx.scale.set(1, 1, 1)
    fbx.position.set(0, 0, 0)

    const { rootGroup, groupMap } = createTree(robot, fbx)
    groupJoints = groupMap

    scene.add(rootGroup)
  }, (_progress) => {}, (error) => {
    console.error('Unable to load model', error)
  })
})

// Update joint angles when asked
watchDebounced(props.jointAngles, (angles) => {
  if (robot.value === undefined)
    return

  angles.forEach((angle, name) => {
    const group = groupJoints.get(name)
    if (group && robotJoints.value) {
      let jointObj = robotJoints.value.get(name)
      if (!jointObj) {
        console.warn(`Joint "${name}" not found (Map).`)
        return
      }
      
      console.log(`Setting angle for joint ${name} to ${angle.value.deg} degrees.`)
      console.log(JSON.stringify(robotJoints.value))

      if (jointObj.rotation) {
        const float_value =  angle.value.deg * (Math.PI / 180)
        console.log(`Rotation of ${name}: ${float_value}`)
        group.setRotationFromAxisAngle(new THREE.Vector3(jointObj.rotation.x, jointObj.rotation.y, jointObj.rotation.z), float_value)
      }
    } else {
      console.warn(`Joint "${name}" not found (Rotation).`)
    }
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

  if (targetedObject) {
    const vecteur = new THREE.Vector3()
      targetedObject.object.getWorldPosition(vecteur)

    axesHelper.position.copy(vecteur)
    console.log(vecteur)
  }
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
