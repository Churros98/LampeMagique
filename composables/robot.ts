import type { JointNode, Robot, RobotDescriptor } from '~/utils/robot.t'
import * as THREE from 'three'

import { FBXLoader } from 'three/examples/jsm/Addons.js'

import { parse } from 'yaml'
import { RobotDescriptorSchema } from '~/utils/robot.t'

const manager = new THREE.LoadingManager()
const loader = new FBXLoader(manager)

const robot = useState<Robot | undefined>('robot', () => undefined)

async function createGraph(robot: Robot) {
  const joints = Object.entries(robot.description.joints)
  const model = robot.model as THREE.Object3D

  // Find the root joint (the one with is_root = true)
  const rootJoints = joints.find(([, joint]) => joint.is_root)
  if (!rootJoints) {
    throw new Error('No root joint found in robot description')
  }

  // Create the root JointNode
  const rootNode: JointNode = {
    name: rootJoints[0],
    angle: { deg: 0 },
    constraint: rootJoints[1].constraint,
    joints: [],
  }

  const jointNodes = new Map<string, JointNode>()
  const groupNodes = new Map<string, THREE.Group>()

  // Create a JointNode for each joint in the description
  joints.forEach(([jointName, joint]) => {
    const jointObject = model.children.find((children) => children.name === jointName)
    if (!jointObject) {
      throw new Error(`Joint ${jointName} not found in model`)
    }

    if (jointNodes.has(jointName)) {
      throw new Error(`Joint ${jointName} exists multiple times`)
    }

    jointNodes.set(jointName, {
      name: jointName,
      angle: { deg: 0 },
      constraint: joint.constraint,
      joints: [],
    })

    const group = new THREE.Group()
    group.name = jointName
    group.position.set(joint.origin.x, joint.origin.y, joint.origin.z)
    group.add(jointObject)
    groupNodes.set(jointName, group)
  })

  // Link the JointNodes together based on the linked_to property in the description
  jointNodes.forEach((jointNode) => {
    const linked_to = robot.description.joints[jointNode.name].linked_to
    if (linked_to) {
      linked_to.forEach((linkedJointName) => {
        const linkedJointNode = jointNodes.get(linkedJointName)
        if (!linkedJointNode) {
          throw new Error(`Linked joint ${linkedJointName} not found in description`)
        }

        jointNode.joints.push(linkedJointNode)

        const groupNode = groupNodes.get(jointNode.name)
        const linkedGroupNode = groupNodes.get(linkedJointName)
        if (!groupNode || !linkedGroupNode) {
          throw new Error(`Group node for joint ${jointNode.name} or ${linkedJointName} not found`)
        }

        groupNode.add(linkedGroupNode)
      })
    }
  })

  // Populate the rootNode joints
  rootNode.joints = Array.from(jointNodes.values()).filter((jointNode) => jointNode.name !== rootNode.name)

  return rootNode
}

async function loadRobotDescription(name: string): Promise<RobotDescriptor> {
  const response = await fetch(`models/${name}/description.yml`)
  const body = await response.text()
  const data = parse(body)
  return RobotDescriptorSchema.parse(data)
}

async function loadModel(name: string): Promise<THREE.Group> {
  return loader.loadAsync(`models/${name}/model.fbx`)
}

export async function initRobot(name: string) {
  const description = await loadRobotDescription(name)
  const model = await loadModel(name)
  robot.value = { description, model } as Robot
  return robot.value
}

export function useRobot(name: string) {
  if (!robot.value) {
    initRobot(name)
  }

  return { robot }
}
