# CLUI

CLUI is a collection of JavaScript libraries for building command-line interfaces with context-aware autocomplete.

[See Demo](https://repl.it/@clui/demo)

## Packages

### `@replit/clui-input`

`@replit/clui-input` implements the logic for mapping text input to suggestions and a potential `run` function.

```jsx
import input from '@replit/clui-input';

const rootCommand = {
  commands: {
    open: {
      commands: {
        sesame: {
          run: (args) => {
            /* do something */
          },
        },
      },
    },
  },
};

const update = input({
  command: rootCommand,
  onUpdate: (updates) => {
    /* Update #1: `updates.options` will be
     * [
     *   {
     *     "value": "open",
     *     "inputValue": "open",
     *     "searchValue": "o",
     *     "cursorTarget": 4
     *   }
     * ]
     */

    /* Update #2: `updates.options` will be
     * [
     *   {
     *     "value": "sesame",
     *     "inputValue": "open sesame",
     *     "searchValue": "s",
     *     "cursorTarget": 12
     *   }
     * ]
     */
  },
});

/* Update #1 */
update({ value: 'o', index: 1 });

/* Update #2 */
update({ value: 'open s', index: 6 });
```

When the input matches a command with a `run` function, the `onUpdate` callback will include a reference to it.

```jsx
const update = input({
  command: rootCommand,
  onUpdate: (updates) => {
    // call or store reference to `updates.run` based on user interaction
  },
});

update({ value: 'open sesame', index: 6 });
```

`@replit/clui-input` a framework agnostic primitive that can be wrapped by more specific framework or application code (like a react hook). If using react you will most likey want to keep the result of `onUpdate` in a state object. For managing dropdown selection UX I highly recommend [downshift](https://github.com/downshift-js/downshift).

### `@replit/clui-session`

`@replit/clui-session` implements the logic for rendering a list of react children. For building a CLI-style interfaces this can be useful for adding and removing lines when the prompt is submitted.

```jsx
import React from 'react'
import { render } from 'react-dom'
import Session, { Do } from '@replit/clui-session';

/* `Do` is a helper that exposes the `item` prop
 * You will most likey render your own component
 * which will get `item` injected as a prop so 
 * that component can call `item.next` based
 * on specific application logic
 */
render(
  <Session>
    <Do>
      {item => <button onClick={item.next}>next 1</button>}
    </Do>
    <Do>
      {item => <button onClick={item.next}>next 2</button>}
    </Do>
    <Do>
      {item => <button onClick={item.next}>next 3</button>}
    </Do>
  </Session>,
  document.getElementById('root'),
);
```

### `@replit/clui-gql`

`@replit/clui-gql` is a utility library for building [CLUI](https://github.com/replit/clui) commands from [GraphQL introspection](https://graphql.org/learn/introspection) data.

## Install

```sh
npm install @replit/clui-gql
```

## Usage

To create a tree of CLUI commands call `toCommand` and then `visit` each command to define a run function.

```jsx
import { toCommand, visit } from '@replit/clui-gql';
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
visit(root, (command) => {
  if (command.outputType !== 'YourOutputTypes') {
    // If command does not match an output type you may want do something different.
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

  // ...some component to communicate above state
}

```
