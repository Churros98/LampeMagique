export interface Angles {
    m1: number,
    m2: number,
    m3: number,
    m4: number,
}

export interface Contraintes {
    m1: {
        min: number,
        max: number
    },
    m2: {
        min: number,
        max: number
    },
    m3: {
        min: number,
        max: number
    },
    m4: {
        min: number,
        max: number
    },
}

export interface EventMessage {
    name: string
    data: Angles | Contraintes | undefined
}