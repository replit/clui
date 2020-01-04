import { inputState } from '../index';
import cmds from './cmds';

describe('suggestions', () => {
  it('suggests top level commands with no value', () => {
    const input = inputState(cmds);

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
    const input = inputState(cmds).update({ value: 'us', index: 2 });

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
    const input = inputState(cmds).update({ value: 'fo', index: 2 });

    expect(input.suggestions).toEqual([]);
  });

  it('suggests all sub-commands and args', () => {
    const input = inputState(cmds).update({ value: 'user ', index: 5 });

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
    ['user add', 8, 'user addRole'],
    ['user add --role', 8, 'user addRole --role'],
    ['user add --role', 6, 'user addRole --role'],
  ] as Array<[string, number, string]>).forEach(([value, index, inputValue]) => {
    it(`suggests filtered sub-commands for '${value}'`, () => {
      const input = inputState(cmds).update({ value, index });

      expect(input.suggestions).toEqual([
        {
          value: 'addRole',
          inputValue,
          description: 'adds role',
          cursorTarget: 12,
        },
      ]);
    });
  });

  it('suggests all sub-commands while keeping remaining input', () => {
    const input = inputState(cmds).update({ value: 'user add --role', index: 5 });

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
    const input = inputState(cmds).update({ value: 'user add', index: 5 });

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
      const input = inputState(cmds).update({ value, index });

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
      const input = inputState(cmds).update({ value, index });

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
