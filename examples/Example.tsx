import React from 'react';
import Downshift from 'downshift';
import { ICommand, ISuggestion } from '../src/input/types';

import { useInputState } from '../src';

// const useAfterUpdate = () => {
// const after = React.useRef<() => void | null>(null);

// React.useLayoutEffect(() => {
// if (after.current) {
// after.current();
// after.current = null;
// }
// });

// const runAtfer = (fn: () => void) => {
// after.current = fn;
// };

// return runAtfer;
// };

const addRoleCmd: ICommand = {
  name: 'add-role',
  description: 'Add role to user',
  args: {
    user: { name: 'user', description: 'username, id, or email' },
    role: { name: 'role', description: 'the role', options: ['admin', 'moderator'] },
  },
  run: (props) => (
    <pre>
      <code>{JSON.stringify(props, null, 2)}</code>
    </pre>
  ),
};

const removeRoleCmd: ICommand = {
  name: 'remove-role',
  description: 'Remove role from user',
  args: {
    user: { name: 'user', description: 'username, id, or email' },
    role: { name: 'role', description: 'the role', options: ['admin', 'moderator'] },
  },
  run: (props) => (
    <pre>
      <code>{JSON.stringify(props, null, 2)}</code>
    </pre>
  ),
};

const userCmd: ICommand = {
  name: 'user',
  description: 'User commands',
  args: { help: { name: 'help', description: 'Show help' } },
  run: (props) => (
    <pre>
      <code>{JSON.stringify(props, null, 2)}</code>
    </pre>
  ),
  commands: { addRoleCmd, removeRoleCmd },
};

const Prompt = () => {
  const cmds: Record<string, ICommand> = { user: userCmd, post: userCmd };
  const [state, update] = useInputState(cmds);

  const onKeyUp = React.useCallback(
    (e) => {
      const index = e.target.selectionStart;
      if (state.index !== index) {
        update({ index });
      }
    },
    [state.index],
  );

  return (
    <Downshift
      inputValue={state.value}
      initialHighlightedIndex={0}
      defaultHighlightedIndex={0}
      onChange={(selection: ISuggestion) => {
        if (selection) {
          update({ value: `${selection.inputValue} `, index: selection.cursorTarget + 1 });
        }
        // TODO: update cursor position to cursorTarget
      }}
      itemToString={() => state.value}
    >
      {(ds) => (
        <div className="container">
          <div className="input-container">
            <input
              {...ds.getInputProps({
                autoFocus: true,
                spellCheck: false,
                placeholder: 'type a command',
                onFocus: () => {
                  ds.openMenu();
                },
                onKeyUp,
                onChange: ({ target }) => {
                  update({ value: target.value, index: target.selectionStart });
                },
              })}
            />
            <div className="menu-anchor">
              <div className="menu">
                <div className="menu-offset">{state.value.slice(0, state.index)}</div>
                <ul {...ds.getMenuProps({ style: { listStyle: 'none', margin: 0, padding: 0 } })}>
                  {state.suggestions.length
                    ? state.suggestions.map((item, index) => (
                        <li
                          className={ds.highlightedIndex === index ? 'highlighted' : undefined}
                          {...ds.getItemProps({
                            key: item.value,
                            index,
                            item,
                          })}
                        >
                          {item.value}
                        </li>
                      ))
                    : null}
                </ul>
              </div>
            </div>
          </div>
          {!true && (
            <>
              <pre style={{ fontSize: 10 }}>
                <code>{JSON.stringify({ suggestions: state.suggestions }, null, 2)}</code>
              </pre>
              <pre>
                <br />
                <br />
                <code>{JSON.stringify(state, null, 2)}</code>
              </pre>
            </>
          )}
          <style jsx>
            {`
              input {
                background-color: transparent;
                border: 0 none;
                padding: 5px 0;
                display: block;
                width: 100%;
              }

              input:focus {
                outline: 0 none;
              }

              input,
              input::placeholder {
                color: inherit;
              }

              input,
              .menu-offset {
                font-size: 18px;
                font-family: 'IBM Plex Sans Condensed', sans-serif;
                font-family: 'IBM Plex Mono', monospace;
              }

              .menu {
                display: flex;
              }

              .menu-offset {
                flex: 0 0 auto;
                white-space: pre;
              }

              ul {
                padding: 0;
                list-style: none;
                background-color: rgba(255, 255, 255, 0.2);
              }

              .highlighted {
                background-color: rgba(255, 255, 255, 0.4);
              }
            `}
          </style>
        </div>
      )}
    </Downshift>
  );
};

const Example = () => (
  <div>
    <Prompt />
    <style jsx>
      {`
        div {
          padding: 10px;
          color: white;
          background-color: black;
          font-family: 'IBM Plex Sans', sans-serif;
        }
      `}
    </style>
  </div>
);

export default Example;
