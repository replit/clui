import { createInput, IInputStateUpdates } from '../input';
import { ICommand } from '../types';

it('updates', (done) => {
  const root: ICommand = {
    commands: {
      user: {
        commands: {
          add: {},
        },
      },
    },
  };

  createInput({
    value: 'u',
    index: 'u'.length,
    command: root,
    onUpdate: (updates: IInputStateUpdates) => {
      console.log(updates);
      done();
    },
  });
});
