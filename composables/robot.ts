import type { Robot, RobotDescriptor } from '~/utils/robot.t'
import * as THREE from 'three'

import { FBXLoader } from 'three/examples/jsm/Addons.js'
import { shallowRef } from 'vue'

import { parse } from 'yaml'
import { RobotDescriptorSchema } from '~/utils/robot.t'

const manager = new THREE.LoadingManager()
const loader = new FBXLoader(manager)

async function loadRobot(name: string): Promise<RobotDescriptor> {
  return await fetch(`models/${name}/description.yml`).then(async (response) => {
    return await response.text().then((body) => {
      const data = parse(body)
      return RobotDescriptorSchema.parse(data)
    })
  }).catch((error) => {
    throw error
  })
}

async function loadModel(name: string): Promise<THREE.Group> {
  return await loader.loadAsync(`models/${name}/model.fbx`).then((model) => {
    return model
  }).catch((error) => {
    throw error
  })
}

export function useRobot(name: string) {
  const robot = shallowRef<Robot | undefined>(undefined)

  loadRobot(name).then(async (description) => {
    await loadModel(name).then((model) => {
      robot.value = { description, model } as Robot
    }).catch((error) => {
      throw error
    })
  }).catch((error) => {
    throw error
  })

  return { robot }
}
