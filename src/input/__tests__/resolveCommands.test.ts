import { ICommand, ICommands } from '../types';
import resolveCommands from '../resolveCommands';
import { parse } from '../parser';

describe('resolveCommands', () => {
  it('resolves async commands', async () => {
    const root = {
      commands: async () =>
        Promise.resolve({
          user: {
            commands: async () =>
              Promise.resolve({
                add: {
                  commands: async () =>
                    Promise.resolve({
                      role: {
                        commands: async () => Promise.resolve({}),
                      },
                    }),
                },
                remove: {
                  commands: async () =>
                    Promise.resolve({
                      role: {
                        commands: async () => Promise.resolve({}),
                      },
                    }),
                },
              }),
          },
        }),
    };

    const cache = {};

    const a = await resolveCommands({
      root,
      ast: parse('user '),
      index: 'user '.length,
      cache,
    });

    expect(a.key).toEqual('user');
    expect(Object.keys(a.commands || {})).toEqual(['add', 'remove']);

    const b = await resolveCommands({
      root,
      ast: parse('user add'),
      index: 'user add'.length,
      cache,
    });

    expect(b.key).toEqual('add');
    expect(Object.keys(b.commands || {})).toEqual(['role']);

    const c = await resolveCommands({
      root,
      ast: parse('user add role'),
      index: 'user add role '.length,
      cache,
    });

    expect(c.key).toEqual('role');
    expect(c.commands).toEqual({});
  });

  it('resolves command with no sub-commands', async () => {
    const root = {
      commands: {
        user: {
          args: {
            id: {},
            email: {},
          },
        },
      },
    };

    const ast = parse('user ');

    expect(
      await resolveCommands({
        root,
        ast,
        index: 'user '.length,
        cache: {},
      }),
    ).toEqual({ command: root.commands.user, commands: undefined, key: 'user' });
  });

  it('resolves top-level commands', async () => {
    const ast = parse('u');
    const root = { commands: { user: {} } };

    expect(
      await resolveCommands({
        root,
        ast,
        index: 1,
        cache: {},
      }),
    ).toEqual({ command: root, commands: root.commands, key: '' });
  });

  it('resolves top-level commands with async function', async () => {
    const ast = parse('u');
    const commands = { user: {} };
    const root = { commands: () => Promise.resolve(commands) };

    expect(
      await resolveCommands({
        root,
        ast,
        index: 1,
        cache: {},
      }),
    ).toEqual({ command: root, commands, key: '' });
  });

  it('resolves nested commands', async () => {
    const ast = parse('user ');
    const root = {
      commands: {
        user: {
          commands: { update: {} },
        },
      },
    };

    expect(
      await resolveCommands({
        root,
        ast,
        index: 'user '.length,
        cache: {},
      }),
    ).toEqual({ command: root.commands.user, commands: root.commands.user.commands, key: 'user' });
  });

  it('resolves nested commands with async function', async () => {
    const ast = parse('user up');

    const root = {
      commands: () =>
        Promise.resolve({
          user: {
            name: 'abc',
            commands: () =>
              Promise.resolve({
                update: {},
              }),
          },
        }),
    };

    const { command, commands, key } = await resolveCommands({
      root,
      ast,
      index: 'user up'.length,
      cache: {},
    });

    expect(key).toEqual('user');
    expect(commands).toEqual({ update: {} });
    expect(command.name).toEqual('abc');
  });

  it('resolves command at index with async function', async () => {
    const ast = parse('user up');

    const root = {
      name: 'abc',
      commands: () =>
        Promise.resolve({
          user: {
            commands: () =>
              Promise.resolve({
                update: {},
              }),
          },
        }),
    };

    const { command, commands, key } = await resolveCommands({
      root,
      ast,
      index: 'use'.length,
      cache: {},
    });

    expect(key).toEqual('');
    expect(Object.keys(commands || {})).toEqual(['user']);
    expect(command.name).toEqual('abc');
  });

  it('calls commands function with value', async () => {
    const ast = parse('user up');
    const userCommands = jest.fn();

    const root = {
      commands: {
        user: {
          commands: userCommands,
        },
      },
    };

    await resolveCommands({
      root,
      ast,
      index: 'user up'.length,
      cache: {},
    });

    expect(userCommands).toHaveBeenCalledWith({ value: 'up' });
  });

  it('calls commands function with different values', async () => {
    const cache = {};
    const root: ICommand = {
      commands: {
        user: {
          commands: async ({ value }: { value?: string }) => ({
            [value !== 'bb' ? `${value || ''}b` : value]: {},
          }),
        },
      },
    };

    const a = await resolveCommands({
      root,
      ast: parse('user a'),
      index: 'user a'.length,
      cache,
    });

    expect(a.key).toEqual('user');
    expect(a.command).toEqual((root.commands as ICommands).user);
    expect(a.commands).toEqual({ ab: {} });

    const b = await resolveCommands({
      root,
      ast: parse('user b'),
      index: 'user b'.length,
      cache,
    });

    expect(b.key).toEqual('user');
    expect(b.command).toEqual((root.commands as ICommands).user);
    expect(b.commands).toEqual({ bb: {} });

    const c = await resolveCommands({
      root,
      ast: parse('user bb'),
      index: 'user bb'.length,
      cache,
    });

    expect(c.key).toEqual('bb');
    expect(c.command).toEqual({});
    expect(c.commands).toEqual(undefined);
  });

  it('calls commands function with value at index', async () => {
    const ast = parse('user up');
    const userCommands = jest.fn();

    const root = {
      commands: {
        user: {
          commands: userCommands,
        },
      },
    };

    await resolveCommands({
      root,
      ast,
      index: 'user u'.length,
      cache: {},
    });

    expect(userCommands).toHaveBeenCalledWith({ value: 'u' });
  });
});
