import { tokenize, Tokens } from '../tokenizer';

([
  [
    'u',
    [
      {
        kind: 'KEYWORD',
        value: 'u',
        start: 0,
        end: 'u'.length,
      },
    ],
  ],
  [
    'user',
    [
      {
        kind: 'KEYWORD',
        value: 'user',
        start: 0,
        end: 'user'.length,
      },
    ],
  ],
  [
    'user ',
    [
      {
        kind: 'KEYWORD',
        value: 'user',
        start: 0,
        end: 'user'.length,
      },
      {
        kind: 'WHITESPACE',
        value: ' ',
        start: 'user'.length,
        end: 'user '.length,
      },
    ],
  ],
  [
    'user --info',
    [
      {
        kind: 'KEYWORD',
        value: 'user',
        start: 0,
        end: 'user'.length,
      },
      {
        kind: 'WHITESPACE',
        value: ' ',
        start: 'user'.length,
        end: 'user '.length,
      },
      {
        kind: 'KEYWORD',
        value: '--info',
        start: 'user '.length,
        end: 'user --info'.length,
      },
    ],
  ],
  [
    'user --name "ABC DEF"',
    [
      {
        kind: 'KEYWORD',
        value: 'user',
        start: 0,
        end: 'user'.length,
      },
      {
        kind: 'WHITESPACE',
        value: ' ',
        start: 'user'.length,
        end: 'user '.length,
      },
      {
        kind: 'KEYWORD',
        value: '--name',
        start: 'user '.length,
        end: 'user --name'.length,
      },
      {
        kind: 'WHITESPACE',
        value: ' ',
        start: 'user --name'.length,
        end: 'user --name '.length,
      },
      {
        kind: 'KEYWORD',
        value: '"ABC DEF"',
        start: 'user --name '.length,
        end: 'user --name "ABC DEF"'.length,
      },
    ],
  ],
  [
    '"ABC DEF"',
    [
      {
        kind: 'KEYWORD',
        value: '"ABC DEF"',
        start: 0,
        end: '"ABC DEF"'.length,
      },
    ],
  ],
  [
    "AB'C DEF",
    [
      {
        kind: 'KEYWORD',
        value: "AB'C DEF",
        start: 0,
        end: "AB'C DEF".length,
      },
    ],
  ],
  [
    'AB"CDE F',
    [
      {
        kind: 'KEYWORD',
        value: 'AB"CDE F',
        start: 0,
        end: 'AB"CDE F'.length,
      },
    ],
  ],
  [
    '"A \'BC\' F"',
    [
      {
        kind: 'KEYWORD',
        value: '"A \'BC\' F"',
        start: 0,
        end: '"A \'BC\' F"'.length,
      },
    ],
  ],
  [
    '  ',
    [
      {
        kind: 'WHITESPACE',
        value: '  ',
        start: 0,
        end: '  '.length,
      },
    ],
  ],
  ['', []],
] as Array<[string, Tokens]>).forEach(([source, expected]) => {
  it(`tokenizes "${source}"`, () => {
    expect(tokenize(source)).toEqual(expected);
  });
});
