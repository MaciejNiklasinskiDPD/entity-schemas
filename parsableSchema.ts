import z, { ZodObject, ZodType } from "zod";
import { CrossIntersect } from "./helpers";
import {
    BaseEntityFieldDefinition,
    createSchemaField,
    EntityFieldDefinition,
    EntityFieldType,
    EntityFieldVariant,
    ExactField,
    PersistableEntitySchemaDefinition,
    PersistableEntityFieldConfig,
    PersistableSchemaConfig,
    ValidateRelations,
} from "./schema";

export type DataParsableEntityFieldDefinition = {
    source?: "data",
    position: number,
};

export type AttributeParsableEntityFieldDefinition = {
    source: "attribute",
    attribute: string,
};

export type KeyParsableEntityFieldDefinition = {
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

export type ParsableEntityFieldDefinition =
    EntityFieldDefinition & (
        DataParsableEntityFieldDefinition
        | AttributeParsableEntityFieldDefinition
        | KeyParsableEntityFieldDefinition
    );


export type ParsableEntitySchemaDefinition = {
    [k: string]: ParsableEntityFieldDefinition;
};

type ParsableSourceVariant =
    | DataParsableEntityFieldDefinition
    | AttributeParsableEntityFieldDefinition
    | KeyParsableEntityFieldDefinition;

type FlatParsableFieldVariant<T extends string> =
    CrossIntersect<
        CrossIntersect<EntityFieldVariant, ParsableSourceVariant>,
        BaseEntityFieldDefinition & PersistableEntityFieldConfig<T>
    >;

type ExactParsableDefinition<S, T extends string> = {
    [K in keyof S]: ExactField<S[K], FlatParsableFieldVariant<T>>;
};

type ParsableSchemaShape<S extends ParsableEntitySchemaDefinition> = {
    [K in keyof S]: EntityFieldType<S[K]>;
};

// THIS IS NOT CURRENTLY IMPLEMENTED AT ALL
// TODO implement correct metadata mapping
const createParsableSchemaField = (fieldDefinition: ParsableEntityFieldDefinition): ZodType => {
    let field: ZodType = createSchemaField(fieldDefinition);

    // TODO add metadata based on parsable field properties

    return field;
};

export type ParsableSchemaConfig<T extends string> = {
    // TODO add specific requirements for parsable config here    
} & PersistableSchemaConfig<T>;

export const createParsableSchema = <
    const T extends string,
    const S extends ParsableEntitySchemaDefinition & PersistableEntitySchemaDefinition<T> & ValidateRelations<S>,
>(
    config: ParsableSchemaConfig<T>,
    definition: S & ExactParsableDefinition<S, T>,
): { definition: S; schema: ZodObject<ParsableSchemaShape<S>>; config: ParsableSchemaConfig<T> } => {
    const shape = Object.fromEntries(
        Object.entries(definition).map(([key, value]) => [key, createParsableSchemaField(value)])
    ) as unknown as ParsableSchemaShape<S>;

    return {
        definition: definition as S,
        schema: z.object(shape),
        config,
    } as const;
};