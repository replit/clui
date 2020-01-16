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

  const paths = commandPath(config.ast, config.index);

  let command = config.root;
  let commands: ICommands | undefined;

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

  let index = 0;

  const queue = [...paths];
  while (queue.length) {
    const node = queue.shift();

    if (!node) {
      break;
    }

    const keyPath = [...paths.slice(0, index), node].map((p) => p.value);
    // eslint-disable-next-line
    commands = await getCommands({
      command,
      keyPath,
      cache: config.cache,
    });

    if (commands && commands[node.value]) {
      key = node.value;
      command = commands[key];
      if (prevNode?.type === 'WHITESPACE' || atEnd) {
        queue.push({
          type: 'WHITESPACE',
          start: prevNode ? prevNode.end : index,
          end: prevNode ? prevNode.end : index,
          value: '',
        });
      } else {
        commands = undefined;
      }
    }

    index++;
  }

  return { command, commands, key };
};

export default resolveCommands;
