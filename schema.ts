import z, { ZodObject, ZodType } from "zod";
import { CrossIntersect, AllowedKeysFor, ExtraKeyError, IsTrue } from "./helpers";

export type BaseEntityFieldDefinition = {
    isOptional?: boolean,
    isNullable?: boolean,
};

export type StringEntityFieldDefinition = {
    type: "string",
    length: number | "max",
};

export type EnumEntityFieldDefinition = {
    type: "enum",
    values: readonly [string, ...string[]] | readonly [number, ...number[]],
};

export type RelationEntityFieldDefinition = {
    type: "relation",
    schemaDefinition: EntitySchemaDefinition,
    key: keyof EntitySchemaDefinition,
};

export type TimestampEntityFieldDefinition = {
    type: "timestamp",
};

export type DateEntityFieldDefinition = {
    type: "date",
};

export type TimeEntityFieldDefinition = {
    type: "time",
};

export type BooleanEntityFieldDefinition = {
    type: "boolean",
};

export type NumberEntityFieldDefinition = {
    type: "number",
    subType: "integer" | "float",
};

export type ArrayEntityFieldDefinition = {
    type: "array",
    itemDefinition: EntityFieldDefinition,
};

export type ObjectEntityFieldDefinition = {
    type: "object",
    schemaDefinition: EntitySchemaDefinition,
};

export type NullEntityFieldDefinition = {
    type: "null",
    isNullable: true,
};

export type UndefinedEntityFieldDefinition = {
    type: "undefined",
    isOptional: true,
};

export type EntityFieldDefinition =
    (
        StringEntityFieldDefinition
        | EnumEntityFieldDefinition
        | RelationEntityFieldDefinition
        | TimestampEntityFieldDefinition
        | DateEntityFieldDefinition
        | TimeEntityFieldDefinition
        | BooleanEntityFieldDefinition
        | NumberEntityFieldDefinition
        | ArrayEntityFieldDefinition
        | ObjectEntityFieldDefinition
        | NullEntityFieldDefinition
        | UndefinedEntityFieldDefinition
    ) & BaseEntityFieldDefinition;

export type EntitySchemaDefinition = {
    [k: string]: EntityFieldDefinition;
};

export type EntityFieldVariant =
    | StringEntityFieldDefinition
    | EnumEntityFieldDefinition
    | RelationEntityFieldDefinition
    | TimestampEntityFieldDefinition
    | DateEntityFieldDefinition
    | TimeEntityFieldDefinition
    | BooleanEntityFieldDefinition
    | NumberEntityFieldDefinition
    | ArrayEntityFieldDefinition
    | ObjectEntityFieldDefinition
    | NullEntityFieldDefinition
    | UndefinedEntityFieldDefinition;

export type FlatEntityFieldVariant =
    CrossIntersect<EntityFieldVariant, BaseEntityFieldDefinition>;

export type RecurseIntoChildren<F> =
    F extends { type: "object"; schemaDefinition: infer Sub extends EntitySchemaDefinition }
    ? { schemaDefinition: ExactEntitySchema<Sub> }
    : F extends { type: "array"; itemDefinition: infer Item extends EntityFieldDefinition }
    ? { itemDefinition: ExactField<Item, FlatEntityFieldVariant> }
    : {};

export type ExactField<F, V> =
    F
    & ExtraKeyError<F, AllowedKeysFor<F, V>>
    & RecurseIntoChildren<F>;

export type ExactEntitySchema<S> = {
    [K in keyof S]: ExactField<S[K], FlatEntityFieldVariant>;
};

type EntityFieldBaseType<F extends EntityFieldDefinition> =
    F extends { type: "string" } ? z.ZodString :
    F extends { type: "enum"; values: infer V }
    ? V extends readonly (infer U extends string)[] ? z.ZodEnum<{ [K in U]: K }>
    : V extends readonly (infer U extends number)[] ? z.ZodEnum<{ [K in U]: K }>
    : never :
    F extends { type: "relation"; schemaDefinition: infer E extends EntitySchemaDefinition; key: infer K }
    ? K extends keyof E ? EntityFieldType<E[K]> : never :
    F extends { type: "timestamp" } ? z.ZodString :
    F extends { type: "date" } ? z.ZodString :
    F extends { type: "time" } ? z.ZodString :
    F extends { type: "number" } ? z.ZodNumber :
    F extends { type: "boolean" } ? z.ZodBoolean :
    F extends { type: "array"; itemDefinition: infer I extends EntityFieldDefinition } ? z.ZodArray<EntityFieldType<I>> :
    F extends { type: "object"; schemaDefinition: infer S extends EntitySchemaDefinition } ? z.ZodObject<SchemaShape<S>> :
    F extends { type: "null" } ? z.ZodNull :
    F extends { type: "undefined" } ? z.ZodUndefined :
    never;

type WrapModifiers<F extends EntityFieldDefinition, B extends z.ZodType> =
    IsTrue<F["isOptional"]> extends true
    ? IsTrue<F["isNullable"]> extends true
    ? z.ZodNullable<z.ZodOptional<B>>
    : z.ZodOptional<B>
    : IsTrue<F["isNullable"]> extends true
    ? z.ZodNullable<B>
    : B;

export type EntityFieldType<F extends EntityFieldDefinition> =
    EntityFieldBaseType<F> extends infer B extends z.ZodType
    ? WrapModifiers<F, B>
    : never;

type SchemaShape<S extends EntitySchemaDefinition> = {
    [K in keyof S]: EntityFieldType<S[K]>;
};

export type ValidateRelations<S> = {
    [K in keyof S]: S[K] extends { type: "relation"; schemaDefinition: infer R extends EntitySchemaDefinition; key: infer KK }
    ? KK extends keyof R
    ? S[K]
    : Omit<S[K], "key"> & { key: keyof R }
    : S[K];
};

// THIS IS NOT CURRENTLY IMPLEMENTED AT ALL
// TODO implement correct metadata mapping
export const createSchemaField = (fieldDefinition: EntityFieldDefinition): ZodType => {
    let field: ZodType;
    // if (fieldDefinition.type === "string") {
    //     let stringField = z.string();
    //     if (fieldDefinition.length !== "max") {
    //         stringField = stringField.max(fieldDefinition.length);
    //     }
    //     if (fieldDefinition.source === "data" || !fieldDefinition.source)
    //         field = stringField.meta({
    //             isPrimaryKey: fieldDefinition?.isPrimaryKey,
    //             position: fieldDefinition.position,
    //             length: fieldDefinition.length,
    //             spannerType: `STRING(${fieldDefinition.length})`,
    //         });
    // } else if (fieldDefinition.type === "date") {
    //     field = z.string().meta({
    //         isPrimaryKey: fieldDefinition.isPrimaryKey,
    //         position: fieldDefinition.position,
    //         spannerType: "DATE",
    //     });
    // } else if (fieldDefinition.type === "time") {
    //     field = z.string().meta({
    //         isPrimaryKey: fieldDefinition.isPrimaryKey,
    //         position: fieldDefinition.position,
    //         length: 8, // HH:MM:SS
    //         spannerType: "STRING(8)",
    //     });
    // } else if (fieldDefinition.type === "number") {
    //     field = z.number().meta({
    //         isPrimaryKey: fieldDefinition.isPrimaryKey,
    //         position: fieldDefinition.position,
    //         spannerType: fieldDefinition.subType === "float" ? "FLOAT64" : "INT64",
    //     });
    // } else {
    // field = z.boolean();
    //}

    // TODO Remove
    field = z.any();

    if (fieldDefinition.isOptional) {
        field = field.optional();
    }
    if (fieldDefinition.isNullable) {
        field = field.nullable();
    }
    return field;
};

export const createSchema = <
    const S extends EntitySchemaDefinition & ValidateRelations<S>,
>(
    definition: S
): { definition: S; schema: ZodObject<SchemaShape<S>> } => {
    const shape = Object.fromEntries(
        Object.entries(definition).map(([key, value]) => [key, createSchemaField(value)])
    ) as unknown as SchemaShape<S>;

    return {
        definition: definition as S,
        schema: z.object(shape)
    } as const;
};