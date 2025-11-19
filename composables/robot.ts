import type { JointNode, Robot, RobotDescriptor } from 'unrobot/robot.t'
import { load_robot_from_url } from 'unrobot/robot'
import { list_all_joints_from_root } from 'unrobot/joints'

// Composable to access the robot state, initializing it if necessary
export function useRobot(name: string) {
  const robot = useState<Robot | undefined>('robot', () => undefined)
  const joints = useState<Map<string, JointNode>>('robot_joints', () => new Map())
  const status = useState<'loading' |'loaded' | 'error'>('loading')

  load_robot_from_url(`models/${name}/description.json`).then((v) => {
    robot.value = v
    status.value = 'loaded'
  }).catch((_e) => {
    status.value = 'error'
  })

  // Create joints cache
  joints.value.clear()
  list_all_joints_from_root(robot.value.rootJoint).forEach((joint) => {
    joints.value.set(joint.name, joint)
  })


  return { robot, joints }
}