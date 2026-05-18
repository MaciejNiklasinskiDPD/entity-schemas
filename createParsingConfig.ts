import { z, ZodObject } from "zod";

export type DataFieldParsingConfig = {
    source?: "data",
    position: number,
};

export type AttributeFieldParsingConfig = {
    source: "attribute",
    attribute: string,
};

export type KeyFieldParsingConfig = {
    isPrimaryKey: true,
    source: "key",
    position: number,
    delimiter: "*" | "",
    isOptional?: false,
} | {
    isPrimaryKey: true,
    source: "key",
    position: number,
    keyParser: (key: string) => string[],
    isOptional?: false,
};

export type FieldParsingConfig = (
    DataFieldParsingConfig
    | AttributeFieldParsingConfig
    | KeyFieldParsingConfig
);

export type EntityParsingConfig<Shape extends z.ZodRawShape> = {
    [K in keyof Shape]: FieldParsingConfig;
};

export const createEntityParsingSchema = <Shape extends z.ZodRawShape>(
    schema: ZodObject<Shape>,
    parsingSchema: EntityParsingConfig<Shape>,
): EntityParsingConfig<Shape> => {
    return parsingSchema;
};

