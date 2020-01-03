import React from 'react';
import Downshift from 'downshift';
import { ICmd } from '../src/prompt/types';
import { ISuggestion } from '../src/input';
import useInput from '../src/prompt/useInput';

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

const addRoleCmd: ICmd = {
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

const removeRoleCmd: ICmd = {
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

const userCmd: ICmd = {
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

const Example = () => {
  const cmds: Record<string, ICmd> = { user: userCmd };
  const [state, update] = useInput(cmds);

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
      onChange={(selection: ISuggestion) => {
        update({ value: selection.inputValue, index: selection.cursorTarget });
        // TODO: update cursor position to cursorTarget
      }}
      itemToString={() => state.value}
    >
      {(ds) => (
        <div>
          <div>
            <input
              {...ds.getInputProps({
                onFocus: () => {
                  ds.openMenu();
                },
                onKeyUp,
                onChange: ({ target }) => {
                  update({ value: target.value, index: target.selectionStart });
                },
              })}
            />
          </div>
          <ul {...ds.getMenuProps()}>
            {state.suggestions.length
              ? state.suggestions.map((item, index) => (
                  <li
                    {...ds.getItemProps({
                      key: item.value,
                      index,
                      item,
                      style: {
                        backgroundColor: ds.highlightedIndex === index ? 'lightgray' : 'white',
                        fontWeight: ds.selectedItem === item ? 'bold' : 'normal',
                      },
                    })}
                  >
                    {item.value}
                  </li>
                ))
              : null}
          </ul>
          {true && (
            <>
              <pre style={{ fontSize: 10 }}>
                <code>{JSON.stringify({ suggestions: state.suggestions }, null, 2)}</code>
              </pre>
              <br />
              <br />
              <pre style={{ fontSize: 10 }}>
                <code>{JSON.stringify(state, null, 2)}</code>
              </pre>
            </>
          )}
        </div>
      )}
    </Downshift>
  );
};

export default Example;
