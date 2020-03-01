import fs from 'fs';
import path from 'path';
import { buildSchema, introspectionFromSchema } from 'graphql';

const schema = buildSchema(
  fs.readFileSync(path.resolve(__dirname, './schema.graphql'), 'utf8'),
);

export const introspection = introspectionFromSchema(schema);
