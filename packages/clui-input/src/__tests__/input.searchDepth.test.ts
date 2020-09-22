import { ICommand } from '../types';
import { createInput } from '../input';
// import { parse } from '../parser';

const readCommnads = async () => ({
  wat: {},
});

const crud = {
  create: {},
  read: { commands: readCommnads },
  update: { commands: { add: {} } },
  destroy: {},
};

it('includes exact sub-command match', (done) => {
  const root: ICommand = {
    commands: {
      user: {
        // options: () => Promise.resolve([{ value: 'aa' }]),
        commands: (a?: string) => {
          console.log('search: ', a);

          return Promise.resolve(crud);
        },
      },
    },
  };

  createInput({
    includeExactMatch: true,
    command: root,
    value: 'u',
    index: 'u'.length,
    onUpdate: (updates) => {
      console.log(updates);
      // expect(updates.options).toEqual([
      // {
      // searchValue: 'u',
      // value: 'user',
      // data: { commands: crud },
      // inputValue: 'user',
      // cursorTarget: 'user'.length,
      // },
      // {
      // searchValue: 'u',
      // value: 'update',
      // data: {},
      // inputValue: 'user update',
      // cursorTarget: 'user update'.length,
      // },
      // ]);
      done();
    },
  });
});

//
// ```
// const command = {
//   new-repl: {
//     commands: {
//        'javascript'
//     }
//   }
// }
// ```
//
// new-repl jav
// "jav"
