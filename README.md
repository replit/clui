# CLUI

CLUI is a collection of JavaScript libraries for building command-driven interfaces with context-aware autocomplete.

## Install

This package is an iteration on a previous implementation. It is currently published as a beta. To install it use the `next` tag.

```sh
npm install @replit/clui@next
```

## Usage

The core logic is a framework agnostic utility that searches a tree of commands for possible matches based on a value. Each command has `data` associated with it. This functionality can be used as the building blocks for building command-driven interfaces with autocomplete suggestions. Below is a basic example of how it works.

```typescript
import { 
  Command,
  ScoredMatchResult, 
  simpleMatch,
} from '@replit/clui';

// Define a command's data type
interface Data {
  label: string;
}

type MatchResult = ScoredMatchResult;
type CommandTree = Command<Data, MatchResult>;

// Create the root command and define some child and grandchild commands
// with the `commands` key (this key can also be an async function to produce 
// dynamic trees).
const root: CommandTree = {
  data: {
    label: 'Parent',
  },
  commands: {
    child1: {
      data: {
        label: 'Child 1',
      },
      commands: {
        grandchild1: {
          data: {
            label: 'Grandchild 1',
          },
        },
        grandchild2: {
          data: {
            label: 'Grandchild 2',
          },
        },
      },
    },
    child2: {
      data: {
        label: 'Child 2',
      },
      commands: {
        grandchild1: {
          data: {
            label: 'Grandchild 1',
          },
        },
        grandchild2: {
          data: {
            label: 'Grandchild 2',
          },
        },
      },
    },
  },
};

// Create a completer instance
const update = createCompleter<Data, MatchResult>({
  root,
  // Define the default match function to control how commands are searched for.
  // Indidual commands can define their own version of this function to // override 
  // this. Here we're searching against the `label` key of the commands `data`.
  matchOption: (params) => simpleMatch(params.data.label, params),
  onUpdate: (updates) => {
    // `updates.options` will contain data for the 3 commands whose `data.label` matches "2" 
    // - "Child 2" (`root.commands.child2`)
    // - "Child1 > Grandchild 2" (`root.commands.child1.commands.grandchild2`)
    // - "Child2 > Grandchild 2" (`root.commands.child2.commands.grandchild2`)
  }
});

// Search for "2". Calls to this function will likely be a result of user input (like typing).
update({ value: '2' });

```

A React hook is also included. See the [demo app](https://github.com/replit/clui/tree/next/src/demo/CommandBar.tsx) for an example of how it's used.

```js
import { useCompleter } from '@replit/clui/react';
```
