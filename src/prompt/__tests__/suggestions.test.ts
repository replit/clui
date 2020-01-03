import { getCmdContext, getSuggestions } from '../suggestions';
import { parse } from '../../parser';
import { ICmd } from '../types';
// import { ICmd } from '../types';

const cmds: Record<string, ICmd> = {
  user: {
    name: 'user',
    description: 'user description',
    args: {
      report: { description: 'report user' },
    },
    commands: {
      addRole: {
        description: 'adds role',
        run: () => null,
        args: {
          role: { name: 'role', description: 'the role' },
          user: { name: 'user', description: 'the user id' },
        },
      },
      removeRole: {
        description: 'removes role',
        run: () => null,
        args: {
          role: { name: 'role', description: 'the role' },
          user: { name: 'user', description: 'the user id' },
        },
      },
    },
  },
  post: {
    name: 'post',
    description: 'post description',
  },
};

describe('getSuggestions', () => {
  it('returns all top-level commands when there is no input', () => {
    const input = '';
    const expected = Object.keys(cmds).map((key) => ({
      value: key,
      description: cmds[key].description,
      start: 0,
      end: key.length,
    }));
    expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
  });

  it('returns filtered top-level command', () => {
    const input = 'us';
    const expected = [
      {
        value: 'user',
        description: 'user description',
        start: 0,
        end: 4,
      },
    ];
    expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
  });

  it('returns empty list when there is no match', () => {
    const input = 'foo';
    expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual([]);
  });

  it('returns empty when parent command is matched with no space', () => {
    const input = 'user';
    expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual([]);
  });

  describe('all suggestions for command', () => {
    const expected = [
      ...Object.keys(cmds.user.commands || {}).map((key) => ({
        value: key,
        description: (cmds.user.commands && cmds.user.commands[key].description) || '',
        start: 5,
        end: 5 + key.length,
      })),
      ...Object.keys(cmds.user.args || {}).map((key) => ({
        value: `--${key}`,
        description: (cmds.user.args && cmds.user.args[key].description) || '',
        start: 5,
        end: 5 + 2 + key.length,
      })),
    ];

    it('returns all sub-commands when parent command is matched with space', () => {
      const input = 'user ';
      expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
    });

    it('returns all sub-commands and args when parent command is matched and index is on parent', () => {
      const parent = 'user ';
      const input = `${parent}add`;

      expect(getSuggestions({ cmds, ast: parse(input), index: parent.length })).toEqual(expected);
    });
  });

  describe('filtered suggestions for command', () => {
    it('returns filtered sub-commands when parent command is matched', () => {
      const input = 'user add';
      const expected = [
        {
          value: 'addRole',
          description: 'adds role',
          start: 5,
          end: 12,
        },
      ];
      expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
    });

    it('returns filtered sub-commands and args when parent command is matched', () => {
      const input = 'user re';
      const expected = [
        {
          value: 'removeRole',
          description: 'removes role',
          start: 5,
          end: 15,
        },
        {
          value: '--report',
          description: 'report user',
          start: 5,
          end: 13,
        },
      ];
      expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
    });

    it('returns filtered sub-commands when parent command is matched and index is on sub-command', () => {
      const input = 'user rem';
      const expected = [
        {
          value: 'removeRole',
          description: 'removes role',
          start: 5,
          end: 15,
        },
        {
          value: '--report',
          description: 'report user',
          start: 5,
          end: 13,
        },
      ];
      expect(getSuggestions({ cmds, ast: parse(input), index: input.length - 1 })).toEqual(
        expected,
      );
    });
  });

  describe('args', () => {
    it('returns all args for matched command', () => {
      const input = 'user addRole ';
      const expected = [
        {
          value: '--role',
          description: 'the role',
          start: input.length,
          end: input.length + 6,
        },
        {
          value: '--user',
          description: 'the user id',
          start: input.length,
          end: input.length + 6,
        },
      ];
      expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
    });

    it('returns filtered args for matched command', () => {
      const input = 'user addRole ro';
      const expected = [
        {
          value: '--role',
          description: 'the role',
          start: input.length - 2,
          end: input.length + 4,
        },
      ];
      expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
    });

    it('returns remaining args for matched command and arg', () => {
      const input = 'user addRole --role ';
      const expected = [
        {
          value: '--user',
          description: 'the user id',
          start: input.length,
          end: input.length + 6,
        },
      ];
      expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
    });

    it('returns remaining filtered args for matched command and arg', () => {
      const input = 'user addRole --role mod --';
      const expected = [
        {
          value: '--user',
          description: 'the user id',
          start: input.length - 2,
          end: input.length + 4,
        },
      ];
      expect(getSuggestions({ cmds, ast: parse(input), index: input.length })).toEqual(expected);
    });
  });
});

describe('getCmdContext', () => {
  it('returns undefined when there is no matching command', () => {
    const input = 'foo';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      undefined,
      'foo',
    ]);
  });

  it('returns undefined when there is a partially matching command', () => {
    const input = 'use';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      undefined,
      'use',
    ]);
  });

  it('returns undefined when index is on a partially matching command', () => {
    const input = 'user';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length - 1 })).toEqual([
      undefined,
      undefined,
    ]);
  });

  it('returns command when matched', () => {
    const input = 'user';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      cmds.user,
      undefined,
    ]);
  });

  it('returns command when matched with space', () => {
    const input = 'user ';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      cmds.user,
      undefined,
    ]);
  });

  it('returns command when matched with space and partial sub command', () => {
    const input = 'user ad';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      cmds.user,
      'ad',
    ]);
  });

  it('returns command when matched with space and partial sub command and flag', () => {
    const input = 'user ad --foo';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      cmds.user,
      'ad',
    ]);
  });

  const userCommands = cmds.user.commands || {};

  it('returns sub-command when matched with sub-command', () => {
    const input = 'user addRole';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      userCommands.addRole,
      undefined,
    ]);
  });

  it('returns sub-command when matched with sub-command and space', () => {
    const input = 'user addRole ';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      userCommands.addRole,
      undefined,
    ]);
  });

  it('returns sub-command when matched with sub-command and spaces', () => {
    const input = 'user addRole  ';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      userCommands.addRole,
      undefined,
    ]);
  });

  it('returns sub-command when matched with sub-command, spaces and flag', () => {
    const input = 'user addRole  --foo';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      userCommands.addRole,
      undefined,
    ]);
  });

  it('returns command when matched with sub-command but index is at command', () => {
    const input = 'user addRole';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length - 2 })).toEqual([
      cmds.user,
      undefined,
    ]);
  });
});
