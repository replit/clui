// @ts-nocheck
import { parse } from '../parser';

describe('parser', () => {
  describe('command', () => {
    const testCase = (command: string): [string, any] => [
      command,
      {
        start: 0,
        end: command.length,
        type: 'ROOT',
        value: [
          { start: 0, end: command.length, type: 'COMMAND', value: command },
          { start: command.length, end: command.length, value: '', type: 'END' },
        ],
      },
    ];

    [
      testCase('add'),
      testCase('add-role'),
      testCase('add_role'),
      testCase('add:role'),
      testCase('addRole'),
      testCase('123addRole'),
    ].forEach(([command, expected]) => {
      it(`parses '${command}'`, () => {
        expect(parse(command).result).toEqual(expected);
      });
    });
  });

  describe('commands', () => {
    const testCase = (...input: Array<string>): [string, any] => {
      const inputStr = input.join('');
      const end = inputStr.length;

      return [
        inputStr,
        {
          start: 0,
          end,
          type: 'ROOT',
          value: [
            ...input.map((str, i) => {
              const type = i % 2 === 0 ? 'COMMAND' : 'WHITESPACE';
              const start = input.slice(0, i).join('').length;

              return { type, start, end: start + str.length, value: str };
            }),
            { start: end, end, value: '', type: 'END' },
          ],
        },
      ];
    };

    [
      testCase('user', ' ', 'add-role'),
      testCase('user', '  ', 'add-role'),
      testCase('user', '  ', 'add-role', ' ', 'admin'),
    ].forEach(([command, expected]) => {
      it(`parses '${command}'`, () => {
        expect(parse(command).result).toEqual(expected);
      });
    });
  });

  describe('args', () => {
    [
      [
        '-f',
        [
          {
            type: 'ARGS',
            value: [{ start: 5, end: 7, value: '-f', type: 'ARG_KEY' }],
            start: 5,
            end: 7,
          },
        ],
      ],
      [
        '-f 1',
        [
          {
            type: 'ARGS',
            start: 5,
            end: 9,
            value: [
              { start: 5, end: 7, value: '-f', type: 'ARG_KEY' },
              { start: 7, end: 8, value: ' ', type: 'WHITESPACE' },
              { start: 8, end: 9, value: '1', type: 'ARG_VALUE' },
            ],
          },
        ],
      ],
      [
        '-f 1 --b',
        [
          {
            type: 'ARGS',
            start: 5,
            end: 13,
            value: [
              { start: 5, end: 7, value: '-f', type: 'ARG_KEY' },
              { start: 7, end: 8, value: ' ', type: 'WHITESPACE' },
              { start: 8, end: 9, value: '1', type: 'ARG_VALUE' },
              { start: 9, end: 10, value: ' ', type: 'WHITESPACE' },
              { start: 10, end: 13, value: '--b', type: 'ARG_KEY' },
            ],
          },
        ],
      ],
    ].forEach(([args, expected]) => {
      it(`parses '${args}'`, () => {
        expect(parse(`user ${args}`).result.value.slice(2)).toEqual(expected);
      });
    });
  });
});
