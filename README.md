# CLUI

[![Run on Repl.it](https://repl.it/badge/github/replit/clui)](https://repl.it/github/replit/clui)

CLUI is a collection of JavaScript libraries for building command-line interfaces with context-aware autocomplete.

## Packages

### `@replit/clui-input`

`@replit/clui-input` implementes the logic for mapping text input to suggestions and a potential `run` function.

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

When the input matches a command with a `run` function, the `onUpdate` callback will include a refrence to it.

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

`@replit/clui-session` implementes the logic for rendering a list of react children. For building a CLI-style interfaces this can be useful for adding and removing lines when the prompt is submitted.

```jsx
import React from 'react'
import { render } from 'react-dom'
import Session, { Do } from '@replit/clui-session';

/* `Do` is helper that exposes the `item` prop
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

`@replit/clui-gql` is a small utility that transforms [GraphQL introspection](https://graphql.org/learn/introspection) data for a type into commands.

#### Install

```sh
npm install @replit/clui-gql
```

#### Usage

```js
import { toCommand } from '@replit/clui-gql';

const command = toCommand({
  // 'query' or 'mutation'
  operation: 'query',

  // GraphQL introspection data for type
  type: TypeInfo,

  // the path at wich the above type appears in the graph
  mountPath: ['cli', 'admin'],

  // Return a `run` function for given command
  runFn: (gqlOptions) => (runOptions) => doSomehtingWith({ gqlOptions, runOptions }),

  // Configure fields and fragments for GraphQL operation
  outputFn: () => ({
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
```
