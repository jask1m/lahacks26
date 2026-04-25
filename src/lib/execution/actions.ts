import { z } from "zod";

export const executableActionSchema = z.object({
  action: z.enum([
    "navigate",
    "click",
    "type",
    "waitForSelector",
    "assertVisible",
    "assertText",
    "assertLink",
    "goBack",
    "scroll",
  ]),
  selector: z.string().optional(),
  value: z.string().optional(),
  url: z.string().optional(),
  description: z.string(),
});

export const executableActionsSchema = z.object({
  actions: z.array(executableActionSchema),
});

export type ExecutableAction = z.infer<typeof executableActionSchema>;
