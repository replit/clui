import { ICommand, ICommands, IResult } from './types';
import { commandPath, getNode } from './util';

const getCommands = async (options: {
  cache: Record<string, ICommands>;
  keyPath: Array<string>;
  command: ICommand;
}): Promise<ICommands | undefined> => {
  const { command, keyPath, cache } = options;

  if (typeof command.commands === 'object') {
    return command.commands;
  }

  if (typeof command.commands === 'function') {
    const cacheKey = keyPath.join(':');

    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    const value = keyPath.length ? keyPath[keyPath.length - 1] : undefined;
    const commands = await Promise.resolve(command.commands(value || undefined));
    cache[cacheKey] = commands;

    return commands;
  }

  return undefined;
};

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

const resolveCommands = async (config: IConfig): Promise<IResolved> => {
  const paths: Array<string> = commandPath(config.ast, config.index).map((p) => p.value);
  const atEnd = config.ast.source.length === config.index;
  const atWhitespace = () => getNode(config.ast.result, config.index - 1)?.type === 'WHITESPACE';

  const queue = [...paths];

  if (!queue.length || atEnd || atWhitespace()) {
    queue.push('');
  }

  let key = '';
  let command = config.root;
  let commands: ICommands | undefined;
  let index = 0;

  while (queue.length) {
    const path = queue.shift();

    if (path === undefined) {
      break;
    }

    const keyPath = [...paths.slice(0, index), path];
    // eslint-disable-next-line no-await-in-loop
    commands = await getCommands({
      command,
      keyPath,
      cache: config.cache,
    });

    if (commands && commands[path]) {
      key = path;
      command = commands[key];
      commands = undefined;
    }

    index++;
  }

  return { command, commands, key };
};

export default resolveCommands;
