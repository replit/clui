import React from 'react';
import { parse, getNode } from '../src/parser';
import { IResult, INode } from '../src/parser/types';
import { getSuggestions } from '../src/prompt/suggestions';
import { ICmd, ISuggestion } from '../src/prompt/types';

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

interface IState {
  value: string;
  cursor: number;
  suggestions?: Array<ISuggestion>;
  ast?: IResult;
  cmds: Record<string, ICmd>;
  currentNode?: INode;
}

type Action = {
  type: 'UPDATE';
  updates: Partial<{ value: string; cursor: number }>;
};

const handleUpdates = (state: IState, updates: Action['updates']) => {
  const ast = updates.value !== undefined ? parse(updates.value) : state.ast;
  const cursor = updates.cursor !== undefined ? updates.cursor : state.cursor;
  const suggestions = getSuggestions({ ast, cmds: state.cmds, index: cursor });
  const currentNode = getNode(ast.result.value, cursor);

  return {
    ...state,
    ...updates,
    ast,
    suggestions,
    cursor,
    currentNode,
  };
};

const reducer = (state: IState, action: Action) => {
  switch (action.type) {
    case 'UPDATE':
      return handleUpdates(state, action.updates);
    default:
      return state;
  }
};

const Example = () => {
  const cmds: Record<string, ICmd> = { user: userCmd };

  const [state, dispatch] = React.useReducer(reducer, {
    cmds,
    value: '',
    cursor: 0,
    suggestions: getSuggestions({ cmds }),
    ast: parse(''),
  });

  const onKeyUp = React.useCallback(
    (e) => {
      const cursor = e.target.selectionStart;

      if (state.cursor === cursor) {
        return;
      }

      dispatch({
        type: 'UPDATE',
        updates: { cursor },
      });
    },
    [dispatch, state.cursor],
  );
  React.useEffect(() => {
    console.log({ cursor: state.cursor });
  }, [state.cursor]);

  React.useEffect(() => {
    console.log({ value: state.value });
  }, [state.value]);

  React.useEffect(() => {
    console.log({ suggestions: state.suggestions });
  }, [state.suggestions]);

  console.log('render');

  return (
    <div style={{ padding: 40 }}>
      <input
        value={state.value}
        onKeyUp={onKeyUp}
        onChange={(e) => {
          dispatch({
            type: 'UPDATE',
            updates: {
              value: e.target.value,
              cursor: e.target.selectionStart,
            },
          });
        }}
      />
      <pre style={{ fontSize: 10 }}>
        <code>{JSON.stringify({ suggestions: state.suggestions }, null, 2)}</code>
      </pre>
      <br />
      <br />
      <pre style={{ fontSize: 10 }}>
        <code>{JSON.stringify(state, null, 2)}</code>
      </pre>
    </div>
  );
};

export default Example;
