import React, { useEffect } from 'react';
import { ISessionItemProps, ICommand, IRunOptions } from '../src';

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

const commands: Record<string, ICommand> = {
  todo: {
    run: (props) => <Run {...props} />,
    commands: {
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
    run: (props) => <Run {...props} />,
    options: async () =>
      new Promise((resolve) => {
        setTimeout(
          () =>
            resolve([
              { value: 'NYC' },
              { value: 'DEN' },
              { value: 'SFO' },
              { value: 'WASH' },
              { value: 'ORL' },
            ]),
          300,
        );
      }),
    args: {
      zipcode: {
        type: String,
        required: true,
      },
    },
  },
};

export default { commands };
