import { find, closestPrevious, IAst, commandPath, toArgs } from './ast';
import {
  ICommands,
  ICommand,
  IOption,
  ArgType,
  ArgsMap,
  IArgsOption,
  SearchFn,
} from './types';
import { resolve } from './resolver';
import { commandOptions } from './optionsList';
import { optionsProvider } from './options';

export interface IInputUpdates<D = any, R = any> {
  ast: IAst;
  nodeStart?: number;
  commands: Array<{ name: string; args?: ArgsMap }>;
  args?: Record<string, ArgType>;
  exhausted: boolean;
  options: Array<IOption>;
  run?: (opt?: D) => R;
}

export interface IConfig<C extends ICommand = ICommand> {
  searchFn?: SearchFn;
  includeExactMatch?: boolean;
  onUpdate: (updates: IInputUpdates) => void;
  command: C;
  value?: string;
  index?: number;
}

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

    const atWhitespace = value[index - 1] === ' ';

    if (value.length > index || atWhitespace) {
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
      } else if (
        !atWhitespace &&
        previousNode?.kind === 'REMAINDER' &&
        typeof previousNode.cmdNodeCtx?.ref.commands === 'function'
      ) {
        const search = valueStart.slice(previousNode.token.start).trim();
        const result = await previousNode.cmdNodeCtx.ref.commands(
          search || undefined,
        );

        if (result) {
          commandsCache[valueStart] = result;
        }
      }
    }

    if (current !== updatedAt) {
      // Bail if an update happened before this function completes
      return;
    }

    const currentNode = find(ast, index);
    const astCommands = ast.command ? commandPath(ast.command) : [];
    const last = astCommands[astCommands.length - 1];
    const args = last ? toArgs(last) : undefined;
    const parsedArgKeys =
      args && args.parsed ? Object.keys(args.parsed) : undefined;
    const options: Array<IOption> = [];

    let nodeStart = 0;

    if (currentNode && 'token' in currentNode) {
      nodeStart = currentNode.token.start;
    }

    const commonParams = {
      parsedArgKeys,
      value,
      index,
    };

    const getOptions = optionsProvider({
      includeExactMatch: config.includeExactMatch,
      command: config.command,
      commandsCache,
      optionsCache,
      searchFn,
    });

    if (!value) {
      // Handle top-level options when there is no input value
      let rootCommands: ICommands | null = commandsCache[''] || null;

      if (!rootCommands) {
        rootCommands = await getRootCommands(ast, config.command);
        if (rootCommands) {
          commandsCache[''] = rootCommands;
        }
      }

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
    } else if (currentNode) {
      if (currentNode.kind === 'ARG_VALUE') {
        const search = value.slice(nodeStart, index);
        const { ref } = currentNode.parent;

        if (typeof ref.options === 'function' && !optionsCache[valueStart]) {
          const argOptions = await ref.options(search || undefined);
          if (argOptions) {
            optionsCache[valueStart] = argOptions;
          }

          if (current !== updatedAt) {
            return;
          }
        }
      }

      options.push(...getOptions({ currentNode, ...commonParams }));
    } else {
      const previousNode = closestPrevious(ast, index);

      if (!atWhitespace && previousNode && 'token' in previousNode) {
        nodeStart = previousNode.token.start;
      } else {
        nodeStart = index;
      }

      const search = !atWhitespace
        ? value.slice(nodeStart, index).trim()
        : undefined;

      if (previousNode) {
        if (
          previousNode.kind === 'COMMAND' &&
          typeof previousNode?.ref.options === 'function'
        ) {
          const optionsFn = previousNode.ref.options;
          const { token } = previousNode;
          const prefix = ast.source.slice(0, token.end);
          const suffix = ast.source.slice(token.end);
          const searchValue = suffix.trimLeft() || undefined;
          const results = await optionsFn(searchValue);

          if (current !== updatedAt) {
            // Bail if an update happened before this function completes
            return;
          }

          options.push(
            ...results.map((result) => {
              const inputValue = `${prefix} ${result.value}`;

              return {
                value: result.value,
                inputValue,
                cursorTarget: inputValue.length,
                searchValue,
                data: result,
              };
            }),
          );
        }

        if (
          'cmdNodeCtx' in previousNode &&
          typeof previousNode.cmdNodeCtx?.ref.options === 'function'
        ) {
          const optionsFn = previousNode.cmdNodeCtx.ref.options;
          const { token } = previousNode.cmdNodeCtx;
          const prefix = ast.source.slice(0, token.end);
          const suffix = ast.source.slice(token.end);
          const searchValue = suffix.trimLeft() || undefined;
          const results = await optionsFn(searchValue);

          if (current !== updatedAt) {
            // Bail if an update happened before this function completes
            return;
          }

          options.push(
            ...results.map((result) => {
              const inputValue = `${prefix} ${result.value}`;

              return {
                value: result.value,
                inputValue,
                cursorTarget: inputValue.length,
                searchValue,
                data: result,
              };
            }),
          );
        }

        if (previousNode.kind === 'ARG_VALUE') {
          const { ref } = previousNode.parent;

          if (typeof ref.options === 'function' && !optionsCache[valueStart]) {
            const argOptions = await ref.options(search || undefined);
            if (current !== updatedAt) {
              // Bail if an update happened before this function completes
              return;
            }

            if (argOptions) {
              optionsCache[valueStart] = argOptions;
            }
          }
        }

        if (previousNode.kind === 'ARG_KEY') {
          const { ref } = previousNode.parent;
          if (typeof ref.options === 'function' && !optionsCache[valueStart]) {
            const argOptions = await ref.options(search || undefined);
            if (current !== updatedAt) {
              // Bail if an update happened before this function completes
              return;
            }

            if (argOptions) {
              optionsCache[valueStart] = argOptions;
            }
          }
        }

        options.push(...getOptions({ previousNode, ...commonParams }));
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

    if (current !== updatedAt) {
      // Bail if an update happened before this function completes
      return;
    }

    config.onUpdate({
      ast,
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
