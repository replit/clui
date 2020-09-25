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
  /*
   * This map is used for caching the result of aynsc `commands`
   * functions between calls to `update`
   */
  const commandsCache: Record<string, ICommands> = {};

  /*
   * This map is used for caching the result of aysnc `options`
   * functions between calls to `update`
   */
  const optionsCache: Record<string, Array<IArgsOption>> = {};

  /*
   * Allow user to provide a search function, otherwise use a simple
   * match function
   */
  const searchFn =
    config.searchFn ||
    ((opt: { source: string; search: string }) =>
      opt.source.toLowerCase().includes(opt.search.toLowerCase()));

  /*
   * Used to invalidate outdated update logic. This is necessary when
   * a call to `update` is made before the previous update has completed
   */
  let updatedAt = Date.now();

  // Set initial state
  let value = config.value || '';
  let index = config.index || 0;

  /*
   * This is called on initializaton and every time `update` is called. It
   * calculates possible next states and returns them as options. The index
   * (ie cursor position) and the value (ie user input) are used to determine
   * the options. It can be thought of as an "autocomplete engine".
   */
  const processUpdates = async () => {
    // Everything leading up to the user's cursor
    const valueStart = value.slice(0, index);

    // Store the time started calling this function
    const current = updatedAt;

    /*
     * Create an AST using the current input value and command configuration.
     * This has a side-effect of populating `commandsCache` with resolved
     * values from async `commands` functions.
     */
    const ast = await resolve({
      input: value,
      command: config.command,
      cache: commandsCache,
    });

    // We want to do slightly different things based on this
    const atWhitespace = value[index - 1] === ' ';

    if (value.length > index || atWhitespace) {
      /*
       * This is some special-case logic for when the cursor follows a space or
       * is not positioned at the end of the input value.
       *
       * TODO: look into removing this by passing `index` to `resolve` above
       */
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

    /*
     * If the cursor is not positioned at the end of the input we're
     * positioned on a `currentNode`
     */
    const currentNode = find(ast, index);

    // Get an array of the currently resolved command path
    const astCommands = ast.command ? commandPath(ast.command) : [];

    // The last command in the command path is the current matched command
    const last = astCommands[astCommands.length - 1];
    const args = last ? toArgs(last) : undefined;
    const parsedArgKeys =
      args && args.parsed ? Object.keys(args.parsed) : undefined;

    // These are the next possible states we can suggest
    const options: Array<IOption> = [];

    // The index from where to suggest the next state from
    let nodeStart = 0;

    if (currentNode && 'token' in currentNode) {
      /*
       * We're positioned on a `currentNode`, use it's starting location
       * as point from which to suggest options from.
       *
       * Example:
       *
       * Say there are 2 sub=commands under user
       * - "user add"
       * - "user update"
       *
       * If the input string is "user ad" and cursor position is "user a|".
       * We suggest:
       *  - user add
       *  - user update
       */
      nodeStart = currentNode.token.start;
    }

    const commonParams = {
      parsedArgKeys,
      value,
      index,
    };

    /*
     * Initialize a function with some configuration options.
     *
     * TODO: does this need to be in `processUpdates`?
     */
    const getOptions = optionsProvider({
      includeExactMatch: config.includeExactMatch,
      command: config.command,
      commandsCache,
      optionsCache,
      searchFn,
    });

    if (!value) {
      /*
       * The input is empty. We handle top-level options here
       *
       * TODO: could an empty AST object handle this special case?
       */

      /*
       * If provided with an `options` function on the root command, resolve the
       * function and add the result to options. No need to filter here since
       * the input is empty (so there's no string to filter by).
       *
       * Example:
       *
       * ```ts
       * const rootCommand = {
       *   options: async () => {
       *     return [...topLevelOptions]
       *   }
       * }
       * ```
       */
      if (typeof config.command.options === 'function') {
        const optionsFn = config.command.options;
        const results = await optionsFn();

        if (current !== updatedAt) {
          // Bail if an update happened before this function completes
          return;
        }

        options.push(
          ...results.map((result) => {
            const inputValue = result.value;

            return {
              value: result.value,
              inputValue,
              cursorTarget: inputValue.length,
              data: result,
            };
          }),
        );
      }

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
      /*
       * The cursor is positied on a node
       */
      if (currentNode.kind === 'ARG_VALUE') {
        const search = value.slice(nodeStart, index);
        const { ref } = currentNode.parent;

        if (typeof ref.options === 'function' && !optionsCache[valueStart]) {
          /*
           * Handle options function for arguments
           *
           * Examples:
           * "view-user --username abc"
           * "view-user --email xyz"
           *
           * ```
           * const rootCommand = {
           *   'view-user': {
           *     args: {
           *       username: {
           *         options: (search) => searchByUsername(search)
           *       },
           *       email: {
           *         options: (search) => searchByUsername(email)
           *       }
           *     }
           *   }
           * }
           * ```
           */
          const argOptions = await ref.options(search || undefined);
          if (argOptions) {
            /*
             * Add to cache. `getOptions` below will read this value from the cache
             * cache and add results top `options`
             */
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
        // If the previous character is not a space `nodeStart
        // is the start of the previous node
        nodeStart = previousNode.token.start;
      } else {
        // The previous character is a space. `nodeStart` is the smae
        // as the index (ie cursor position)
        nodeStart = index;
      }

      const search = !atWhitespace
        ? value.slice(nodeStart, index).trim()
        : undefined;

      if (previousNode) {
        // Cursor is at the end of the input. Get options based on the previous node
        if (
          previousNode.kind === 'COMMAND' &&
          index > previousNode.token.end &&
          typeof previousNode?.ref.options === 'function'
        ) {
          /*
           * Handle `command.options` function
           *
           * Examples:
           * input: "search "
           *
           * ```
           * const rootCommand = {
           *   search: {
           *     options: async (query) => {
           *       // query == undefined
           *       return searchApi.search(query)
           *     }
           *   }
           * }
           * ```
           */
          const optionsFn = previousNode.ref.options;
          const prefix = ast.source.slice(0, nodeStart - 1);
          const suffix = ast.source.slice(nodeStart);
          const searchValue = suffix.trimLeft() || undefined;
          // TODO cache like commands/arg options?
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
          /*
           * Handle `command.options` function with search value
           *
           * Examples:
           * input: "search foo bar"
           *
           * ```
           * const rootCommand = {
           *   search: {
           *     options: async (query) => {
           *       // query == "foo bar"
           *       return searchApi.search(query)
           *     }
           *   }
           * }
           * ```
           */
          const optionsFn = previousNode.cmdNodeCtx.ref.options;
          const prefix = ast.source.slice(0, nodeStart - 1);
          const suffix = ast.source.slice(nodeStart);
          const searchValue = suffix.trimLeft() || undefined;
          const results = await optionsFn(searchValue);

          if (current !== updatedAt) {
            // Bail if an update happened before this function completes
            return;
          }

          options.push(
            ...results.map((result) => {
              const inputValue =
                previousNode.token.start === 0
                  ? result.value
                  : `${prefix} ${result.value}`;

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
          // Handle cursor position with key value "user --username ab"
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
          // Handle cursor after arg key: "user --username "
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
      updatedAt = Date.now();
    }

    processUpdates();
  };

  processUpdates();

  return update;
};
