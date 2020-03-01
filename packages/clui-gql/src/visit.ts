import { IGQLCommand } from './types';

const visit = (root: IGQLCommand, fn: (c: IGQLCommand) => void) => {
  if (typeof root.commands !== 'object') {
    throw Error('Expected commands object');
  }

  fn(root);

  const queue: Array<IGQLCommand> = [...Object.values(root.commands)];

  while (queue.length) {
    const command = queue.shift();

    if (command) {
      fn(command);

      if (command.commands) {
        queue.push(...Object.values(command.commands));
      }
    }
  }
};

export default visit;
