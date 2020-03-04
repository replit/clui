import { IGQLCommand } from './types';

const forEach = (
  root: IGQLCommand,
  fn: (params: { command: IGQLCommand; root: IGQLCommand }) => void,
) => {
  if (typeof root.commands !== 'object') {
    throw Error('Expected commands object');
  }

  fn({ command: root, root });

  const queue: Array<IGQLCommand> = [...Object.values(root.commands)];

  while (queue.length) {
    const command = queue.shift();

    if (command) {
      fn({ command, root });

      if (command.commands) {
        queue.push(...Object.values(command.commands));
      }
    }
  }
};

export default forEach;
