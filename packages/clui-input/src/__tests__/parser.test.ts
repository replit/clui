import { parse } from '../parser';

describe('parser', () => {
  describe('command', () => {
    const testCase = (command: string): [string, any] => [
      command,
      {
        index: command.length,
        isError: false,
        result: [
          { start: 0, end: command.length, type: 'COMMAND', value: command },
        ],
        source: command,
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
        expect(parse(command)).toEqual(expected);
      });
    });
  });

  describe('commands', () => {
    const testCase = (...input: Array<string>): [string, any] => {
      const inputStr = input.join('');

      return [
        inputStr,
        [
          ...input.map((str, i) => {
            const type = i % 2 === 0 ? 'COMMAND' : 'WHITESPACE';
            const start = input.slice(0, i).join('').length;

            return { type, start, end: start + str.length, value: str };
          }),
        ],
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
      ['-a', [{ start: 5, end: 7, value: '-a', type: 'ARG_KEY' }]],
      ['--a', [{ start: 5, end: 8, value: '--a', type: 'ARG_KEY' }]],
      ['---a', [{ start: 5, end: 9, value: '---a', type: 'ARG_KEY' }]],
      [
        '-a 1',
        [
          { start: 5, end: 7, value: '-a', type: 'ARG_KEY' },
          { start: 7, end: 8, value: ' ', type: 'WHITESPACE' },
          { start: 8, end: 9, value: '1', type: 'ARG_VALUE' },
        ],
      ],
      [
        '-a 1 -b',
        [
          { start: 5, end: 7, value: '-a', type: 'ARG_KEY' },
          { start: 7, end: 8, value: ' ', type: 'WHITESPACE' },
          { start: 8, end: 9, value: '1', type: 'ARG_VALUE' },
          { start: 9, end: 10, value: ' ', type: 'WHITESPACE' },
          { start: 10, end: 12, value: '-b', type: 'ARG_KEY' },
        ],
      ],
      [
        '-a "xyz"',
        [
          { start: 5, end: 7, value: '-a', type: 'ARG_KEY' },
          { start: 7, end: 8, value: ' ', type: 'WHITESPACE' },
          { start: 8, end: 13, value: '"xyz"', type: 'ARG_VALUE_QUOTED' },
        ],
      ],
      [
        "-a 'xyz'",
        [
          { start: 5, end: 7, value: '-a', type: 'ARG_KEY' },
          { start: 7, end: 8, value: ' ', type: 'WHITESPACE' },
          { start: 8, end: 13, value: "'xyz'", type: 'ARG_VALUE_QUOTED' },
        ],
      ],
      [
        "-f -a 'xyz'",
        [
          { start: 5, end: 7, value: '-f', type: 'ARG_KEY' },
          { start: 7, end: 8, value: ' ', type: 'WHITESPACE' },
          { start: 8, end: 10, value: '-a', type: 'ARG_KEY' },
          { start: 10, end: 11, value: ' ', type: 'WHITESPACE' },
          { start: 11, end: 16, value: "'xyz'", type: 'ARG_VALUE_QUOTED' },
        ],
      ],
    ].forEach(([args, expected]) => {
      it(`parses '${args}'`, () => {
        const parsed = parse(`user ${args}`);
        // console.log(JSON.stringify(parsed, null, 2));
        expect(parsed.result.slice(2)).toEqual(expected);
      });
    });
  });
});
