import { z } from 'zod';

const Angle = z.object({
    deg: z.number().min(-180).max(180),
});

const Constraint = z.object({
    min: z.number().min(-180).max(180),
    max: z.number().min(-180).max(180),
}).refine((data) => data.min < data.max, {
    message: "min must be less than max",
});

const JointAngles = z.object({
    name: z.string().min(1),
    angle: Angle,
});

const PartObj = z.object({
    id: z.number().min(0),
    constraint: Constraint,
});

const Part = z.record(z.string(), PartObj);

export const RobotDescriptor = z.object({
    name: z.string().min(1),
    model: z.string().min(1),
    parts: Part,
});

const EventMessage = z.object({
    name: z.string().min(1),
    data: z.union([Angle, Constraint]).optional(),
});

export type RobotDescriptor = z.infer<typeof RobotDescriptor>;
export type Angle = z.infer<typeof Angle>;
export type Constraint = z.infer<typeof Constraint>;
export type JointAngles = z.infer<typeof JointAngles>;
export type EventMessage = z.infer<typeof EventMessage>;