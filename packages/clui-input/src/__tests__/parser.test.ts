import { IArgNode, IArgFlagNode } from '../ast';
import { parse } from '../parser';
import { ICommand } from '../types';

describe('command parsing', () => {
  const root: ICommand = {
    commands: {
      user: {
        commands: {
          add: {},
        },
      },
    },
  };

  it('parses subcommand', () => {
    const ast = parse('user add', root);

    if (typeof root.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.command?.ref).toEqual(root.commands.user);
    expect(ast.command?.kind).toEqual('COMMAND');
    expect(ast.command?.token).toEqual({
      value: 'user',
      kind: 'KEYWORD',
      start: 0,
      end: 4,
    });

    if (typeof root.commands.user.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.command?.command?.kind).toEqual('COMMAND');
    expect(ast.command?.command?.ref).toEqual(root.commands.user.commands.add);
    expect(ast.command?.command?.parent).toEqual(ast.command);
    expect(ast.command?.command?.token).toEqual({
      value: 'add',
      kind: 'KEYWORD',
      start: 5,
      end: 8,
    });
  });

  it('parses command', () => {
    const ast = parse('user', root);

    if (typeof root.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.command?.command).toBe(undefined);
    expect(ast.command?.ref).toEqual(root.commands.user);
    expect(ast.command?.token).toEqual({
      value: 'user',
      kind: 'KEYWORD',
      start: 0,
      end: 4,
    });
  });
});

describe('arg parsing', () => {
  const root: ICommand = {
    commands: {
      user: {
        args: {
          info: {
            type: 'boolean',
          },
          name: {
            type: 'string',
          },
        },
      },
    },
  };

  it('parses string flag', () => {
    const ast = parse('user --name foo', root);

    if (typeof root.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.command?.ref).toEqual(root.commands.user);
    expect(ast.command?.token).toEqual({
      value: 'user',
      kind: 'KEYWORD',
      start: 0,
      end: 4,
    });

    if (!ast.command?.args) {
      throw Error('expected args');
    }

    const arg = ast.command?.args[0] as IArgNode;

    expect(arg.kind).toEqual('ARG');
    expect(arg.key.kind).toEqual('ARG_KEY');
    expect(arg.value?.kind).toEqual('ARG_VALUE');
    expect(arg.parent).toEqual(ast.command);
    expect(arg.key.parent).toEqual(arg);
    expect(arg?.value?.parent).toEqual(arg);

    expect(arg?.key.token).toEqual({
      kind: 'KEYWORD',
      value: '--name',
      start: 5,
      end: 11,
    });

    expect(arg?.value?.token).toEqual({
      kind: 'KEYWORD',
      value: 'foo',
      start: 12,
      end: 15,
    });
  });

  it('parses boolean flag', () => {
    const ast = parse('user --info', root);

    if (typeof root.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.command?.ref).toEqual(root.commands.user);
    expect(ast.command?.token).toEqual({
      value: 'user',
      kind: 'KEYWORD',
      start: 0,
      end: 4,
    });

    if (!ast.command?.args) {
      throw Error('expected args');
    }

    const arg = ast.command?.args[0] as IArgFlagNode;

    expect(arg.parent).toEqual(ast.command);
    expect(arg.kind).toEqual('ARG_FLAG');
    expect(arg?.token).toEqual({
      kind: 'KEYWORD',
      value: '--info',
      start: 5,
      end: 11,
    });
  });

  it('parses string and boolean flag', () => {
    const ast = parse('user --info --name foo', root);

    if (typeof root.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.command?.ref).toEqual(root.commands.user);
    expect(ast.command?.token).toEqual({
      value: 'user',
      kind: 'KEYWORD',
      start: 0,
      end: 4,
    });

    if (!ast.command?.args) {
      throw Error('expected args');
    }

    const boolArg = ast.command?.args[0] as IArgFlagNode;
    const stringArg = ast.command?.args[1] as IArgNode;

    expect(stringArg.parent).toEqual(ast.command);
    expect(stringArg.kind).toEqual('ARG');
    expect(stringArg?.key.parent).toEqual(stringArg);
    expect(stringArg?.key.kind).toEqual('ARG_KEY');

    expect(stringArg?.key.token).toEqual({
      kind: 'KEYWORD',
      value: '--name',
      start: 12,
      end: 18,
    });

    expect(stringArg?.value?.kind).toEqual('ARG_VALUE');
    expect(stringArg?.value?.token).toEqual({
      kind: 'KEYWORD',
      value: 'foo',
      start: 19,
      end: 22,
    });

    expect(boolArg.parent).toEqual(ast.command);
    expect(boolArg.kind).toEqual('ARG_FLAG');

    expect(boolArg?.token).toEqual({
      kind: 'KEYWORD',
      value: '--info',
      start: 5,
      end: 11,
    });
  });
});

describe('pending commands', () => {
  const root: ICommand = {
    commands: {
      user: {
        args: {
          info: {},
          name: {
            type: 'string',
          },
        },
        commands: async () => ({
          add: {},
        }),
      },
    },
  };

  it('returns pending for command', () => {
    const resolved = { user: {} };
    const program = { commands: async () => resolved };
    const ast = parse('us', program);

    expect(ast.pending?.resolve).toEqual(program.commands);
    expect(ast.pending?.key).toEqual('us');

    expect(ast.pending?.token).toEqual({
      value: 'us',
      kind: 'KEYWORD',
      start: 0,
      end: 2,
    });
  });

  it('returns pending for subcommand', () => {
    const ast = parse('user add', root);

    if (typeof root.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.pending?.resolve).toEqual(root.commands.user.commands);
    expect(ast.pending?.key).toEqual('user add');

    expect(ast.pending?.token).toEqual({
      value: 'add',
      kind: 'KEYWORD',
      start: 5,
      end: 8,
    });
  });

  it('returns pending for partrial subcommand', () => {
    const ast = parse('user a', root);

    if (typeof root.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.pending?.resolve).toEqual(root.commands.user.commands);
    expect(ast.pending?.key).toEqual('user a');

    expect(ast.pending?.token).toEqual({
      value: 'a',
      kind: 'KEYWORD',
      start: 5,
      end: 6,
    });
  });
});

describe('remainder', () => {
  const root: ICommand = {
    commands: {
      user: {
        args: {
          info: {},
          name: {
            type: 'string',
          },
        },
        commands: {
          add: {},
        },
      },
    },
  };

  it('returns remainder for command', () => {
    const ast = parse('us', root);
    expect(ast.remainder?.cmdNodeCtx?.ref).toEqual(root);
    expect(ast.remainder?.token).toEqual({
      value: 'us',
      kind: 'KEYWORD',
      start: 0,
      end: 2,
    });
  });

  it('returns remainder for sub command', () => {
    const ast = parse('user a', root);

    if (typeof root.commands !== 'object') {
      throw new Error('Expected object');
    }

    expect(ast.remainder?.cmdNodeCtx?.ref).toEqual(root.commands.user);
    expect(ast.remainder?.cmdNodeCtx?.token).toEqual({
      value: 'user',
      kind: 'KEYWORD',
      start: 0,
      end: 4,
    });

    expect(ast.remainder?.token).toEqual({
      value: 'a',
      kind: 'KEYWORD',
      start: 5,
      end: 6,
    });
  });
});
