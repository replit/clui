import { parse } from '../parser';

describe('parser', () => {
  const tests: Array<[string, any]> = [
    [
      'a',
      {
        start: 0,
        end: 1,
        type: 'ROOT',
        value: [
          { start: 0, end: 1, type: 'COMMAND', value: 'a' },
          { start: 1, end: 1, value: '', type: 'END' },
        ],
      },
    ],
    [
      'ab',
      {
        start: 0,
        end: 2,
        type: 'ROOT',
        value: [
          { start: 0, end: 2, type: 'COMMAND', value: 'ab' },
          { start: 2, end: 2, value: '', type: 'END' },
        ],
      },
    ],
    [
      'a b',
      {
        type: 'ROOT',
        start: 0,
        end: 3,
        value: [
          { start: 0, end: 1, value: 'a', type: 'COMMAND' },
          { start: 1, end: 2, value: ' ', type: 'WHITESPACE' },
          { start: 2, end: 3, value: 'b', type: 'COMMAND' },
          { start: 3, end: 3, value: '', type: 'END' },
        ],
      },
    ],
  ];

  tests.forEach(([command, expected]) => {
    it(`parses '${command}'`, () => {
      expect(parse(command).result).toEqual(expected);
    });
  });
});
