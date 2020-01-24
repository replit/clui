import { IAppCommand } from '.';

const makeCommands = (depth: number) => async (
  __: any,
): Promise<Record<string, IAppCommand>> => {
  const ret: Record<string, IAppCommand> = {};

  [...Array(depth)].forEach((_, index, list) => {
    ret[`depth:${depth}:${index}`] = {
      description: `Command at depth: ${depth} (with ${list.length} sub-commands)`,
      commands: makeCommands(depth + 1),
    };
  });

  return ret;
};

export default {
  description: 'An exmaple of dynaimcally nesting commands',
  commands: makeCommands(1),
};
