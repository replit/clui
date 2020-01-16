import { ICommand, ICommands, IResult } from './types';
import { commandPath, getNode } from './util';

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
  keyPath: Array<string>;
  command: ICommand;
}): Promise<ICommands | undefined> => {
  const { command, keyPath, cache } = options;

  if (typeof command.commands === 'object') {
    return command.commands;
  }

  if (typeof command.commands === 'function') {
    const cacheKey = ['commands', ...keyPath].join(':');

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

const resolveCommands = async (config: IConfig): Promise<IResolved> => {
  let key = '';

  if (!config.root.commands) {
    return { key, command: config.root };
  }

  let command = config.root;
  let commands: ICommands | undefined;

  const paths = commandPath(config.ast, config.index);

  if (!paths.length) {
    commands = await getCommands({
      command,
      keyPath: [],
      cache: config.cache,
    });

    return { key, command, commands };
  }

  const atEnd = config.ast.result.source.length === config.index;
  const prevNode = getNode(config.ast.result.value, config.index - 1);
  if (prevNode?.type === 'WHITESPACE' || atEnd) {
    paths.push({
      type: 'WHITESPACE',
      start: prevNode ? prevNode.start : config.index,
      end: prevNode ? prevNode.start : config.index,
      value: '',
    });
  }

  let index = 0;

  const queue = [command];

  while (queue.length) {
    const item = queue.shift();

    if (!item) {
      break;
    }

    if (item.commands) {
      const keyPath = paths.slice(0, index + 1).map((p) => p.value);

      // eslint-disable-next-line
      commands = await getCommands({
        keyPath,
        command: item,
        cache: config.cache,
      });

      const node = paths[index];

      if (commands && node && commands[node.value]) {
        key = node.value;
        command = commands[key];
        queue.push(command);
      } else {
        break;
      }
    } else {
      commands = undefined;
    }

    index++;
  }

  return { command, commands, key };
};

export default resolveCommands;
