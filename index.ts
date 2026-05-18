import { createEntitySchema } from "./createEntityConfig";
import { schema } from "./entity";


const entitySchema = createEntitySchema(schema, {
    field1: { length: 100, position: 1 },
    field2: { dbType: "INT64", position: 2 },
});

console.log(entitySchema);