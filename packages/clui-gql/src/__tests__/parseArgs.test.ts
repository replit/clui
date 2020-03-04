import parseArgs from '../parseArgs';
import { IGQLCommand } from '../types';

const root = { outputType: '', path: [] };

test('parseArgs', () => {
  const command: IGQLCommand = {
    outputType: '',
    path: [],
    args: {
      role: {
        name: 'role',
        type: 'string',
        graphql: { kind: 'SCALAR', list: false },
      },
      'unread-count': {
        name: 'unreadCount',
        type: 'int',
        graphql: { kind: 'SCALAR', list: false },
      },
      amount: {
        name: 'amount',
        type: 'float',
        graphql: { kind: 'SCALAR', list: false },
      },
      force: {
        name: 'force',
        type: 'boolean',
        graphql: { kind: 'SCALAR', list: false },
      },
      info: {
        name: 'info',
        type: 'boolean',
        graphql: { kind: 'SCALAR', list: false },
      },
      time: {
        name: 'time',
        type: 'float',
        graphql: { kind: 'SCALAR', list: false },
      },
      output: {
        name: 'output',
        type: 'string',
        graphql: { kind: 'SCALAR', list: false },
      },
      format: {
        name: 'format',
        type: 'string',
        required: true,
        graphql: { kind: 'SCALAR', list: false },
      },
    },
  };

  const parsed = parseArgs({
    args: {
      role: 'admin',
      unreadCount: '2',
      amount: 0.2,
      force: true,
      info: 0,
      time: '0.1',
    },
    command,
  });

  expect(parsed).toEqual({
    variables: {
      role: 'admin',
      unreadCount: 2,
      amount: 0.2,
      force: true,
      info: true,
      time: 0.1,
    },
    missing: {
      optional: [
        {
          name: 'output',
          type: 'string',
          graphql: { kind: 'SCALAR', list: false },
        },
      ],
      required: [
        {
          name: 'format',
          type: 'string',
          required: true,
          graphql: { kind: 'SCALAR', list: false },
        },
      ],
    },
  });
});

test('no command args', () => {
  const parsed = parseArgs({ args: { name: 'foo' }, command: root });

  expect(parsed).toEqual({
    variables: {},
    missing: {},
    extra: { name: 'foo' },
  });
});
