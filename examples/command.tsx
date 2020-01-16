import React, { useEffect } from 'react';
import { ISessionItemProps, ICommand, IRunOptions, ICommands } from '../src';
import { IArgsOption } from '../src/input/types';

interface IProps extends ISessionItemProps, IRunOptions {}

const Run = (props: IProps) => {
  useEffect(() => {
    if (props.item) {
      props.item.next();
    }
  }, []);

  return (
    <pre>
      <code>{JSON.stringify(props, null, 2)}</code>
    </pre>
  );
};

const makeCommands = (depth: number) => async (__: any) => {
  const ret: ICommands = {};

  [...Array(depth)].forEach((_, index) => {
    ret[`depth:${depth}:${index}`] = {
      commands: makeCommands(depth + 1),
    };
  });

  return ret;
};

const commands: Record<string, ICommand> = {
  depth: {
    commands: makeCommands(1),
  },
  todo: {
    run: (props) => <Run {...props} />,
    commands: {
      note: {
        args: {
          place: {
            options: async (s: string): Promise<Array<IArgsOption>> =>
              [{ value: 'foo' }, { value: 'bar' }, { value: 'wat' }].filter((v) =>
                v.value.includes(s),
              ),
          },
        },
      },
      list: {
        run: (props) => <Run {...props} />,
        args: {
          all: {
            type: Boolean,
          },
        },
      },
      new: {
        run: (props) => <Run {...props} />,
        args: {
          text: {
            type: String,
          },
        },
      },
    },
  },
  weather: {
    name: 'weather',
    run: (props) => <Run {...props} />,
    commands: async (value) => {
      if (value && value.startsWith('fo')) {
        return {
          foo: {
            name: 'foo',
            args: {
              wat: {},
            },
            commands: async (value2) => ({
              baz: {
                name: 'baz',
              },
              [value2 || 'ss']: {},
              aaa: {},
            }),
          },
          bar: {
            name: 'bar',
          },
        };
      }

      return new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              nyc: {},
              orl: {},
              sf: {},
            }),
          300,
        );
      });
    },
    args: {
      zipcode: {
        type: String,
        required: true,
      },
    },
  },
};

export default { commands };
