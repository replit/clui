import { ICommand, ICommands, IResult } from './types';
import { commandPath } from './util';

interface IConfig {
  root: ICommand;
  ast: IResult;
  index: number;
  cache: Record<string, ICommands>;
}

interface IResolved {
  command: ICommand;
  commands?: ICommands;
  key: string;
}

const getCommands = async (options: {
  cache: Record<string, ICommands>;
  value?: string;
  cacheKey: string;
  command: ICommand;
}): Promise<ICommands | undefined> => {
  const { command, value, cache } = options;
  const cacheKey = `commands:${options.cacheKey}:${value}`;

  if (typeof command.commands === 'object') {
    return command.commands;
  }

  if (typeof command.commands === 'function') {
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    const commands = await Promise.resolve(command.commands({ value }));
    cache[cacheKey] = commands;

    return commands;
  }

  return undefined;
};

const resolveCommands = async (config: IConfig): Promise<IResolved> => {
  let key = '';

  if (!config.root.commands) {
    return { key, command: config.root };
  }

  let command = config.root;
  let commands = await getCommands({
    cache: config.cache,
    command,
    cacheKey: '',
  });

  const paths = commandPath(config.ast, config.index);
  let index = 0;

  while (index < paths.length) {
    const node = paths[index];

    if (node && commands && commands[node.value]) {
      const cacheKey = paths
        .slice(0, index + 1)
        .map((p) => p.value)
        .join(':');

      key = node.value;
      command = commands[node.value];

      const nextNode = paths[index + 1];
      const value = nextNode ? nextNode.value : undefined;
      // eslint-disable-next-line
      commands = await getCommands({
        cacheKey,
        command,
        value,
        cache: config.cache,
      });
    } else {
      break;
    }

    index++;
  }

  return { command, commands, key };
};

export default resolveCommands;
