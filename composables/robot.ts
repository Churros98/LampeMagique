import type { JointNode, Robot, RobotDescriptor } from 'unrobot/robot.t'
import { load_robot_from_url } from 'unrobot/robot'
import { list_all_joints_from_root } from 'unrobot/joints'

const robot = useState<Robot | undefined>('robot', () => undefined)
const joints = useState<Map<string, JointNode>>('robot_joints', () => new Map())

// Initialize the robot state by loading its description and creating its tree structure
export async function initRobot(name: string) {
  robot.value = await load_robot_from_url(`models/${name}/description.json`)

  // Create joints cache
  joints.value.clear()
  list_all_joints_from_root(robot.value.rootJoint).forEach((joint) => {
    joints.value.set(joint.name, joint)
  })

  return robot.value
}

// Composable to access the robot state, initializing it if necessary
export function useRobot() {
  return { initRobot, robot, joints }
}