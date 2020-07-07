import { commandOptions, valueOptions, argsOptions } from './optionsList';
import { ASTNodeKind, ASTNode } from './ast';
import { ICommands, ICommand, IArgsOption, SearchFn, IOption } from './types';

interface IConfig {
  includeExactMatch?: boolean;
  command: ICommand;
  commandsCache: Record<string, ICommands>;
  optionsCache: Record<string, Array<IArgsOption>>;
  searchFn: SearchFn;
}

interface IParams {
  currentNode?: ASTNode;
  previousNode?: ASTNode;
  index: number;
  value: string;
  parsedArgKeys?: Array<string>;
}

interface INodeParams extends IParams {
  valueStart: string;
  search?: string;
  atWhitespace: boolean;
  nodeStart: number;
}

type Options = Array<IOption>;
type OptionsFn = (params: INodeParams, config: IConfig) => Options;

const NodeTypes: Record<ASTNodeKind, OptionsFn> = {
  COMMAND: (params, config) => {
    const { commandsCache, searchFn } = config;
    const {
      currentNode,
      previousNode,
      search,
      value,
      valueStart,
      nodeStart,
      parsedArgKeys,
    } = params;

    if (currentNode?.kind === 'COMMAND') {
      let parentCommands =
        currentNode.parent?.ref.commands || config.command.commands;

      if (typeof parentCommands === 'function' && commandsCache[valueStart]) {
        parentCommands = commandsCache[valueStart];
      }

      if (typeof parentCommands === 'object') {
        return commandOptions({
          commands: parentCommands,
          searchFn,
          sliceStart: nodeStart,
          sliceEnd: currentNode.token.end,
          search,
          inputValue: value,
        });
      }
    }

    if (previousNode?.kind === 'COMMAND') {
      const options: Options = [];
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

      return options;
    }

    return [];
  },

  ARG_KEY: (params, config) => {
    const { searchFn, optionsCache } = config;
    const {
      currentNode,
      previousNode,
      search,
      value,
      valueStart,
      nodeStart,
    } = params;

    const options: Options = [];

    if (currentNode?.kind === 'ARG_KEY') {
      const argsMap = currentNode.parent.parent.parent?.ref.args || {
        [currentNode.token.value.replace(/^-(-?)/, '')]: currentNode.parent.ref,
      };

      options.push(
        ...argsOptions({
          searchFn,
          sliceStart: nodeStart,
          sliceEnd: currentNode.token.end,
          search,
          inputValue: value,
          args: argsMap,
        }),
      );
    }

    if (previousNode?.kind === 'ARG_KEY') {
      const { ref } = previousNode.parent;
      let argOptions: Array<IArgsOption> | null = null;

      if (Array.isArray(ref.options)) {
        argOptions = ref.options;
      } else if (optionsCache[valueStart]) {
        argOptions = optionsCache[valueStart];
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

    return options;
  },

  ARG_VALUE: (params, config) => {
    const { optionsCache, searchFn } = config;
    const {
      currentNode,
      previousNode,
      search,
      value,
      valueStart,
      atWhitespace,
      nodeStart,
      parsedArgKeys,
    } = params;

    const options: Options = [];

    if (currentNode?.kind === 'ARG_VALUE') {
      const { ref } = currentNode.parent;
      let argOptions: Array<IArgsOption> | null = null;

      if (Array.isArray(ref.options)) {
        argOptions = ref.options;
      } else if (optionsCache[valueStart]) {
        argOptions = optionsCache[valueStart];
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

    if (previousNode?.kind === 'ARG_VALUE' && atWhitespace) {
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
    }

    if (previousNode?.kind === 'ARG_VALUE' && !atWhitespace) {
      const { ref } = previousNode.parent;
      let argOptions: Array<IArgsOption> | null = null;

      if (Array.isArray(ref.options)) {
        argOptions = ref.options;
      } else if (optionsCache[valueStart]) {
        argOptions = optionsCache[valueStart];
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

    return options;
  },

  ARG_FLAG: (params, config) => {
    const { searchFn, commandsCache } = config;
    const {
      currentNode,
      previousNode,
      search,
      value,
      valueStart,
      nodeStart,
      parsedArgKeys,
    } = params;

    const options: Options = [];

    if (currentNode?.kind === 'ARG_FLAG') {
      const argsMap = currentNode.parent?.ref.args || {
        [currentNode.token.value.replace(/^-(-?)/, '')]: currentNode.ref,
      };

      options.push(
        ...argsOptions({
          searchFn,
          sliceStart: nodeStart,
          sliceEnd: currentNode.token.end,
          search,
          inputValue: value,
          args: argsMap,
        }),
      );
    }

    if (previousNode?.kind === 'ARG_FLAG') {
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
    }

    return options;
  },

  ARG: () => [],

  REMAINDER: (params, config) => {
    const { commandsCache, searchFn } = config;
    const {
      currentNode,
      previousNode,
      search,
      value,
      valueStart,
      nodeStart,
      atWhitespace,
      parsedArgKeys,
    } = params;

    const options: Options = [];

    if (currentNode?.kind === 'REMAINDER' && currentNode.cmdNodeCtx) {
      const argsMap = currentNode.cmdNodeCtx.ref.args;

      if (argsMap) {
        options.push(
          ...argsOptions({
            args: argsMap,
            searchFn,
            sliceStart: nodeStart,
            sliceEnd: currentNode.token.end,
            search,
            inputValue: value,
          }),
        );
      }

      if (currentNode.cmdNodeCtx.ref.commands) {
        let commands: ICommands | null = null;
        const { ref } = currentNode.cmdNodeCtx;

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
      }
    }

    if (
      previousNode?.kind === 'REMAINDER' &&
      previousNode.cmdNodeCtx &&
      !atWhitespace
    ) {
      const { token } = previousNode;
      if (previousNode.cmdNodeCtx?.ref.args) {
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
        let commands: ICommands | null = null;
        const { ref } = previousNode.cmdNodeCtx;

        if (typeof ref.commands === 'object') {
          commands = ref.commands;
        } else if (typeof ref.commands === 'function') {
          commands = commandsCache[valueStart];
        }
        // Handle top-level options when there is no parent command
        if (commands) {
          options.push(
            ...commandOptions({
              inputValue: value,
              commands,
              searchFn,
              sliceStart: nodeStart,
              search: token.value,
            }),
          );
        }
      }
    }

    return options;
  },

  PENDING: (__params) => [],
};

export const optionsProvider = (config: IConfig) => (
  params: IParams,
): Options => {
  if (!params.value) {
    return [];
  }

  const valueStart = params.value.slice(0, params.index);
  const atWhitespace = params.value[params.index - 1] === ' ';

  if (params.currentNode && NodeTypes[params.currentNode.kind]) {
    let nodeStart = 0;

    if ('token' in params.currentNode) {
      nodeStart = params.currentNode.token.start;
    }

    const search = params.value.slice(nodeStart, params.index) || undefined;

    return NodeTypes[params.currentNode.kind](
      { valueStart, nodeStart, search, atWhitespace, ...params },
      config,
    );
  }

  if (params.previousNode && NodeTypes[params.previousNode.kind]) {
    let nodeStart = 0;
    if (
      !atWhitespace &&
      params.previousNode &&
      'token' in params.previousNode
    ) {
      nodeStart = params.previousNode.token.start;
    } else {
      nodeStart = params.index;
    }

    const search = !atWhitespace
      ? params.value.slice(nodeStart, params.index).trim()
      : undefined;

    const options: Options = [];

    if (
      config.includeExactMatch &&
      'token' in params.previousNode &&
      params.previousNode.token.value === search
    ) {
      const { previousNode } = params;
      const value = `${previousNode.token.value} `;
      const inputValue = params.value.slice(0, nodeStart) + value;

      let data: any;

      if ('ref' in previousNode) {
        data = previousNode.ref;
      } else if ('parent' in previousNode) {
        data = previousNode.parent.ref;
      }

      if (data) {
        options.push({
          cursorTarget: inputValue.length,
          value,
          inputValue,
          data,
        });
      }
    }

    options.push(
      ...NodeTypes[params.previousNode.kind](
        { valueStart, nodeStart, search, atWhitespace, ...params },
        config,
      ),
    );

    return options;
  }

  return [];
};
