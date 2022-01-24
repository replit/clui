/* eslint-env jest */

import { createCompleter } from '../completer';
import { Command } from '..';
import { ScoredMatchResult, simpleMatch } from '../match';
import { UpdateData } from '../types';

interface Data {
  label: string;
}

type TestCommand = Command<Data, ScoredMatchResult>;

const root: TestCommand = {
  data: {
    label: 'Root',
  },
  commands: {
    child1: {
      data: {
        label: 'Child 1',
      },
      commands: {
        grandchild1: {
          data: {
            label: 'Grandchild 1',
          },
        },
        grandchild2: {
          data: {
            label: 'Grandchild 2',
          },
        },
      },
    },
    child2: {
      data: {
        label: 'Child 2',
      },
      commands: {
        grandchild1: {
          data: {
            label: 'Grandchild 1',
          },
        },
        grandchild2: {
          data: {
            label: 'Grandchild 2',
          },
        },
      },
    },
  },
};

type Updates = UpdateData<Data, ScoredMatchResult>;

const testCases = {
  'returns top level options when value is empty': [
    '',
    {
      searchValue: '',
      options: [
        {
          value: 'child1',
          data: { label: 'Child 1' },
          token: { value: 'child1', start: 0, end: 6 },
          matchResult: { score: 1 },
        },
        {
          value: 'child2',
          data: { label: 'Child 2' },
          token: { value: 'child2', start: 0, end: 6 },
          matchResult: { score: 1 },
        },
      ],
    },
  ],
  'searches tree when there is a value': [
    'Child 2',
    {
      searchValue: 'Child 2',
      options: [
        {
          value: 'child2',
          data: { label: 'Child 2' },
          token: { value: 'child2', start: 0, end: 6 },
          matchResult: { score: 1 },
        },
        {
          value: 'child1 grandchild2',
          data: { label: 'Grandchild 2' },
          token: { value: 'grandchild2', start: 7, end: 18 },
          matchResult: { score: 0.5 },
        },
        {
          value: 'child2 grandchild2',
          data: { label: 'Grandchild 2' },
          token: { value: 'grandchild2', start: 7, end: 18 },
          matchResult: { score: 0.5 },
        },
      ],
    },
  ],
  'returns direct children when parent is matched': [
    'child1 ',
    {
      searchValue: '',
      options: [
        {
          value: 'child1 grandchild1',
          data: { label: 'Grandchild 1' },
          token: { value: 'grandchild1', start: 7, end: 18 },
          matchResult: { score: 1 },
        },
        {
          value: 'child1 grandchild2',
          data: { label: 'Grandchild 2' },
          token: { value: 'grandchild2', start: 7, end: 18 },
          matchResult: { score: 1 },
        },
      ],
    },
  ],
  'searches tree when parent is matched an there is a value': [
    'child1 2',
    {
      searchValue: '2',
      options: [
        {
          value: 'child1 grandchild2',
          data: { label: 'Grandchild 2' },
          token: { value: 'grandchild2', start: 7, end: 18 },
          matchResult: { score: 0.5 },
        },
      ],
    },
  ],
} as const;

async function resolveUpdates(value: string) {
  return new Promise<Updates>((resolve) => {
    const update = createCompleter<Data, ScoredMatchResult>({
      root,
      matchOption: (params) => simpleMatch(params.data.label, params),
      onUpdate: resolve,
    });

    update({ value });
  });
}

Object.entries(testCases).forEach(([testStr, [value, expected]]) => {
  it(testStr, async () => {
    const updates = await resolveUpdates(value);
    expect(updates.options.length).toEqual(expected.options.length);
    expect(updates.options).toEqual(
      expect.arrayContaining(expected.options.map(expect.objectContaining))
    );
  });
});
