import visit from '../visit';
import { IGQLCommand } from '../types';

it('visits each command', () => {
  const fn = jest.fn();

  const command: IGQLCommand = {
    outputType: '',
    path: [],
    commands: {
      add: { outputType: '', path: [] },
      remove: { outputType: '', path: [] },
    },
  };

  visit(command, fn);

  expect(fn).toHaveBeenCalledTimes(3);
});
