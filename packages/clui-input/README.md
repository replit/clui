# CLUI Input

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
