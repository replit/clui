import { find, closestPrevious, IAst, commandPath, toArgs } from './ast';
import {
  ICommands,
  ICommand,
  IOption,
  ArgType,
  ArgsMap,
  ICommandArgs,
  IArgsOption,
} from './types';
import { resolve } from './resolver';

type SearchFn = (args: ISearchArgs) => boolean;

export interface IInputUpdates<D = any, R = any> {
  nodeStart?: number;
  commands: Array<{ name: string; args?: ArgsMap }>;
  args?: Record<string, ArgType>;
  exhausted: boolean;
  options: Array<IOption>;
  run?: (opt?: D) => R;
}

export interface IConfig<C extends ICommand = ICommand> {
  searchFn?: SearchFn;
  onUpdate: (updates: IInputUpdates) => void;
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

const valueOptions = <V extends { value: string }>(options: {
  options: Array<V>;
  inputValue: string;
  searchFn: SearchFn;
  search?: string;
  sliceStart?: number;
  sliceEnd?: number;
}): Array<IOption> =>
  options.options.reduce((acc: Array<IOption>, option) => {
    const key = option.value;
    if (
      !options.search ||
      options.searchFn({ source: key, search: options.search })
    ) {
      const { sliceStart, sliceEnd, inputValue } = options;

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
        data: option,
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
  const commandsCache: Record<string, ICommands> = {};
  const optionsCache: Record<string, Array<IArgsOption>> = {};

  const searchFn =
    config.searchFn ||
    ((opt: { source: string; search: string }) =>
      opt.source.toLowerCase().includes(opt.search.toLowerCase()));

  let updatedAt = Date.now();
  let value = config.value || '';
  let index = config.index || 0;

  const processUpdates = async () => {
    const valueStart = value.slice(0, index);
    const current = updatedAt;

    const ast = await resolve({
      input: value,
      command: config.command,
      cache: commandsCache,
    });

    const currentNode = find(ast, index);

    if (value.length > index) {
      const previousNode = closestPrevious(ast, index);
      if (
        previousNode?.kind === 'COMMAND' &&
        typeof previousNode.ref.commands === 'function' &&
        !commandsCache[valueStart]
      ) {
        const search = valueStart.slice(previousNode.token.end).trim();
        const result = await previousNode.ref.commands(search || undefined);

        if (result) {
          commandsCache[valueStart] = result;
        }
      }
    }

    const astCommands = ast.command ? commandPath(ast.command) : [];

    if (current !== updatedAt) {
      // Bail if an update happened before this function completes
      return;
    }

    const last = astCommands[astCommands.length - 1];
    const args = last ? toArgs(last) : undefined;
    const parsedArgKeys =
      args && args.parsed ? Object.keys(args.parsed) : undefined;
    const options: Array<IOption> = [];

    let nodeStart = 0;

    if (currentNode && 'token' in currentNode) {
      nodeStart = currentNode.token.start;
    }

    if (!value) {
      // Handle top-level options when there is no input value
      const rootCommands = await getRootCommands(ast, config.command);

      if (current !== updatedAt) {
        // Bail if an update happened before this function completes
        return;
      }

      if (rootCommands) {
        options.push(
          ...commandOptions({
            inputValue: value,
            commands: rootCommands,
            searchFn,
          }),
        );
      }
    } else if (currentNode?.kind === 'COMMAND') {
      let parentCommands =
        currentNode.parent?.ref.commands || config.command.commands;

      if (typeof parentCommands === 'function' && commandsCache[valueStart]) {
        parentCommands = commandsCache[valueStart];
      }

      if (typeof parentCommands === 'object') {
        options.push(
          ...commandOptions({
            commands: parentCommands,
            searchFn,
            sliceStart: nodeStart,
            sliceEnd: currentNode.token.end,
            search: value.slice(nodeStart, index),
            inputValue: value,
          }),
        );
      }
    } else if (currentNode?.kind === 'ARG_VALUE') {
      const search = value.slice(nodeStart, index);
      const { ref } = currentNode.parent;

      let argOptions: Array<IArgsOption> | null = null;

      if (Array.isArray(ref.options)) {
        argOptions = ref.options;
      } else if (typeof ref.options === 'function') {
        if (optionsCache[valueStart]) {
          argOptions = optionsCache[valueStart];
        } else {
          argOptions = await ref.options(search || undefined);
          if (current !== updatedAt) {
            // Bail if an update happened before this function completes
            return;
          }

          if (argOptions) {
            optionsCache[valueStart] = argOptions;
          }
        }
      }

      if (argOptions) {
        options.push(
          ...valueOptions({
            options: argOptions,
            search,
            searchFn,
            sliceStart: nodeStart,
            inputValue: value,
          }),
        );
      }
    } else if (currentNode?.kind === 'ARG_FLAG') {
      const argsMap = currentNode.parent?.ref.args || {
        [currentNode.token.value.replace(/^-(-?)/, '')]: currentNode.ref,
      };

      options.push(
        ...argsOptions({
          searchFn,
          sliceStart: nodeStart,
          sliceEnd: currentNode.token.end,
          search: value.slice(nodeStart, index),
          inputValue: value,
          args: argsMap,
        }),
      );
    } else if (currentNode?.kind === 'ARG_KEY') {
      const argsMap = currentNode.parent.parent.parent?.ref.args || {
        [currentNode.token.value.replace(/^-(-?)/, '')]: currentNode.parent.ref,
      };

      options.push(
        ...argsOptions({
          searchFn,
          sliceStart: nodeStart,
          sliceEnd: currentNode.token.end,
          search: value.slice(nodeStart, index),
          inputValue: value,
          args: argsMap,
        }),
      );
    } else if (currentNode?.kind === 'REMAINDER') {
      if (currentNode.cmdNodeCtx) {
        const argsMap = currentNode.cmdNodeCtx.ref.args;

        if (argsMap) {
          options.push(
            ...argsOptions({
              args: argsMap,
              searchFn,
              sliceStart: nodeStart,
              sliceEnd: currentNode.token.end,
              search: value.slice(nodeStart, index),
              inputValue: value,
            }),
          );
        }
      }
    } else {
      const atWhitespace = value[index - 1] === ' ';
      const previousNode = closestPrevious(ast, index);

      // TODO: fix lastIndexOf logic when inside quoted string (ie: add -m "a b")
      const sliceStart = atWhitespace ? index : value.lastIndexOf(' ') + 1;
      const search = !atWhitespace
        ? value.slice(sliceStart, index).trim()
        : undefined;

      nodeStart = sliceStart;

      if (previousNode?.kind === 'COMMAND') {
        if (previousNode.ref.args) {
          options.push(
            ...argsOptions({
              searchFn,
              sliceStart: nodeStart,
              search,
              inputValue: value,
              args: previousNode.ref.args,
              exclude: parsedArgKeys,
            }),
          );
        }

        let commands: ICommands | null = null;
        const { ref } = previousNode;

        if (typeof ref.commands === 'object') {
          commands = ref.commands;
        } else if (typeof ref.commands === 'function') {
          commands = commandsCache[valueStart];
        }

        if (commands) {
          options.push(
            ...commandOptions({
              searchFn,
              sliceStart: nodeStart,
              search,
              inputValue: value,
              commands,
            }),
          );
        }
      } else if (previousNode?.kind === 'REMAINDER') {
        if (previousNode.cmdNodeCtx?.ref.args) {
          const { token } = previousNode;
          nodeStart = token.start;
          options.push(
            ...argsOptions({
              searchFn,
              sliceStart: nodeStart,
              search: token.value.replace(/^-(-?)/, ''),
              inputValue: value,
              args: previousNode.cmdNodeCtx.ref.args,
              exclude: parsedArgKeys,
            }),
          );
        } else {
          // Handle top-level options when there is no parent command
          const rootCommands = await getRootCommands(
            ast,
            config.command,
            search,
          );

          if (rootCommands) {
            nodeStart = previousNode.token.start;
            options.push(
              ...commandOptions({
                inputValue: value,
                commands: rootCommands,
                searchFn,
                sliceStart: nodeStart,
                search: previousNode.token.value,
              }),
            );
          }
        }
      } else if (previousNode?.kind === 'ARG_VALUE' && atWhitespace) {
        const argsMap = previousNode.parent.parent.ref.args;

        if (argsMap) {
          options.push(
            ...argsOptions({
              search,
              searchFn,
              sliceStart: nodeStart,
              inputValue: value,
              args: argsMap,
              exclude: parsedArgKeys,
            }),
          );
        }
      } else if (previousNode?.kind === 'ARG_VALUE') {
        let argOptions: Array<IArgsOption> | null = null;
        const { ref } = previousNode.parent;

        if (Array.isArray(ref.options)) {
          argOptions = ref.options;
        } else if (typeof ref.options === 'function') {
          if (optionsCache[valueStart]) {
            argOptions = optionsCache[valueStart];
          } else {
            argOptions = await ref.options(search || undefined);
            if (current !== updatedAt) {
              // Bail if an update happened before this function completes
              return;
            }

            if (argOptions) {
              optionsCache[valueStart] = argOptions;
            }
          }
        }

        if (argOptions) {
          options.push(
            ...valueOptions({
              options: argOptions,
              search,
              searchFn,
              sliceStart: nodeStart,
              inputValue: value,
            }),
          );
        }
      } else if (previousNode?.kind === 'ARG_FLAG') {
        const argsMap = previousNode.parent.ref.args;

        if (argsMap) {
          options.push(
            ...argsOptions({
              search,
              searchFn,
              sliceStart: nodeStart,
              inputValue: value,
              args: argsMap,
              exclude: parsedArgKeys,
            }),
          );
        }

        let commands: ICommands | null = null;
        const { ref } = previousNode.parent;

        if (typeof ref.commands === 'object') {
          commands = ref.commands;
        } else if (typeof ref.commands === 'function') {
          commands = commandsCache[valueStart];
        }

        if (commands) {
          options.push(
            ...commandOptions({
              searchFn,
              sliceStart: nodeStart,
              search,
              inputValue: value,
              commands,
            }),
          );
        }
      } else if (previousNode?.kind === 'ARG_KEY') {
        let argOptions: Array<IArgsOption> | null = null;
        const { ref } = previousNode.parent;

        if (Array.isArray(ref.options)) {
          argOptions = ref.options;
        } else if (typeof ref.options === 'function') {
          if (optionsCache[valueStart]) {
            argOptions = optionsCache[valueStart];
          } else {
            argOptions = await ref.options(search || undefined);
            if (current !== updatedAt) {
              // Bail if an update happened before this function completes
              return;
            }

            if (argOptions) {
              optionsCache[valueStart] = argOptions;
            }
          }
        }

        if (argOptions) {
          options.push(
            ...valueOptions({
              options: argOptions,
              search,
              searchFn,
              sliceStart: nodeStart,
              inputValue: value,
            }),
          );
        }
      }
    }

    let run: void | (<O = any>(o?: O) => any);

    const commandsList = astCommands.map((c) => {
      const cargs = toArgs(c);

      return {
        args: cargs.parsed,
        name: c.token.value,
      };
    });

    if (last && last.ref.run) {
      const { run: refRun } = last.ref;
      run = <O>(opt: O): any =>
        refRun({
          commands: commandsList,
          args: commandsList[commandsList.length - 1].args,
          options: opt,
        });
    }

    config.onUpdate({
      args: args?.parsed,
      nodeStart,
      exhausted: !!args?.exhausted && !last.ref.commands,
      commands: commandsList,
      options,
      run: run || undefined,
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
