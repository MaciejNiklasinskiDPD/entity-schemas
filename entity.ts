import { z } from "zod";

export const schema = z.object({
    field1: z.string(),
    field2: z.number(),
});