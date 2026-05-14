import z from "zod";
import { createParsableSchema } from "./parsableSchema";

const {
    definition: businessUnitSchemaDefinition,
    schema: businessUnitSchema,
} = createParsableSchema(
    {
        tableName: "business_units",
    },
    {
        businessUnit: {
            position: 1,
            type: "enum",
            values: [1, 2, 3],
        },
        stringBusinessUnit: {
            position: 2,
            type: "enum",
            values: ["1", "2", "3"],
        },
    });
type BusinessUnitSchemaTypeSchema = typeof businessUnitSchema;
type BusinessUnitSchemaType = z.infer<typeof businessUnitSchema>;

const {
    definition: schemaDefinition,
    schema: schemaResult,
} = createParsableSchema(
    {
        tableNames: ["main", "details"]
    },
    {
        field0: {
            position: 1,
            type: "string",
            length: 100,
        },
        businessUnit: {
            position: 1,
            type: "relation",
            schemaDefinition: businessUnitSchemaDefinition,
            key: "businessUnit",
        },
        field1: {
            tableName: "details",
            position: 1,
            type: "enum",
            values: ["1", "2", "3"],
        },
        field2: {
            tableName: "details",
            position: 1,
            type: "enum",
            values: [1, 2, 3],
        },
        field3: {
            tableName: "details",
            position: 1,
            type: "array",
            itemDefinition: {
                type: "boolean",
            },
        },
        field4: {
            tableName: "details",
            position: 1,
            type: "object",
            isOptional: true,
            schemaDefinition: {
                objectField1: {
                    type: "boolean",
                    isNullable: true,
                },
                objectField2: {
                    type: "object",
                    schemaDefinition: {
                        objectField21: {
                            type: "boolean",
                        },
                    },
                },
            },
        },
        field5: {
            position: 1,
            type: "union",
            fieldDefinitions: [
                {
                    type: "string",
                    length: "max",
                },
                {
                    type: "number",
                    subType: "integer",
                },
            ],
        },
    }
);

type SchemaTypeSchema = typeof schemaResult;
type SchemaType = z.infer<typeof schemaResult>;
