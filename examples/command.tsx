import React, { useEffect } from 'react';
import { ISessionItemProps, ICommand, IRunOptions, SubCommands } from '../src';

interface IProps extends ISessionItemProps, IRunOptions {}

const Run = (props: IProps) => {
  useEffect(() => {
    if (props.item) {
      props.item.next();
    }
  }, []);

  return (
    <pre style={{ fontSize: 10 }}>
      <code>{JSON.stringify(props, null, 2)}</code>
    </pre>
  );
};

interface IAppCommand extends ICommand {
  description?: string;
  commands?: SubCommands<IAppCommand>;
}

const help: IAppCommand = {
  description: 'Show help info',
  args: {
    verbose: {
      type: Boolean,
    },
    subCommands: {
      options: (filter?: string) => {
        const res = [{ value: 'sub1' }, { value: 'sub2' }];

        if (!filter) {
          return res;
        }

        return res.filter((o) => o.value.includes(filter));
      },
    },
    related: {
      options: async (filter?: string) => {
        const res = [{ value: 'rel1' }, { value: 'rel2' }];

        if (!filter) {
          return res;
        }

        return res.filter((o) => o.value.includes(filter));
      },
    },
  },
  run: (args) => <Run {...args} />,
};

const weather: IAppCommand = {
  run: (props) => <Run {...props} />,
  commands: async (value: string): Promise<Record<string, IAppCommand>> => {
    if (value && value.startsWith('fo')) {
      return {
        foo: {
          args: {
            wat: {},
          },
          commands: async (value2: string): Promise<Record<string, IAppCommand>> => ({
            baz: {
              description: 'baz',
            },
            [value2 || 'ss']: {},
            aaa: {},
          }),
        },
        bar: {
          description: 'bar',
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
};

const makeCommands = (depth: number) => async (__: any): Promise<Record<string, IAppCommand>> => {
  const ret: Record<string, IAppCommand> = {};

  [...Array(depth)].forEach((_, index) => {
    ret[`depth:${depth}:${index}`] = {
      commands: makeCommands(depth + 1),
    };
  });

  return ret;
};

const depth: IAppCommand = {
  commands: makeCommands(1),
};

const root: IAppCommand = {
  description: 'Root command',
  commands: {
    help,
    weather,
    depth,
  },
  run: (args) => <Run {...args} />,
};

export default root;
