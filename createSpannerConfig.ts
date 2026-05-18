import { z, ZodObject } from "zod";

export type FieldSpannerConfig<F> =
    F extends z.ZodString
    ? { length: number | "max" } :
    F extends z.ZodNumber
    ? { dbType: "INT64" | "FLOAT64" }
    : { dbType: string };

export type EntitySpannerConfig<Shape extends z.ZodRawShape> = {
    [K in keyof Shape]: FieldSpannerConfig<Shape[K]>;
};

export const createEntitySpannerSchema = <Shape extends z.ZodRawShape>(
    schema: ZodObject<Shape>,
    spannerSchema: EntitySpannerConfig<Shape>,
): EntitySpannerConfig<Shape> => {
    return spannerSchema;
};

