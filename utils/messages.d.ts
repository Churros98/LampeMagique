export interface Angle {
    deg: number,
}

export interface Contrainte {
    min: number,
    max: number
}


export interface JointAngles {
    name: string,
    angle: Angle,
}

export interface EventMessage {
    name: string
    data: Angle | Contrainte | undefined
}