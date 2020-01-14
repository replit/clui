import { ICommands, ICommand /* , IArg */, IResult } from './types';
import resolveCommands from './resolveCommands';

import { parse } from './parser';
import { getNode, getArgs, commandPath } from './util';

// const DEBUG = true;

// eslint-disable-next-line
// const debug = (...args: any) => DEBUG && console.log('DEBUG:', ...args);

interface IConfig {
  onUpdate: (updates: IInputStateUpdates) => void;
  command: ICommand;
  value?: string;
  index?: number;
}

export interface IOption<D = any> {
  value: string;
  inputValue: string;
  cursorTarget: number;
  data?: D;
}

export interface IInputStateUpdates<D = any, R = any> {
  nodeStart?: number;
  exhausted: boolean;
  options: Array<IOption>;
  run?: (opt?: D) => R;
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

const argKeys = (ast: IResult) =>
  ast.result.value.reduce((acc: Array<string>, node) => {
    if (node.type === 'ARG_KEY' && typeof node.value === 'string') {
      acc.push(node.value);
    }

    return acc;
  }, []);

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
    } else if (prevNode && (prevNode.type === 'COMMAND' || prevNode.type === 'ARG_KEY')) {
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

    if (current !== updatedAt) {
      return;
    }

    // debug({ prevNode, currentNode, sliceStart, valueSlice }, ctx);
    const options: Array<IOption> = [
      ...(ctx.commands
        ? dataToSuggestions({
            value,
            data: ctx.commands,
            filter: typeof ctx.command.commands === 'function' ? valueSlice : undefined,
            sliceStart,
            sliceEnd,
          })
        : []),
      ...(ctx.command && ctx.command.args
        ? argsToSuggestions({
            value,
            args: ctx.command.args,
            filter: valueSlice,
            sliceStart,
            sliceEnd,
            exclude: argKeys(ast),
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
      if (!currentCommand.commands) {
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

      return undefined;
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

    setImmediate(processUpdates);
  };

  setImmediate(processUpdates);

  return update;
};
