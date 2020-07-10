import { ICommand } from '../types';
import { createInput } from '../input';

const options = [{ value: 'foo bar' }];

const root: ICommand = {
  commands: {
    search: {
      options: async (__search?: string) => Promise.resolve(options),
      commands: {
        foo: {},
      },
    },
  },
};

it('suggests commands and options without search', (done) => {
  createInput({
    command: root,
    value: 'search ',
    index: 'search '.length,
    includeExactMatch: true,
    onUpdate: (updates) => {
      expect(updates.options).toEqual([
        {
          value: 'foo bar',
          searchValue: undefined,
          data: { value: 'foo bar' },
          inputValue: 'search foo bar',
          cursorTarget: 'search foo bar'.length,
        },
        {
          value: 'foo',
          searchValue: undefined,
          data: {},
          inputValue: 'search foo',
          cursorTarget: 'search foo'.length,
        },
      ]);
      done();
    },
  });
});

it('suggests options', (done) => {
  createInput({
    command: root,
    value: 'search foob',
    index: 'search foob'.length,
    includeExactMatch: true,
    onUpdate: (updates) => {
      expect(updates.options).toEqual([
        {
          value: 'foo bar',
          searchValue: 'foob',
          data: { value: 'foo bar' },
          inputValue: 'search foo bar',
          cursorTarget: 'search foo bar'.length,
        },
      ]);
      done();
    },
  });
});

it('suggests commands and options', (done) => {
  createInput({
    command: root,
    value: 'search fo',
    index: 'search fo'.length,
    includeExactMatch: true,
    onUpdate: (updates) => {
      expect(updates.options).toEqual([
        {
          value: 'foo bar',
          searchValue: 'fo',
          data: { value: 'foo bar' },
          inputValue: 'search foo bar',
          cursorTarget: 'search foo bar'.length,
        },
        {
          value: 'foo',
          searchValue: 'fo',
          data: {},
          inputValue: 'search foo',
          cursorTarget: 'search foo'.length,
        },
      ]);
      done();
    },
  });
});

it('does not suggest options when a command is matched', (done) => {
  createInput({
    command: root,
    value: 'search foo b',
    index: 'search foo b'.length,
    includeExactMatch: true,
    onUpdate: (updates) => {
      expect(updates.options).toEqual([]);
      done();
    },
  });
});
