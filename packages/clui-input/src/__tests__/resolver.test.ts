import { resolve } from '../resolver';

it('resolves command', async () => {
  const root = {
    commands: async () => ({
      user: {},
    }),
  };

  const cache = {};
  const resolved = await resolve({ input: 'user', command: root, cache });

  expect(resolved.command?.ref).toEqual({});
  expect(resolved.command?.token).toEqual({
    kind: 'KEYWORD',
    value: 'user',
    start: 0,
    end: 4,
  });
});

it('resolves subcommand', async () => {
  const root = {
    commands: {
      user: {
        commands: async () => ({
          add: {},
        }),
      },
    },
  };

  const cache = {};
  const resolved = await resolve({ input: 'user add', command: root, cache });

  expect(resolved.command?.command?.parent?.ref).toEqual(root.commands.user);
  expect(resolved.command?.command?.ref).toEqual({});
  expect(resolved.command?.command?.token).toEqual({
    kind: 'KEYWORD',
    value: 'add',
    start: 5,
    end: 8,
  });
});
