import { z } from "zod";

const guidingLightSchema = z.enum(["Learn", "Fix", "Stabilize", "Govern", "Grow"]);
const colorTokenSchema = z.enum(["graphite", "signal", "steel", "umber", "forest"]);

const relationSchema = z.object({
  targetId: z.string().min(1),
  targetName: z.string().min(1),
  description: z.string().min(1),
});

const mediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video", "gif"]),
  alt: z.string().min(1),
});

export const timelineItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    lane: z.string().min(1),
    description: z.string().min(1),
    placement: z.string().min(1),
    value: z.string().min(1),
    relations: z.array(relationSchema),
    guidingLights: z.array(guidingLightSchema).min(1).max(2),
    start: z.number().min(0).max(11.5).refine((value) => value * 2 === Math.round(value * 2), "Use whole-month or mid-month placement."),
    end: z.number().min(0).max(11.5).refine((value) => value * 2 === Math.round(value * 2), "Use whole-month or mid-month placement."),
    planned: z.boolean(),
    ongoing: z.boolean(),
    colorToken: colorTokenSchema,
    media: mediaSchema.nullable(),
  })
  .refine((item) => item.start <= item.end, {
    message: "The start month must be before or equal to the end month.",
    path: ["end"],
  });

export const timelineDataSchema = z.object({
  version: z.number().int().positive(),
  updatedAt: z.string().datetime(),
  meta: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    owner: z.string().min(1),
    period: z.string().min(1),
  }),
  lanes: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      displayName: z.string().min(1),
      index: z.number().int().positive(),
    }),
  ),
  items: z.array(timelineItemSchema).min(1),
});
