import { Object3D } from 'three'
import { z } from 'zod'

//////////////////////////////////////////
// Basic types
//////////////////////////////////////////

const AngleSchema = z.object({
  deg: z.number().min(-180).max(180),
})

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

const ConstraintSchema = z.object({
  min: z.number().min(-180).max(180),
  max: z.number().min(-180).max(180),
}).refine((data: z.infer<typeof ConstraintSchema>) => data.min < data.max, {
  message: 'min must be less than max',
})

export type Angle = z.infer<typeof AngleSchema>
export type Constraint = z.infer<typeof ConstraintSchema>
export type Position = z.infer<typeof PositionSchema>

//////////////////////////////////////////
// Description of the robot (YAML file)
//////////////////////////////////////////

const JointDescSchema = z.object({
  id: z.number().min(0).optional(),
  is_root: z.boolean().optional().default(false),
  constraint: ConstraintSchema.optional().default({ min: -180, max: 180 }),
  origin: PositionSchema.optional().default({ x: 0, y: 0, z: 0 }),
  linked_to: z.array(z.string().min(1)).optional().default([]),
})

const JointsDesc = z.record(z.string(), JointDescSchema)

export const RobotDescriptorSchema = z.object({
  name: z.string().min(1),
  joints: JointsDesc,
})


export type RobotDescriptor = z.infer<typeof RobotDescriptorSchema>

//////////////////////////////////////////
// Robot structure in memory
//////////////////////////////////////////

interface IJointNode {
  name: string
  angle: Angle
  constraint: Constraint
  joints: IJointNode[]
}

const JointNodeSchema: z.ZodType<IJointNode> = z.lazy(() =>
  z.object({
    name: z.string().min(1),
    angle: AngleSchema,
    constraint: ConstraintSchema,
    joints: z.array(JointNodeSchema),
  })
);

export const RobotSchema = z.object({
  description: RobotDescriptorSchema,
  model: Object3D,
})

export type Robot = z.infer<typeof RobotSchema>
export type JointNode = z.infer<typeof JointNodeSchema>