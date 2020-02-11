import fs from 'fs';
import path from 'path';
import { graphql, buildSchema } from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';

const schema = buildSchema(
  fs.readFileSync(path.resolve(__dirname, './schema.graphql'), 'utf8'),
);

const queryStr = fs.readFileSync(
  path.resolve(__dirname, '../graphqlTypes.graphql'),
  'utf8',
);

export const query = async <D>(variables?: Maybe<{ [key: string]: any }>) => {
  const { data, errors } = await graphql<D>({
    schema,
    source: queryStr,
    variableValues: variables,
  });
  if (errors) {
    throw errors;
  }

  return data;
};
