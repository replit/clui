import { find, closestPrevious, IAst, commandPath, toArgs } from './ast';
import {
  ICommands,
  ICommand,
  IOption,
  // IResult,
  // IArg,
  // IArgsOption,
  ArgType,
  ICommandArgs,
} from './types';
import { resolve } from './resolver';
// import { IAst } from './parser2';

type SearchFn = (args: ISearchArgs) => boolean;

export interface IInputStateUpdates<D = any, R = any> {
  nodeStart?: number;
  commands: Array<string>;
  args?: Record<string, ArgType>;
  exhausted: boolean;
  options: Array<IOption>;
  run?: (opt?: D) => R;
}

export interface IConfig<C extends ICommand = ICommand> {
  searchFn?: SearchFn;
  onUpdate: (updates: IInputStateUpdates) => void;
  command: C;
  value?: string;
  index?: number;
}

interface ISearchArgs {
  source: string;
  search: string;
}

const commandOptions = (options: {
  commands: ICommands;
  inputValue: string;
  searchFn: SearchFn;
  search?: string;
  sliceStart?: number;
  sliceEnd?: number;
}): Array<IOption> =>
  Object.keys(options.commands).reduce((acc: Array<IOption>, key) => {
    if (
      !options.search ||
      options.searchFn({ source: key, search: options.search })
    ) {
      const { sliceStart, sliceEnd, inputValue } = options;
      console.log({ sliceStart, sliceEnd, inputValue });

      const newInputValueStart =
        inputValue && sliceStart !== undefined
          ? inputValue.slice(0, sliceStart) + key
          : key;
      const newInputValue =
        newInputValueStart +
        (inputValue && sliceEnd !== undefined
          ? inputValue.slice(sliceEnd)
          : '');

      acc.push({
        value: key,
        data: options.commands[key],
        inputValue: newInputValue,
        cursorTarget: newInputValueStart.length,
        searchValue: options.search,
      });
    }

    return acc;
  }, []);

const argsOptions = (options: {
  args: ICommandArgs;
  inputValue: string;
  searchFn: SearchFn;
  search?: string;
  sliceStart?: number;
  sliceEnd?: number;
  exclude?: Array<string>;
}): Array<IOption> => {
  const search = options.search
    ? options.search?.replace(/^-(-?)/, '')
    : undefined;

  return Object.keys(options.args).reduce((acc: Array<IOption>, key) => {
    if (options.exclude && options.exclude.includes(key)) {
      return acc;
    }

    if (!search || options.searchFn({ source: key, search })) {
      const value = `--${key}`;
      const { sliceStart, sliceEnd, inputValue } = options;

      const newInputValueStart =
        inputValue && sliceStart !== undefined
          ? inputValue.slice(0, sliceStart) + value
          : value;
      const newInputValue =
        newInputValueStart +
        (inputValue && sliceEnd !== undefined
          ? inputValue.slice(sliceEnd)
          : '');

      acc.push({
        value,
        data: options.args[key],
        inputValue: newInputValue,
        cursorTarget: newInputValueStart.length,
        searchValue: search,
      });
    }

    return acc;
  }, []);
};

const valueOptions = (options: {
  commands: ICommands;
  inputValue: string;
  searchFn: SearchFn;
  search?: string;
  sliceStart?: number;
  sliceEnd?: number;
}): Array<IOption> =>
  Object.keys(options.commands).reduce((acc: Array<IOption>, key) => {
    if (
      !options.search ||
      options.searchFn({ source: key, search: options.search })
    ) {
      const { sliceStart, sliceEnd, inputValue } = options;
      console.log({ sliceStart, sliceEnd, inputValue });

      const newInputValueStart =
        inputValue && sliceStart !== undefined
          ? inputValue.slice(0, sliceStart) + key
          : key;
      const newInputValue =
        newInputValueStart +
        (inputValue && sliceEnd !== undefined
          ? inputValue.slice(sliceEnd)
          : '');

      acc.push({
        value: key,
        data: options.commands[key],
        inputValue: newInputValue,
        cursorTarget: newInputValueStart.length,
        searchValue: options.search,
      });
    }

    return acc;
  }, []);

const getRootCommands = async (
  ast: IAst,
  command: ICommand,
  search?: string,
): Promise<ICommands | null> => {
  if (ast.command?.ref.commands) {
    const { commands } = ast.command.ref;

    return typeof commands === 'object' ? commands : commands(search);
  }

  if (command?.commands) {
    const { commands } = command;

    return typeof commands === 'object' ? commands : commands(search);
  }

  return null;
};

export const createInput = (config: IConfig) => {
  // const commandsCache: Record<string, ICommands> = {};
  // const optionsCache: Record<string, Array<IArgsOption>> = {};
  const searchFn =
    config.searchFn ||
    ((opt: { source: string; search: string }) =>
      opt.source.toLowerCase().includes(opt.search.toLowerCase()));

  let updatedAt = Date.now();
  let value = config.value || '';
  let index = config.index || 0;

  const processUpdates = async () => {
    const current = updatedAt;

    const ast = await resolve(value, config.command);

    if (current !== updatedAt) {
      // Bail if an update happened before this function completes
      return;
    }

    const currentNode = find(ast, index);

    const commands = ast.command ? commandPath(ast.command) : [];
    const last = commands[commands.length - 1];
    const args = last ? toArgs(last) : undefined;
    const parsedArgKeys =
      args && args.parsed ? Object.keys(args.parsed) : undefined;
    const options: Array<IOption> = [];

    let nodeStart = 0;

    if (currentNode && 'token' in currentNode) {
      nodeStart = currentNode.token.start;
    }

    if (!value) {
      console.log(1);
      // Handle top-level options when there is no input value
      const rootCommands = await getRootCommands(ast, config.command);
      console.log(rootCommands);
      if (rootCommands) {
        options.push(
          ...commandOptions({
            inputValue: value,
            commands: rootCommands,
            searchFn,
          }),
        );
      }
    } else if (currentNode?.kind === 'ARG_FLAG') {
      console.log(1.2, 'handle:', { ast, index, value, currentNode });
    } else if (currentNode?.kind === 'ARG_KEY') {
      console.log(1.3, 'handle:', { ast, index, value, currentNode });
      nodeStart = currentNode.token.start;
      const argsMap = currentNode.parent.parent.parent?.ref.args || {
        [currentNode.token.value.replace(/^-(-?)/, '')]: currentNode.parent.ref,
      };
      console.log(argsMap);

      options.push(
        ...argsOptions({
          searchFn,
          sliceStart: nodeStart,
          sliceEnd: currentNode.token.end,
          search: value.slice(nodeStart, index),
          inputValue: value,
          args: argsMap,
          // exclude: parsedArgKeys,
        }),
      );
    } else if (currentNode) {
      console.log(2, 'handle:', { ast, index, value, currentNode });
    } else {
      console.log(3);
      const atWhitespace = value[index - 1] === ' ';
      const previous = closestPrevious(ast, index);

      const sliceStart =
        previous && 'token' in previous ? previous.token.start : index;

      const search = value.slice(sliceStart, index).trim();

      // nodeStart = index;
      // if (!atWhitespace) {
      // console.log(3.01, { search, value, previous, atWhitespace });
      // nodeStart = index;
      // } else
      if (previous?.kind === 'COMMAND' && atWhitespace) {
        if (typeof previous.ref.commands === 'object') {
          console.log(3.1, { search, value, previous, atWhitespace });
          nodeStart = index;
          options.push(
            ...commandOptions({
              searchFn,
              sliceStart: nodeStart,
              // search: undefined,
              inputValue: value,
              commands: previous.ref.commands,
            }),
          );
        }

        if (previous.ref.args) {
          console.log(3.11, { search, value, previous, atWhitespace });
          nodeStart = index;
          options.push(
            ...argsOptions({
              searchFn,
              sliceStart: nodeStart,
              // search: undefined,
              inputValue: value,
              args: previous.ref.args,
              exclude: parsedArgKeys,
            }),
          );
        }
      } else if (previous?.kind === 'REMAINDER') {
        if (previous.argNodeCtx) {
          console.log(3.21, { previous, search, value });
        } else if (previous.cmdNodeCtx?.ref.args) {
          console.log(3.22, { previous, search, value });
          const { token } = previous;
          nodeStart = token.start;
          options.push(
            ...argsOptions({
              searchFn,
              sliceStart: nodeStart,
              search: token.value.replace(/^-(-?)/, ''),
              inputValue: value,
              args: previous.cmdNodeCtx.ref.args,
              exclude: parsedArgKeys,
            }),
          );
        } else {
          // Handle top-level options when there is no parent command
          console.log(3.23, { previous, search, value });
          const rootCommands = await getRootCommands(
            ast,
            config.command,
            search,
          );
          if (rootCommands) {
            nodeStart = previous.token.start;
            options.push(
              ...commandOptions({
                inputValue: value,
                commands: rootCommands,
                searchFn,
                sliceStart: nodeStart,
                search: previous.token.value,
              }),
            );
          }
        }
      } else if (atWhitespace && previous?.kind === 'ARG_VALUE') {
        console.log(3.3, { ast, index, value, previous });
        nodeStart = index;
        const argsMap = previous.parent.parent.ref.args;

        if (argsMap) {
          options.push(
            ...argsOptions({
              searchFn,
              sliceStart: nodeStart,
              inputValue: value,
              args: argsMap,
              exclude: parsedArgKeys,
            }),
          );
        }
      } else if (atWhitespace && previous?.kind === 'ARG_FLAG') {
        nodeStart = index;
        const argsMap = previous.parent.ref.args;

        if (argsMap) {
          options.push(
            ...argsOptions({
              searchFn,
              sliceStart: nodeStart,
              inputValue: value,
              args: argsMap,
              exclude: parsedArgKeys,
            }),
          );
        }
      } else if (atWhitespace && previous?.kind === 'ARG_KEY') {
        nodeStart = index;
        //
      } else if (!atWhitespace && previous && 'token' in previous) {
        nodeStart = previous.token.start;
      } else {
        console.log(3.4, { ast, index, value, previous });
      }
    }

    config.onUpdate({
      args: args?.parsed,
      nodeStart,
      exhausted: !!args?.exhausted && !last.ref.commands,
      commands: commands.map((c) => c.token.value),
      options,
    });
  };

  const update = (updates: { index?: number; value?: string }) => {
    if (updates.index !== undefined) {
      index = updates.index;
      updatedAt = Date.now();
    }

    if (updates.value !== undefined) {
      value = updates.value;
      // ast = parse(value, config.command);
      updatedAt = Date.now();
    }

    processUpdates();
  };

  processUpdates();

  return update;
};
