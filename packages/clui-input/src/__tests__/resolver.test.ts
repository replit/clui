import { resolve } from '../resolver';

it('resolves command', async () => {
  const root = {
    commands: async () => ({
      user: {},
    }),
  };

  const resolved = await resolve('user', root);

  expect(resolved.command?.ref).toEqual({});
  expect(resolved.command?.node).toEqual({
    type: 'KEYWORD',
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

  const resolved = await resolve('user add', root);

  expect(resolved.command?.command?.parent?.ref).toEqual(root.commands.user);
  expect(resolved.command?.command?.ref).toEqual({});
  expect(resolved.command?.command?.node).toEqual({
    type: 'KEYWORD',
    value: 'add',
    start: 5,
    end: 8,
  });
});
