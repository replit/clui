// @ts-nocheck
import { parse, arg } from '../parser';

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
    it("parses'", () => {
      // @ts-ignore
      console.log(arg({ index: 0 }).run('-f "bar wat" --baz "huh"').result);
      console.log(arg({ index: 0 }).run("-f 'bar wat'").result);
      console.log(arg({ index: 0 }).run('-f bar wat').result);
      // @ts-ignore
      // console.log(arg({ index: 0 }).run('--role').result);
      // @ts-ignore
      // console.log(arg({ index: 0 }).run('--fsss ').result);
      // @ts-ignore
      // console.log(arg({ index: 0 }).run('- --fsss ').result);
      // @ts-ignore
    });

    // const testCase = (input: string, expected: Array<string>): [string, any] => {
    // const command = 'user';
    // const inputStr = `${command} ${input}`;
    // const end = inputStr.length;
    // console.log(expected);

    // return [
    // inputStr,
    // {
    // start: 0,
    // end,
    // type: 'ROOT',
    // value: [
    // { start: 0, end: command.length, value: command, type: 'COMMAND' },
    // { start: command.length, end: command.length + 1, value: ' ', type: 'WHITESPACE' },
    // { start: end, end, value: '', type: 'END' },
    // ],
    // },
    // ];
    // };

    [
      // testCase('-f', [['-f', true]]),
      // testCase('-r admin', ['-r', ' ', 'admin']),
    ].forEach(([command, expected]) => {
      it.skip(`parses '${command}'`, () => {
        console.log(parse(command).result);
        expect(parse(command).result).toEqual(expected);
      });
    });
  });
});
