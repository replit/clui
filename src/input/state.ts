import { ICommands, ICommand, IOption, IResult, IArg, IArgsOption } from './types';
import resolveCommands from './resolveCommands';

import { parse } from './parser';
import { getNode, getArgs, commandPath, getArgContext, argKeys } from './util';

// const DEBUG = true;

// eslint-disable-next-line
// const debug = (...args: any) => DEBUG && console.log('DEBUG:', ...args);

interface IConfig {
  onUpdate: (updates: IInputStateUpdates) => void;
  command: ICommand;
  value?: string;
  index?: number;
}

export interface IInputStateUpdates<D = any, R = any> {
  nodeStart?: number;
  exhausted: boolean;
  options: Array<IOption>;
  run?: (opt?: D) => R;
}

function valuesToOptions<D extends { value: string }>(options: {
  values: Array<D>;
  inputValue?: string;
  filter?: string;
  sliceStart?: number;
  sliceEnd?: number;
}) {
  const { values, inputValue, sliceStart, sliceEnd } = options;
  const filter = options.filter?.trim();
  // console.log('valuesToOptions', { values, filter, inputValue, sliceStart });

  return values.reduce((acc: Array<IOption>, data) => {
    const inputValueStart =
      inputValue && sliceStart !== undefined
        ? inputValue.slice(0, sliceStart) + data.value
        : data.value;

    if ((filter && data.value.includes(filter)) || !filter) {
      acc.push({
        data,
        value: data.value,
        inputValue:
          inputValueStart +
          (data.value && sliceEnd !== undefined ? data.value.slice(sliceEnd) : ''),
        cursorTarget: inputValueStart.length,
      });
    }

    return acc;
  }, []);
}

function dataToSuggestions<D>(options: {
  data: Record<string, D>;
  value?: string;
  filter?: string;
  sliceStart?: number;
  sliceEnd?: number;
}) {
  const { data, value, sliceStart, sliceEnd } = options;
  const filter = options.filter?.trim();

  return Object.keys(data).reduce((acc: Array<IOption>, key) => {
    const inputValueStart =
      value && sliceStart !== undefined ? value.slice(0, sliceStart) + key : key;
    const inputValue =
      inputValueStart + (value && sliceEnd !== undefined ? value.slice(sliceEnd) : '');

    if ((filter && key.includes(filter)) || !filter) {
      acc.push({
        value: key,
        data: data[key],
        inputValue,
        cursorTarget: inputValueStart.length,
      });
    }

    return acc;
  }, []);
}

const argsToSuggestions = (options: {
  args: NonNullable<ICommand['args']>;
  value?: string;
  filter?: string;
  exclude?: Array<string>;
  sliceStart?: number;
  sliceEnd?: number;
}) => {
  const { args, exclude, value, sliceStart, sliceEnd } = options;
  const filter = options.filter?.trim().replace(/^-?(-)/, '');

  return Object.keys(args).reduce((acc: Array<IOption>, key) => {
    if (
      (!exclude || !exclude.includes(`--${key}`)) &&
      ((filter && key.includes(filter)) || !filter)
    ) {
      const flag = `--${key}`;

      const inputValueStart =
        value && sliceStart !== undefined ? value.slice(0, sliceStart) + flag : flag;
      const inputValue =
        inputValueStart + (value && sliceEnd !== undefined ? value.slice(sliceEnd) : '');

      acc.push({
        value: flag,
        data: args[key],
        inputValue,
        cursorTarget: inputValueStart.length,
      });
    }

    return acc;
  }, []);
};

const parseArgs = ({ cmd, args }: { cmd: ICommand; args: Record<string, string | true> }) =>
  Object.keys(args).reduce((acc: Record<string, string | boolean | number>, key) => {
    const value = args[key];

    if (cmd.args && cmd.args[key] && cmd.args[key].type) {
      const argType = cmd.args[key].type;

      if (argType === Boolean && value === true) {
        acc[key] = value;
      } else if (value !== true && argType && argType !== Boolean) {
        acc[key] = argType(value);
      }
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});

export const inputState = (config: IConfig) => {
  const commandsCache: Record<string, ICommands> = {};
  const optionsCache: Record<string, Array<IArgsOption>> = {};

  let currentCommand = config.command;
  let updatedAt = Date.now();
  let value = config.value || '';
  let index = config.index || 0;
  let ast: IResult = parse(value);

  const processUpdates = async () => {
    const currentNode = getNode(ast.result.value, index);
    const prevNode = getNode(ast.result.value, (currentNode ? currentNode?.start : index) - 1);

    let sliceStart = 0;
    let sliceEnd: undefined | number;
    if (currentNode) {
      sliceStart = currentNode.start;
      sliceEnd = currentNode.end;
    } else if (prevNode && ['COMMAND', 'ARG_KEY', 'ARG_VALUE'].includes(prevNode.type)) {
      sliceStart = prevNode.start;
    } else if (prevNode && prevNode.type === 'WHITESPACE') {
      sliceStart = prevNode.end;
    }

    const valueSlice = value.slice(sliceStart, index);
    const current = updatedAt;

    const ctx = await resolveCommands({
      root: config.command,
      cache: commandsCache,
      ast,
      index,
    });

    currentCommand = ctx.command;

    const argCtx = getArgContext({
      command: currentCommand,
      ast,
      index,
    });

    const getArgOptions = async (opt: { arg: IArg; filter?: string }) => {
      if (typeof opt.arg.options === 'object') {
        return opt.arg.options;
      }

      if (typeof opt.arg.options === 'function') {
        const cacheKey = ['arg', value, opt.filter].join(':');

        if (optionsCache[cacheKey]) {
          return optionsCache[cacheKey];
        }
        const res = await Promise.resolve(opt.arg.options(opt.filter));
        optionsCache[cacheKey] = res;

        return res;
      }

      return [];
    };

    const showArgValueOptions = () => {
      if (!currentCommand.args) {
        return false;
      }

      if (currentNode?.type === 'ARG_VALUE') {
        return true;
      }

      if (currentNode?.type === 'ARG_KEY' || currentNode?.type === 'COMMAND') {
        return false;
      }

      return true;
    };

    const argOptions =
      showArgValueOptions() && argCtx
        ? await getArgOptions({
            arg: argCtx,
            filter: valueSlice,
          })
        : undefined;

    if (current !== updatedAt) {
      return;
    }

    const showCommandOptions = () => {
      if (!ctx.commands) {
        return false;
      }

      if (prevNode?.type === 'ARG_VALUE' || currentNode?.type === 'ARG_VALUE') {
        return false;
      }

      return true;
    };

    const showArgKeyOptions = () => {
      if (!currentCommand.args) {
        return false;
      }

      if (currentNode?.type === 'ARG_KEY') {
        return true;
      }

      if (prevNode?.type === 'ARG_VALUE') {
        return false;
      }

      return true;
    };

    // debug({ prevNode, currentNode, sliceStart, valueSlice }, ctx);
    const options: Array<IOption> = [
      ...(ctx.commands && showCommandOptions()
        ? dataToSuggestions({
            value,
            data: ctx.commands,
            filter: typeof ctx.command.commands !== 'function' ? valueSlice : undefined,
            sliceStart,
            sliceEnd,
          })
        : []),
      ...(showArgKeyOptions() && currentCommand.args
        ? argsToSuggestions({
            value,
            args: currentCommand.args,
            filter: valueSlice,
            sliceStart,
            sliceEnd,
            exclude: argKeys(ast, index),
          })
        : []),
      ...(argOptions
        ? valuesToOptions({
            inputValue: value,
            values: argOptions,
            filter: typeof argCtx?.options !== 'function' ? valueSlice : undefined,
            sliceStart,
            sliceEnd,
          })
        : []),
    ];

    const run = !currentCommand.run
      ? undefined
      : <O>(opt: O) => {
          if (!currentCommand.run) {
            throw new Error(`Invalid input: "${value}"`);
          }

          const parsedArgs = parseArgs({ cmd: currentCommand, args: getArgs(ast) });

          return currentCommand.run({
            args: Object.keys(parsedArgs).length ? parsedArgs : undefined,
            commands: commandPath(ast).map((n) => n.value),
            options: opt,
          });
        };

    const exhausted = () => {
      if (currentCommand.commands) {
        return false;
      }

      if (!currentCommand.args || !Object.keys(currentCommand.args).length) {
        return true;
      }

      const parsedArgs = parseArgs({ cmd: currentCommand, args: getArgs(ast) });
      const parsedArgKeys = Object.keys(parsedArgs);
      // debug({ parsedArgs, ast });

      const remaining = currentCommand.args
        ? Object.keys(currentCommand.args).filter((key) => !parsedArgKeys.includes(key))
        : [];

      return !remaining.length;
    };

    const nodeStart = () => {
      let node = getNode(ast.result.value, index);

      if (node && node.type !== 'WHITESPACE') {
        return node.start;
      }

      node = getNode(ast.result.value, index - 1);

      if (node) {
        return node.type === 'WHITESPACE' ? index : node.start;
      }

      return 0;
    };

    config.onUpdate({
      run,
      options,
      exhausted: exhausted(),
      nodeStart: nodeStart(),
    });
  };

  const update = (updates: { index?: number; value?: string }) => {
    if (updates.index !== undefined) {
      index = updates.index;
      updatedAt = Date.now();
    }

    if (updates.value !== undefined) {
      value = updates.value;
      ast = parse(value);
      updatedAt = Date.now();
    }

    processUpdates();
  };

  processUpdates();

  return update;
};
