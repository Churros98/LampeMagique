import { Group } from 'three'
import { exp } from 'three/tsl'
import { z } from 'zod'

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

const _JointAnglesSchema = z.object({
  name: z.string().min(1),
  angle: AngleSchema,
})

const PartObj = z.object({
  id: z.number().min(0).optional(),
  constraint: ConstraintSchema,
  origin: PositionSchema,
})

const Part = z.record(z.string(), PartObj)

export const RobotDescriptorSchema = z.object({
  name: z.string().min(1),
  parts: Part,
})

export const RobotSchema = z.object({
  description: RobotDescriptorSchema,
  model: Group,
})

const _EventMessageSchema = z.object({
  name: z.string().min(1),
  data: z.union([AngleSchema, ConstraintSchema]).optional(),
})

export type RobotDescriptor = z.infer<typeof RobotDescriptorSchema>
export type Angle = z.infer<typeof AngleSchema>
export type Constraint = z.infer<typeof ConstraintSchema>
export type JointAngles = z.infer<typeof _JointAnglesSchema>
export type Position = z.infer<typeof PositionSchema>
export type EventMessage = z.infer<typeof _EventMessageSchema>
export type Robot = z.infer<typeof RobotSchema>
