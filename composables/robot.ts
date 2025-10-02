import { reactive } from 'vue'
import { parse } from 'yaml'

import { RobotDescriptor } from '~/utils/robot.t';

async function loadRobot(link: string): Promise<RobotDescriptor> {
    console.log("Loading robot descriptor from", link)
    return await fetch(link).then(async (response) => {
        return await response.text().then((body) => {
            const data = parse(body)
            return RobotDescriptor.parse(data)
        })
    }).catch((error) => {
        console.error("Unable to request robot file descriptor:", error)
        throw error
    })
}

export function useRobot(link: string) {
    let robot = reactive<RobotDescriptor>({
        name: "",
        model: "",
        parts: {}
    })

    loadRobot(link).then((data) => {
        robot = data
        console.log("Robot descriptor loaded:", robot)
    }).catch((error) => {
        console.error("Error loading robot descriptor:", error)
    });

    console.log("Returning robot descriptor:", robot)
    return { robot }
}