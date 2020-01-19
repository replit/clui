import { parse } from '../parser';
import { commandPath, getArgs, getNode, getArgContext, argKeys, parseArgs } from '../util';
import { ILocation, INode, IArg, ICommand, ICommands } from '../types';

describe('commandPath', () => {
  ([
    ['user', undefined, [{ start: 0, end: 4, type: 'COMMAND', value: 'user' }]],
    ['user', 1, [{ start: 0, end: 1, type: 'COMMAND', value: 'u' }]],
    ['user', 2, [{ start: 0, end: 2, type: 'COMMAND', value: 'us' }]],
    ['user update', 2, [{ start: 0, end: 2, type: 'COMMAND', value: 'us' }]],
    ['user --a b', 'user --a b'.length, [{ start: 0, end: 4, type: 'COMMAND', value: 'user' }]],
    [
      'user update',
      'user up'.length,
      [
        { start: 0, end: 4, type: 'COMMAND', value: 'user' },
        { start: 5, end: 7, type: 'COMMAND', value: 'up' },
      ],
    ],
    [
      'user update',
      'user update'.length,
      [
        { start: 0, end: 4, type: 'COMMAND', value: 'user' },
        { start: 5, end: 11, type: 'COMMAND', value: 'update' },
      ],
    ],
  ] as Array<[string, number | undefined, Array<INode>]>).forEach(([input, index, expected]) => {
    it(`returns path for "${input}"`, () => {
      expect(commandPath(parse(input), index)).toEqual(expected);
    });
  });
});

describe('getArgs', () => {
  const tests: Array<[string, Record<string, string | true>]> = [
    ['add', {}],
    ['user add', {}],
    ['user add -r', { r: true }],
    ['user add --r', { r: true }],
    ['user add -r admin', { r: 'admin' }],
    ['user add -r "admin"', { r: 'admin' }],
    ['user add -f -r "admin"', { f: true, r: 'admin' }],
    ["user add -f -r 'admin'", { f: true, r: 'admin' }],
    ["user add -f -r 'admin' -p", { f: true, r: 'admin', p: true }],
    ["user add --f --r 'admin'", { f: true, r: 'admin' }],
  ];

  tests.forEach(([command, expected]) => {
    it(`gets args from '${command}'`, () => {
      expect(getArgs(parse(command))).toEqual(expected);
    });
  });
});

describe('getArgContext', () => {
  const root: ICommand = {
    commands: {
      user: {
        args: {
          name: { type: String },
          email: { type: Boolean },
        },
      },
    },
  };
  const user = (root.commands as ICommands).user as ICommand;

  ([
    ['user --name', 'user --name'.length, user.args?.name],
    ['user -name', 'user -name'.length, user.args?.name],
    ['user --name --email', 'user --name --email'.length, user.args?.email],
    ['user --name --email fo', 'user --name --email fo'.length, user.args?.email],
    ['user --na', 'user --na'.length, undefined],
    ['user', 'user'.length, undefined],
  ] as Array<[string, number, IArg | undefined]>).forEach(([input, index, expected]) => {
    it('gets arg context', () => {
      expect(getArgContext({ index, command: user, ast: parse(input) })).toEqual(expected);
    });
  });
});

describe('getNode', () => {
  const first: INode = { start: 0, end: 3, type: 'COMMAND', value: '123' };
  const second: INode = { start: 3, end: 8, type: 'COMMAND', value: '4567' };
  const third: INode = { start: 8, end: 12, type: 'COMMAND', value: '8910' };

  const nodes = [first, second, third];

  const table: Array<[number, ILocation | undefined]> = [
    [0, first],
    [2, first],
    [3, second],
    [7, second],
    [8, third],
    [11, third],
    [12, undefined],
  ];

  table.forEach(([index, expected]) => {
    it(`gets node at index: ${index}`, () => {
      expect(getNode(nodes, index)).toEqual(expected);
    });
  });
});

describe('argKeys', () => {
  ([
    ['user --name', 'user --name'.length, ['--name']],
    ['user --name', 'user '.length, []],
    ['user --name foo --email', 'user '.length, []],
    ['user --name foo --email', 'user --name foo --email'.length, ['--name', '--email']],
    ['user --name foo --email', 'user --name fo'.length, ['--name']],
  ] as Array<[string, number, IArg | undefined]>).forEach(([input, index, expected]) => {
    it(`gets arg keys at index: ${index}`, () => {
      expect(argKeys(parse(input), index)).toEqual(expected);
    });
  });
});

describe('parseArgs', () => {
  const command = {
    args: {
      name: {},
      email: { type: String },
      count: { type: Number },
      verbose: { type: Boolean },
    },
  };

  ([
    ['name', 'foo', 'foo'],
    ['name', true, undefined],
    ['email', 'foo', 'foo'],
    ['count', 1, 1],
    ['count', '1', 1],
    ['verbose', '1', true],
    ['verbose', true, true],
  ] as Array<[string, any, any]>).forEach(([key, input, output]) => {
    it('parses args', () => {
      const parsed = parseArgs({ command, args: { [key]: input } });
      expect(parsed[key]).toEqual(output);
    });
  });
});
