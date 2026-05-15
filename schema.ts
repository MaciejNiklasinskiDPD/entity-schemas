import z, { ZodObject, ZodType } from "zod";
import { CrossIntersect, AllowedKeysFor, ExtraKeyError, IsTrue } from "./helpers";

export type BaseEntityFieldDefinition = {
    isOptional?: boolean,
    isNullable?: boolean,
};

export type BaseEntityFieldDefinitionKeys = keyof BaseEntityFieldDefinition;

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

export type UnionEntityFieldDefinition = {
    type: "union",
    fieldDefinitions: readonly EntityFieldDefinition[],
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
        | UnionEntityFieldDefinition
        | NullEntityFieldDefinition
        | UndefinedEntityFieldDefinition
    ) & BaseEntityFieldDefinition;

export type EntitySchemaDefinition = {
    [k: string]: EntityFieldDefinition;
};

export type PersistableEntityFieldConfig<T extends string> = {
    tableName?: T,
};

export type PersistableEntitySchemaDefinition<T extends string> = {
    [k: string]: EntityFieldDefinition & PersistableEntityFieldConfig<T>;
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
    | UnionEntityFieldDefinition
    | NullEntityFieldDefinition
    | UndefinedEntityFieldDefinition;

export type FlatPersistableFieldVariant<T extends string> =
    CrossIntersect<EntityFieldVariant, PersistableEntityFieldConfig<T>>;

export type RecurseIntoChildren<F> =
    F extends { type: "object"; schemaDefinition: infer Sub }
    ? Sub extends EntitySchemaDefinition
    ? { schemaDefinition: ExactEntitySchema<Sub> }
    : {}
    : F extends { type: "array"; itemDefinition: infer Item }
    ? Item extends EntityFieldDefinition
    ? { itemDefinition: ExactField<Item, EntityFieldVariant> }
    : {}
    : F extends { type: "union"; fieldDefinitions: infer Defs }
    ? Defs extends readonly EntityFieldDefinition[]
    ? {
        fieldDefinitions: {
            [K in keyof Defs]: Defs[K] extends EntityFieldDefinition
            ? ExactField<Defs[K], EntityFieldVariant>
            : Defs[K];
        };
    }
    : {}
    : {};

export type ExactField<F, V> =
    F
    & ExtraKeyError<F, AllowedKeysFor<F, V> | BaseEntityFieldDefinitionKeys>
    & RecurseIntoChildren<F>;

export type ExactEntitySchema<S> = {
    [K in keyof S]: ExactField<S[K], EntityFieldVariant>;
};

export type ExactPersistableDefinition<S, T extends string> = {
    [K in keyof S]: ExactField<S[K], FlatPersistableFieldVariant<T>>;
};

export type EntityFieldBaseType<F extends EntityFieldDefinition> =
    F extends { type: "string" } ? z.ZodString :
    F extends { type: "enum"; values: infer V }
    ? V extends readonly (infer U extends string)[] ? z.ZodEnum<{ [K in U]: K }>
    : V extends readonly (infer U extends number)[] ? z.ZodEnum<{ [K in U]: K }>
    : never :
    F extends { type: "relation"; schemaDefinition: infer E; key: infer K }
    ? E extends EntitySchemaDefinition ? K extends keyof E ? EntityFieldType<E[K]> : never : never :
    F extends { type: "timestamp" } ? z.ZodString :
    F extends { type: "date" } ? z.ZodString :
    F extends { type: "time" } ? z.ZodString :
    F extends { type: "number" } ? z.ZodNumber :
    F extends { type: "boolean" } ? z.ZodBoolean :
    F extends { type: "array"; itemDefinition: infer I } ? I extends EntityFieldDefinition ? z.ZodArray<EntityFieldType<I>> : never :
    F extends { type: "object"; schemaDefinition: infer S } ? S extends EntitySchemaDefinition ? z.ZodObject<SchemaShape<S>> : never :
    F extends { type: "union"; fieldDefinitions: infer Defs }
    ? Defs extends readonly EntityFieldDefinition[]
    ? UnionElementTypes<Defs> extends infer M extends readonly z.ZodType[]
    ? z.ZodUnion<M>
    : never
    : never :
    F extends { type: "null" } ? z.ZodNull :
    F extends { type: "undefined" } ? z.ZodUndefined :
    never;

export type UnionElementTypes<Defs extends readonly EntityFieldDefinition[]> = {
    [K in keyof Defs]: Defs[K] extends EntityFieldDefinition
    ? EntityFieldType<Defs[K]>
    : never;
};

export type WrapModifiers<F extends EntityFieldDefinition, B extends z.ZodType> =
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

export type SchemaShape<S extends EntitySchemaDefinition> = {
    [K in keyof S]: EntityFieldType<S[K]>;
};

export type ValidateRelations<S> = {
    [K in keyof S]: S[K] extends { type: "relation"; schemaDefinition: infer R; key: infer KK }
    ? R extends EntitySchemaDefinition
    ? KK extends keyof R
    ? S[K]
    : Omit<S[K], "key"> & { key: keyof R }
    : S[K]
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

export type PersistableSchemaConfig<T extends string> =
    { tableName: T } | { tableNames: readonly T[] };

export const createSchema = <
    const T extends string,
    const S extends PersistableEntitySchemaDefinition<T> & ValidateRelations<S>,
>(
    config: PersistableSchemaConfig<T>,
    definition: S & ExactPersistableDefinition<S, T>,
): { definition: S; schema: ZodObject<SchemaShape<S>>; config: PersistableSchemaConfig<T> } => {
    const shape = Object.fromEntries(
        Object.entries(definition).map(([key, value]) => [key, createSchemaField(value)])
    ) as unknown as SchemaShape<S>;

    return {
        definition: definition as S,
        schema: z.object(shape),
        config,
    } as const;
};