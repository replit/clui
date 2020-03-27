# CLUI GraphQL

`@replit/clui-gql` is a utility libray for building [CLUI](https://github.com/replit/clui) commands from [GraphQL introspection](https://graphql.org/learn/introspection) data.

## Install

```sh
npm install @replit/clui-gql
```

## Usage

To create a tree of CLUI commands call `toCommand` and then call `forEach` to defined a run function for each command.

```jsx
import { toCommand, forEach } from '@replit/clui-gql';
import { introspectionFromSchema } from 'graphql';
import schema from './your-graphql-schema';

// on server
const introspection = introspectionFromSchema(schema);

// on client
const introspection = makeNetworkRequestForData();

// Create a command tree from graphql introspection data. This could be done on
// the server or the client.
const root = toCommand({
  // 'query' or 'mutation'
  operation: 'query',

  // The name of the graphql type that has the fields that act as top level commands
  rootTypeName: 'CluiCommands'

  // the path at which the above type appears in the graph
  mountPath: ['cli', 'admin'],

  // GraphQL introspection data
  introspectionSchema: introspection.__schema,

  // Configure fields and fragments for the output of the GraphQL operation string
  output: () => ({
    fields: '...Output',
    fragments: `
      fragment Output on YourOutputTypes {
        ...on SuccessOutput {
          message
        }
        ...on ErrorOutput {
          error
        }
      }`,
  }),
});

// Define some application specific behavior for when a command is `run`
forEach(root, ({ command }) => {
  if (command.outputType !== 'YourOutputTypes') {
    // If command does not match an output type you may want do something differeny.
    By omitting the run function the command acts as a namespace for sub-commands.
    return;
  }

  command.run = (options) => {
    return <OutputView command={command} options={options} />
  }
}
```

'parseArgs' is a helper for working with args

```jsx
import { parse } from 'graphql';
import { parseArgs } from '@replit/clui-gql';

const OutputView = (props) => {
  // CLIU command generated from graphql
  const { command } = props;

  // CLUI args
  const { args } = props.options;

  const parsed = parseArgs({ command, args });

  // Handle state for submitting command based on parsed args

  if (parsed.missing.required) {
    return <HandleMissingArgs />;
  }

  if (parsed.missing.optional) {
    return <PotentiallyShowOptinalInputs />;
  }

  if (command.query) {
    graphQLClient.query(parse(command.query), { variables: parsed.variables })
  } else if (command.mutation) {
    graphQLClient.mutate(parse(command.mutation), { variables: parsed.variables })
  }

  // ...render UI to communicate above state
}

```
