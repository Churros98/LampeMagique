import type { JointNode, Robot, RobotDescriptor } from 'unrobot/robot.t'
import { RobotDescriptorSchema } from 'unrobot/robot.t'
import { list_all_joints_from_root } from 'unrobot/joints'

const robot = useState<Robot | undefined>('robot', () => undefined)
const joints = useState<Map<string, JointNode>>('robot_joints', () => new Map())

// Create a tree structure of JointNodes from the robot description
function createTree(description: RobotDescriptor): JointNode {
  const joints = Object.entries(description.joints)

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
    origin: rootJoints[1].origin,
    joints: [],
  }

  const jointNodes = new Map<string, JointNode>()

  // Create a JointNode for each joint in the description
  joints.forEach(([jointName, joint]) => {
    if (jointNodes.has(jointName)) {
      throw new Error(`Joint ${jointName} exists multiple times`)
    }

    jointNodes.set(jointName, {
      name: jointName,
      angle: { deg: 0 },
      constraint: joint.constraint,
      origin: joint.origin,
      joints: [],
    })
  })

  // Link the JointNodes together based on the linked_to property in the description
  jointNodes.forEach((jointNode) => {
    const linked_to = description.joints[jointNode.name].linked_to
    if (linked_to) {
      linked_to.forEach((linkedJointName) => {
        const linkedJointNode = jointNodes.get(linkedJointName)
        if (!linkedJointNode) {
          throw new Error(`Linked joint ${linkedJointName} not found in description`)
        }

        jointNode.joints.push(linkedJointNode)
      })
    }
  })

  // Populate the rootNode joints
  rootJoints[1].linked_to?.forEach((linkedJointName) => {
    const linkedJointNode = jointNodes.get(linkedJointName)
    if (!linkedJointNode) {
      throw new Error(`Linked joint ${linkedJointName} not found in description`)
    }

    rootNode.joints.push(linkedJointNode)
  })

  return rootNode
}

// Load the robot description from a JSON file
async function loadRobotDescription(name: string): Promise<RobotDescriptor> {
  const response = await fetch(`models/${name}/description.json`)
  const body = await response.text()
  const data = JSON.parse(body)
  return RobotDescriptorSchema.parse(data)
}

// Initialize the robot state by loading its description and creating its tree structure
export async function initRobot(name: string) {
  const description = await loadRobotDescription(name)
  const rootJoint = createTree(description)

  joints.value.clear()
  list_all_joints_from_root(rootJoint).forEach((joint) => {
    joints.value.set(joint.name, joint)
  })
  
  robot.value = { information: description.information, rootJoint } as Robot
  return robot.value
}

// Composable to access the robot state, initializing it if necessary
export function useRobot() {
  return { initRobot, robot, joints }
}