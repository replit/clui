import React, { useRef } from 'react';
import { inputState } from '../src';

interface IProps {
  value?: string;
  index?: number;
}

// eslint-disable-next-line
const run = (args: any) => window.alert(`ran with args: ${JSON.stringify(args, null, 2)}`);

const root = {
  commands: {
    user: {
      commands: {
        create: {
          args: {
            email: {},
            name: {},
          },
          run,
        },
        read: {
          args: {
            id: {},
          },
          run,
        },
        update: {
          args: {
            id: {},
            email: {},
            name: {},
          },
          run,
        },
        destroy: {
          args: {
            id: {},
          },
          run,
        },
      },
    },
    help: {},
  },
};

export const InputState = (props: IProps) => {
  const [value, setValue] = React.useState(props.value || '');
  const [state, setState] = React.useState(null);

  const input = useRef(null);

  if (!input.current) {
    input.current = inputState({
      command: root,
      onUpdate: setState,
      index: value.length,
      value,
    });
  }

  React.useEffect(() => {
    if (input.current) {
      input.current({ value });
    }
  }, [value]);

  if (!state) {
    return null;
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (state.run) {
            state.run();
          }
        }}
      >
        <input
          style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box' }}
          placeholder="type command (user create, user update, help, etc.)"
          value={value}
          onKeyUp={(e) => {
            if (input.current) {
              input.current({ index: e.currentTarget.selectionStart });
            }
          }}
          onChange={(e) => setValue(e.target.value)}
        />
        <div>Suggestions</div>
        <ul>
          {state.options.map(({ data: __, ...o }) => (
            <li key={o.value}>
              <pre style={{ fontSize: 12 }}>
                <code>{JSON.stringify(o, null, 2)}</code>
              </pre>
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
};
