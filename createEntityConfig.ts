import { z, ZodObject } from "zod";
import { EntityParsingConfig } from "./createParsingConfig";
import { EntitySpannerConfig } from "./createSpannerConfig";


export const createEntitySchema = <Shape extends z.ZodRawShape>(
    schema: ZodObject<Shape>,
    entitySchema: EntitySpannerConfig<Shape> & EntityParsingConfig<Shape>,
): EntitySpannerConfig<Shape> => {
    return entitySchema;
};

