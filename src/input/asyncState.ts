import { ICommand, IArg } from './types';

import { parse } from './parser';
import {
  getCmdContext,
  getNode,
  getArgs,
  getCommands,
  ICommandContext,
  getArgContext,
} from './util';

const DEBUG = true;

// eslint-disable-next-line
const debug = (...args: any) => DEBUG && console.log('DEBUG:', ...args);

export interface IOption<D = any> {
  value: string;
  inputValue: string;
  cursorTarget: number;
  data?: D;
}

export interface IInputState<O = any> {
  value: string;
  index: number;
  update(updates: { index?: number; value?: string }): IInputState;
  runnable: boolean;
  exhausted: boolean;
  nodeStart?: number;
  run?: (options?: O) => any;
}

type Cmds = Record<string, ICommand>;

interface IFilterItem {
  value: string;
}

function itemsToSuggestions<D extends IFilterItem>({
  items,
  filter,
  value,
  sliceStart,
  sliceEnd,
}: {
  items: Array<D>;
  value?: string;
  filter?: string;
  sliceStart?: number;
  sliceEnd?: number;
}) {
  return items.reduce((acc: Array<IOption>, item: D) => {
    const key = item.value;
    const inputValueStart =
      value && sliceStart !== undefined ? value.slice(0, sliceStart) + key : key;
    const inputValue =
      inputValueStart + (value && sliceEnd !== undefined ? value.slice(sliceEnd) : '');

    if ((filter && key.includes(filter)) || !filter) {
      acc.push({
        data: item,
        value: key,
        inputValue,
        cursorTarget: inputValueStart.length,
      });
    }

    return acc;
  }, []);
}

const cmdsToSuggestions = ({
  cmds,
  filter,
  value,
  sliceStart,
  sliceEnd,
}: {
  cmds: Cmds;
  value?: string;
  filter?: string;
  sliceStart?: number;
  sliceEnd?: number;
}) =>
  Object.keys(cmds).reduce((acc: Array<IOption>, key) => {
    const inputValueStart =
      value && sliceStart !== undefined ? value.slice(0, sliceStart) + key : key;
    const inputValue =
      inputValueStart + (value && sliceEnd !== undefined ? value.slice(sliceEnd) : '');

    if ((filter && key.includes(filter)) || !filter) {
      acc.push({
        value: key,
        data: cmds[key],
        inputValue,
        cursorTarget: inputValueStart.length,
      });
    }

    return acc;
  }, []);

const argsToSuggestions = ({
  args,
  filter,
  exclude,
  value,
  sliceStart,
  sliceEnd,
}: {
  args: NonNullable<ICommand['args']>;
  value?: string;
  filter?: string;
  exclude?: Array<string>;
  sliceStart?: number;
  sliceEnd?: number;
}) =>
  Object.keys(args).reduce((acc: Array<IOption>, key) => {
    if ((!exclude || !exclude.includes(key)) && ((filter && key.includes(filter)) || !filter)) {
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

export interface ICommands {
  [key: string]: ICommand;
}

interface IConfig {
  onOptions: (options: { loading: boolean; options: Array<IOption> }) => void;
  command: ICommand;
  value?: string;
  index?: number;
}

export const inputState = (config: IConfig) => {
  const cache: Record<string, Array<IOption>> = {};
  const { command, onOptions } = config;

  let updatedAt = Date.now();
  let value = config.value || '';
  let index = config.index || 0;
  let ast = parse(value);
  const cmds = command.commands;

  const getOptionsAsync = async (ctx: ICommandContext, arg?: IArg) => {
    if (!cmds) {
      return [];
    }

    const prevNode = getNode(ast.result.value, index - 1);

    if (!prevNode) {
      return [];
    }

    if (arg?.options) {
      return itemsToSuggestions({
        items: await arg.options({ value: value.slice(prevNode.start, index) }),
        value,
        sliceStart: prevNode.start,
        sliceEnd: prevNode.end,
      });
    }

    const commandNames = getCommands(ast, index);
    const lastCommand = commandNames[commandNames.length - 1];

    if (ctx.key === lastCommand && ctx.cmd && ctx.cmd.options && prevNode.type === 'WHITESPACE') {
      const currentNode = ast ? getNode(ast.result.value, prevNode.end) : undefined;
      const args = {
        items: await ctx.cmd.options({ value: ctx.next || '' }),
        value,
        sliceStart: prevNode.end,
        sliceEnd: currentNode ? currentNode.end : undefined,
      };

      return itemsToSuggestions({
        items: await ctx.cmd.options({ value: ctx.next || '' }),
        ...args,
      });
    }

    if (ctx.cmd && ctx.cmd.options && prevNode.type === 'COMMAND') {
      const filter = ctx.next || value.slice(prevNode.start, index);

      return itemsToSuggestions({
        items: await ctx.cmd.options({ value: filter }),
        value,
        sliceStart: prevNode.start,
        sliceEnd: prevNode.end,
      });
    }

    return [];
  };

  const getOptions = (ctx: ICommandContext) => {
    if (!cmds) {
      return [];
    }

    if (!ctx.cmd || !ctx.key) {
      return cmdsToSuggestions({ cmds, filter: value });
    }

    // const { cmd, next } = getCmdContext({ cmds, ast, index });
    const prevNode = getNode(ast.result.value, index - 1);

    if (!prevNode) {
      debug(1, 'getOptions');
      const currentNode = getNode(ast.result.value, index);
      if (currentNode) {
        const filter = typeof currentNode.value === 'string' ? currentNode.value : undefined;

        return cmdsToSuggestions({ cmds, filter });
      }

      return [];
    }

    if ((!ctx.cmd && prevNode.type === 'COMMAND') || prevNode.type === 'ROOT' || !prevNode) {
      debug(2, 'getOptions');

      return cmdsToSuggestions({ cmds, filter: value });
    }

    if (ctx.cmd && (ctx.cmd.commands || ctx.cmd.args) && prevNode.type === 'WHITESPACE') {
      debug(3, 'getOptions');
      const currentNode = ast ? getNode(ast.result.value, prevNode.end) : undefined;
      const inputArgs = Object.keys(getArgs(ast));
      const exclude = ctx.cmd.args
        ? Object.keys(ctx.cmd.args).filter((key) => inputArgs.includes(key))
        : undefined;
      const args = {
        value,
        filter: ctx.next,
        sliceStart: prevNode.end,
        sliceEnd: currentNode ? currentNode.end : undefined,
      };

      return [
        ...(ctx.cmd.commands ? cmdsToSuggestions({ cmds: ctx.cmd.commands, ...args }) : []),
        ...(ctx.cmd.args ? argsToSuggestions({ args: ctx.cmd.args, exclude, ...args }) : []),
      ];
    }

    if (ctx.cmd && ctx.cmd.commands && prevNode.type === 'COMMAND') {
      debug(4, 'getOptions');

      return cmdsToSuggestions({
        cmds: ctx.cmd.commands,
        filter: ctx.next || value.slice(prevNode.start, index),
        value,
        sliceStart: prevNode.start,
        sliceEnd: prevNode.end,
      });
    }

    if (ctx.cmd && ctx.cmd.args && prevNode.type === 'ARG_KEY') {
      debug(5, 'getOptions');
      const inputArgs = Object.keys(getArgs(ast));
      const exclude = ctx.cmd.args
        ? Object.keys(ctx.cmd.args).filter((key) => inputArgs.includes(key))
        : undefined;

      return argsToSuggestions({
        args: ctx.cmd.args,
        filter: (ctx.next || value.slice(prevNode.start, index)).replace(/^-?(-)/, ''),
        exclude,
        value,
        sliceStart: prevNode.start,
        sliceEnd: prevNode.end,
      });
    }

    return [];
  };

  const processUpdates = async () => {
    if (!cmds) {
      return;
    }
    debug('processUpdates', value);

    const ctx = getCmdContext({ cmds, ast, index });
    const arg = ctx.cmd ? getArgContext({ command: ctx.cmd, index, ast }) : undefined;
    const current = updatedAt;
    const cacheKey = value.slice(0, index);
    const options = getOptions(ctx);
    const cached = cache[cacheKey];
    const loadAsyncOptions = !cached && !!ctx.cmd && (!!ctx.cmd.options || !!arg?.options);

    onOptions({ options: cached ? [...options, ...cached] : options, loading: loadAsyncOptions });

    if (!loadAsyncOptions) {
      return;
    }

    const optionsAsync = await Promise.resolve(getOptionsAsync(ctx, arg));
    cache[cacheKey] = optionsAsync;

    if (current === updatedAt) {
      onOptions({
        options: optionsAsync.length ? [...options, ...optionsAsync] : options,
        loading: false,
      });
    }
  };

  const input = {
    get value() {
      return value;
    },

    get index() {
      return index;
    },

    get runnable() {
      if (!ast || !cmds) {
        return false;
      }

      const { cmd } = getCmdContext({ cmds, ast, index: value.length });

      return !!cmd;
    },

    run<O = any, R = any>(options?: O): R {
      if (!ast || !cmds) {
        throw new Error(`Invalid input: "${value}"`);
      }

      const { cmd, next } = getCmdContext({ cmds, ast, index: value.length });

      if (!cmd || next) {
        throw new Error(`Invalid input: "${value}"`);
      }

      if (!cmd.run) {
        throw new Error(`No run function found for '${value}'`);
      }

      const parsedArgs = parseArgs({ cmd, args: getArgs(ast) });

      return cmd.run({
        args: Object.keys(parsedArgs).length ? parsedArgs : undefined,
        commands: getCommands(ast),
        options,
      });
    },

    get exhausted() {
      if (!ast || !cmds) {
        return false;
      }

      const { cmd } = getCmdContext({ cmds, ast, index: value.length });

      if (!cmd) {
        return false;
      }

      if (cmd.commands && Object.keys(cmd.commands).length) {
        return false;
      }

      if (!cmd.args || !Object.keys(cmd.args).length) {
        return true;
      }

      const parsedArgs = parseArgs({ cmd, args: getArgs(ast) });

      const parsedArgKeys = Object.keys(parsedArgs);
      const remaining = cmd.args
        ? Object.keys(cmd.args).filter((key) => !parsedArgKeys.includes(key))
        : [];

      return !remaining.length;
    },

    get nodeStart() {
      if (!ast) {
        return undefined;
      }

      const currentNode = getNode(ast.result.value, index);

      if (currentNode && currentNode.type !== 'WHITESPACE') {
        return currentNode.start;
      }

      const prevNode = getNode(ast.result.value, index - 1);

      if (prevNode) {
        return prevNode.type === 'WHITESPACE' ? index : prevNode.start;
      }

      return undefined;
    },

    update: (updates: { index?: number; value?: string }) => {
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

      return input;
    },
  };

  setImmediate(processUpdates);

  return input;
};
