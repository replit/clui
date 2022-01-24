/* eslint-env jest */

import { createCompleter } from '../completer';
import { Command } from '..';
import { ScoredMatchResult, simpleMatch } from '../match';
import { UpdateData } from '../types';

interface Data {
  label: string;
}

type TestCommand = Command<Data, ScoredMatchResult>;

type Updates = UpdateData<Data, ScoredMatchResult>;

const root: TestCommand = {
  data: {
    label: 'Parent',
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

const expected = {
  options: [
    {
      value: 'child2',
      data: { label: 'Child 2' },
    },
    {
      value: 'child1 grandchild2',
      data: { label: 'Grandchild 2' },
    },
    {
      value: 'child2 grandchild2',
      data: { label: 'Grandchild 2' },
    },
  ],
};

it('works', async () => {
  const updates = await resolveUpdates('2');

  expect(updates.options.length).toEqual(expected.options.length);
  expect(updates.options).toEqual(
    expect.arrayContaining(expected.options.map(expect.objectContaining))
  );
});
