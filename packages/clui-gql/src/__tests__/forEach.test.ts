import forEach from '../forEach';
import { IGQLCommand } from '../types';

it('call function for each command', () => {
  const fn = jest.fn();

  const command: IGQLCommand = {
    outputType: '',
    path: [],
    commands: {
      add: { outputType: '', path: [] },
      remove: { outputType: '', path: [] },
    },
  };

  forEach(command, fn);

  expect(fn).toHaveBeenCalledTimes(3);
});
