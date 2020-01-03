import { cmdInput } from '../index';

describe('input', () => {
  const cmds = {
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
    version: {
      name: 'version',
      description: 'version description',
    },
  };

  describe('suggestions', () => {
    it('suggests top level commands with no value', () => {
      const input = cmdInput(cmds);

      expect(input.suggestions).toEqual([
        {
          value: 'user',
          inputValue: 'user',
          description: 'user description',
          cursorTarget: 4,
        },
        {
          value: 'version',
          inputValue: 'version',
          description: 'version description',
          cursorTarget: 7,
        },
      ]);
    });

    it('suggests commands filtered by value', () => {
      const input = cmdInput(cmds).update({ value: 'us', index: 2 });

      expect(input.suggestions).toEqual([
        {
          value: 'user',
          inputValue: 'user',
          description: 'user description',
          cursorTarget: 4,
        },
      ]);
    });

    it('suggests nothing when no match found', () => {
      const input = cmdInput(cmds).update({ value: 'fo', index: 2 });

      expect(input.suggestions).toEqual([]);
    });

    it('suggests all sub-commands and args', () => {
      const input = cmdInput(cmds).update({ value: 'user ', index: 5 });

      expect(input.suggestions).toEqual([
        {
          value: 'addRole',
          inputValue: 'user addRole',
          description: 'adds role',
          cursorTarget: 12,
        },
        {
          value: 'removeRole',
          inputValue: 'user removeRole',
          description: 'removes role',
          cursorTarget: 15,
        },
        {
          value: '--report',
          inputValue: 'user --report',
          description: 'report user',
          cursorTarget: 13,
        },
      ]);
    });

    it('suggests filtered sub-commands', () => {
      const input = cmdInput(cmds).update({ value: 'user add', index: 8 });

      expect(input.suggestions).toEqual([
        {
          value: 'addRole',
          inputValue: 'user addRole',
          description: 'adds role',
          cursorTarget: 12,
        },
      ]);
    });

    it('suggests filtered sub-commands while keeping remaining input', () => {
      const input = cmdInput(cmds).update({ value: 'user add --role', index: 8 });

      expect(input.suggestions).toEqual([
        {
          value: 'addRole',
          inputValue: 'user addRole --role',
          description: 'adds role',
          cursorTarget: 12,
        },
      ]);
    });

    it('suggests filtered sub-commands while keeping remaining input when on index is on sub command', () => {
      const input = cmdInput(cmds).update({ value: 'user add --role', index: 6 });

      expect(input.suggestions).toEqual([
        {
          value: 'addRole',
          inputValue: 'user addRole --role',
          description: 'adds role',
          cursorTarget: 12,
        },
      ]);
    });

    it('suggests all sub-commands while keeping remaining input', () => {
      const input = cmdInput(cmds).update({ value: 'user add --role', index: 5 });

      expect(input.suggestions).toEqual([
        {
          value: 'addRole',
          inputValue: 'user addRole --role',
          description: 'adds role',
          cursorTarget: 12,
        },
        {
          value: 'removeRole',
          inputValue: 'user removeRole --role',
          description: 'removes role',
          cursorTarget: 15,
        },
        {
          value: '--report',
          inputValue: 'user --report --role',
          description: 'report user',
          cursorTarget: 13,
        },
      ]);
    });

    it('suggests all sub-commands and args when index is at beginning', () => {
      const input = cmdInput(cmds).update({ value: 'user add', index: 5 });

      expect(input.suggestions).toEqual([
        {
          value: 'addRole',
          inputValue: 'user addRole',
          description: 'adds role',
          cursorTarget: 12,
        },
        {
          value: 'removeRole',
          inputValue: 'user removeRole',
          description: 'removes role',
          cursorTarget: 15,
        },
        {
          value: '--report',
          inputValue: 'user --report',
          description: 'report user',
          cursorTarget: 13,
        },
      ]);
    });

    ([
      ['user addRole ', 13],
      ['user addRole -', 13],
      ['user addRole --', 13],
      ['user addRole --u', 13],
      ['user addRole -', 14],
      ['user addRole --', 15],
    ] as Array<[string, number]>).forEach(([value, index]) => {
      it(`suggests all args for '${value}'`, () => {
        const input = cmdInput(cmds).update({ value, index });

        expect(input.suggestions).toEqual([
          {
            value: '--role',
            inputValue: 'user addRole --role',
            description: 'the role',
            cursorTarget: 19,
          },
          {
            value: '--user',
            inputValue: 'user addRole --user',
            description: 'the user id',
            cursorTarget: 19,
          },
        ]);
      });
    });

    ([
      ['user addRole --user ', 20],
      ['user addRole --user --', 22],
      ['user addRole --user --', 21],
      ['user addRole --user --r', 23],
    ] as Array<[string, number]>).forEach(([value, index]) => {
      it(`suggests remaining args for '${value}'`, () => {
        const input = cmdInput(cmds).update({ value, index });

        expect(input.suggestions).toEqual([
          {
            value: '--role',
            inputValue: 'user addRole --user --role',
            description: 'the role',
            cursorTarget: 26,
          },
        ]);
      });
    });
  });

  describe('update', () => {
    const updatedValue = 'updatedValue';
    const updatedIndex = 3;

    it('updates value', () => {
      const input = cmdInput(cmds);
      expect(input.value).toEqual('');

      input.update({ value: updatedValue });
      expect(input.value).toEqual(updatedValue);
    });

    it('updates index', () => {
      const input = cmdInput(cmds);
      expect(input.index).toEqual(0);

      input.update({ index: updatedIndex });
      expect(input.index).toEqual(updatedIndex);
    });

    it('updates value and index', () => {
      const input = cmdInput(cmds);
      expect(input.index).toEqual(0);
      expect(input.value).toEqual('');

      input.update({ index: updatedIndex, value: updatedValue });
      expect(input.index).toEqual(updatedIndex);
      expect(input.value).toEqual(updatedValue);
    });
  });
});
