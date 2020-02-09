# CLUI

[![Run on Repl.it](https://repl.it/badge/github/replit/clui)](https://repl.it/github/replit/clui)

CLUI is a collection of JavaScript libraries for building command-line interfaces with context-aware autocomplete.

## Overview

### `inputState`

The core functionality is an `inputState` object that reruns the and updater function and calls an `onUpdate` function with some data. It's a framework agnostic primitive that can be wrapped by more specific framework or application code (like a react hook).

[more info](/input-state)

### `useInputState`

A basic React hook to manage the lifecycle on an `inputState`. It's more of an example for refrnence. Depending on the use-case you might use your own hook. For example, if you have a loading indicatore and are loading commands asynchronously, you might want to debounce the loading state to reduce UI flicker.

For managing dropdown selection UX I highly recommend [downshift](https://github.com/downshift-js/downshift).

[more info](/use-input-state)

### `<Session />`

`Session` is a React component that manages a list of child components. When buiding a command-line UX with autocomplete, `inputState` can be used to manage possible states as the user is typing and `Session` can be used to manage a list of React components as the user submits inputs (appending output, clearing previous outpu, showing next prompt, etc.).

[more info](/session)
