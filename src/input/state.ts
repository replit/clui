import { ICommand, IResult } from './types';

import { parse } from './parser';
import { getCmdContext, getNode, getArgs, getCommands } from './util';

export interface IInputState<O = any> {
  value: string;
  index: number;
  suggestions: Array<ISuggestion>;
  update(updates: { index?: number; value?: string }): IInputState;
  runnable: boolean;
  exhausted: boolean;
  nodeStart?: number;
  run: (options?: O) => any;
}

export interface ISuggestion {
  value: string;
  inputValue: string;
  cursorTarget: number;
  description?: string;
}

type Cmds = Record<string, ICommand>;

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
  Object.keys(cmds).reduce((acc: Array<ISuggestion>, key) => {
    const inputValueStart =
      value && sliceStart !== undefined ? value.slice(0, sliceStart) + key : key;
    const inputValue =
      inputValueStart + (value && sliceEnd !== undefined ? value.slice(sliceEnd) : '');

    if ((filter && key.includes(filter)) || !filter) {
      acc.push({
        value: key,
        description: cmds[key].description,
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
  Object.keys(args).reduce((acc: Array<ISuggestion>, key) => {
    if ((!exclude || !exclude.includes(key)) && ((filter && key.includes(filter)) || !filter)) {
      const flag = `--${key}`;

      const inputValueStart =
        value && sliceStart !== undefined ? value.slice(0, sliceStart) + flag : flag;
      const inputValue =
        inputValueStart + (value && sliceEnd !== undefined ? value.slice(sliceEnd) : '');

      acc.push({
        value: flag,
        description: args[key].description,
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

export const inputState = (cmds: Cmds) => {
  let value = '';
  let index = 0;
  let ast: null | IResult;

  const input = {
    get value() {
      return value;
    },

    get index() {
      return index;
    },

    get runnable() {
      if (!ast) {
        return false;
      }

      const [cmd] = getCmdContext({ cmds, ast, index: value.length });

      return !!cmd;
    },

    run<O = any, R = any>(options?: O): R {
      if (!ast) {
        throw new Error(`Invalid input: "${value}"`);
      }

      const [cmd, next] = getCmdContext({ cmds, ast, index: value.length });

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
      if (!ast) {
        return false;
      }

      const [cmd] = getCmdContext({ cmds, ast, index: value.length });

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

    get suggestions() {
      if (!ast || !value) {
        return cmdsToSuggestions({ cmds, filter: value });
      }

      const [cmd, next] = getCmdContext({ cmds, ast, index });
      const prevNode = getNode(ast.result.value, index - 1);

      if (!prevNode) {
        const currentNode = getNode(ast.result.value, index);

        if (currentNode) {
          const filter = typeof currentNode.value === 'string' ? currentNode.value : undefined;

          return cmdsToSuggestions({ cmds, filter });
        }

        return [];
      }

      if ((!cmd && prevNode.type === 'COMMAND') || prevNode.type === 'ROOT' || !prevNode) {
        return cmdsToSuggestions({ cmds, filter: value });
      }

      if (cmd && (cmd.commands || cmd.args) && prevNode.type === 'WHITESPACE') {
        const currentNode = ast ? getNode(ast.result.value, prevNode.end) : undefined;
        const inputArgs = Object.keys(getArgs(ast));
        const exclude = cmd.args
          ? Object.keys(cmd.args).filter((key) => inputArgs.includes(key))
          : undefined;

        const options = {
          value,
          filter: next,
          sliceStart: prevNode.end,
          sliceEnd: currentNode ? currentNode.end : undefined,
        };

        return [
          ...(cmd.commands ? cmdsToSuggestions({ cmds: cmd.commands, ...options }) : []),
          ...(cmd.args ? argsToSuggestions({ args: cmd.args, exclude, ...options }) : []),
        ];
      }

      if (cmd && cmd.commands && prevNode.type === 'COMMAND') {
        return cmdsToSuggestions({
          cmds: cmd.commands,
          filter: next || value.slice(prevNode.start, index),
          value,
          sliceStart: prevNode.start,
          sliceEnd: prevNode.end,
        });
      }

      if (cmd && cmd.args && prevNode.type === 'ARG_KEY') {
        const inputArgs = Object.keys(getArgs(ast));
        const exclude = cmd.args
          ? Object.keys(cmd.args).filter((key) => inputArgs.includes(key))
          : undefined;

        return argsToSuggestions({
          args: cmd.args,
          filter: (next || value.slice(prevNode.start, index)).replace(/^-?(-)/, ''),
          exclude,
          value,
          sliceStart: prevNode.start,
          sliceEnd: prevNode.end,
        });
      }

      return [];
    },

    update: (updates: { index?: number; value?: string }) => {
      if (updates.index !== undefined) {
        index = updates.index;
      }

      if (updates.value !== undefined) {
        value = updates.value;
        ast = parse(value);
      }

      return input;
    },
  };

  return input;
};
