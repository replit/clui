import { ICommand, IArg, IResult } from './types';

import { parse } from './parser';
import { getCmdContext, getNode, getArgs, getCommands } from './util';

export interface IInputState<O = any> {
  value: string;
  index: number;
  suggestions: Array<ISuggestion>;
  update(updates: { index?: number; value?: string }): IInputState;
  runnable: boolean;
  run: (conf: { commands: Array<string>; args?: Record<string, IArg>; options?: O }) => any;
}

export interface ISuggestion {
  value: string;
  inputValue: string;
  cursorTarget: number;
  description?: string;
}

export const inputState = (cmds: Record<string, ICommand>) => {
  let value = '';
  let index = 0;
  let ast: null | IResult;

  const input = {
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

      const inputArgs = Object.keys(getArgs(ast));
      const remaining = cmd.args
        ? Object.keys(cmd.args).filter((key) => !inputArgs.includes(key))
        : [];

      // console.log({ cmds, ast, index, remaining });
      // console.log(!!cmd && !(cmd.commands && cmd.commands.length));

      return !!cmd && remaining.length === 0;
    },

    get runnable() {
      if (!ast) {
        return false;
      }

      const [cmd] = getCmdContext({ cmds, ast, index: value.length });

      return !!cmd;
    },

    get value() {
      return value;
    },

    get index() {
      return index;
    },

    get suggestions() {
      if (!ast) {
        return Object.keys(cmds).reduce((acc: Array<ISuggestion>, key) => {
          if ((value && key.includes(value)) || !value) {
            acc.push({
              value: key,
              inputValue: key,
              description: cmds[key].description,
              cursorTarget: key.length,
            });
          }

          return acc;
        }, []);
      }

      const [cmd, next] = getCmdContext({ cmds, ast, index });
      const prevNode = getNode(ast.result.value, index - 1);

      if (!cmd && prevNode?.type === 'COMMAND') {
        return Object.keys(cmds).reduce((acc: Array<ISuggestion>, key) => {
          if ((value && key.includes(value)) || !value) {
            acc.push({
              value: key,
              inputValue: key,
              description: cmds[key].description,
              cursorTarget: key.length,
            });
          }

          return acc;
        }, []);
      }

      if (cmd && (cmd.commands || cmd.args) && prevNode?.type === 'WHITESPACE') {
        const currentNode = ast ? getNode(ast.result.value, prevNode.end) : undefined;
        const inputArgs = Object.keys(getArgs(ast));
        const exclude = cmd.args
          ? Object.keys(cmd.args).filter((key) => inputArgs.includes(key))
          : undefined;

        return [
          ...Object.keys(cmd.commands || {}).reduce((acc: Array<ISuggestion>, key) => {
            if ((next && key.includes(next)) || !next) {
              const inputValueStart = value.slice(0, prevNode.end) + key;
              const inputValue =
                inputValueStart + (currentNode ? value.slice(currentNode.end) : '');

              acc.push({
                value: key,
                description:
                  cmd.commands && cmd.commands[key] ? cmd.commands[key].description : undefined,
                inputValue,
                cursorTarget: inputValueStart.length,
              });
            }

            return acc;
          }, []),
          ...Object.keys(cmd.args || {}).reduce((acc: Array<ISuggestion>, key) => {
            if ((!exclude || !exclude.includes(key)) && ((next && key.includes(next)) || !next)) {
              const flag = `--${key}`;
              const inputValueStart = value.slice(0, prevNode.end) + flag;
              const inputValue =
                inputValueStart + (currentNode ? value.slice(currentNode.end) : '');

              acc.push({
                value: flag,
                description: cmd.args && cmd.args[key] ? cmd.args[key].description : undefined,
                inputValue,
                cursorTarget: inputValueStart.length,
              });
            }

            return acc;
          }, []),
        ];
      }

      if (cmd && (cmd.commands || cmd.args) && prevNode?.type === 'COMMAND') {
        const filter: string = next || value.slice(prevNode.start, index);

        return Object.keys(cmd.commands || {}).reduce((acc: Array<ISuggestion>, key) => {
          if ((filter && key.includes(filter)) || !filter) {
            const inputValueStart = value.slice(0, prevNode.start) + key;
            const inputValue = inputValueStart + value.slice(prevNode.end);

            acc.push({
              value: key,
              description:
                cmd.commands && cmd.commands[key] ? cmd.commands[key].description : undefined,
              inputValue,
              cursorTarget: inputValueStart.length,
            });
          }

          return acc;
        }, []);
      }

      if (cmd && cmd.args && prevNode?.type === 'ARG_KEY') {
        const filter = (next || value.slice(prevNode.start, index)).replace(/^-?(-)/, '');
        const inputArgs = Object.keys(getArgs(ast));
        const exclude = cmd.args
          ? Object.keys(cmd.args).filter((key) => inputArgs.includes(key))
          : undefined;

        return Object.keys(cmd.args).reduce((acc: Array<ISuggestion>, key) => {
          if (
            (!exclude || !exclude.includes(key)) &&
            ((filter && key.includes(filter)) || !filter)
          ) {
            const flag = `--${key}`;
            const inputValueStart = value.slice(0, prevNode.start) + flag;
            const inputValue = inputValueStart + (prevNode ? value.slice(prevNode.end) : '');

            acc.push({
              value: flag,
              description: cmd.args && cmd.args[key] ? cmd.args[key].description : undefined,
              inputValue,
              cursorTarget: inputValueStart.length,
            });
          }

          return acc;
        }, []);
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

    run: <O = any>(options?: O) => {
      if (!ast) {
        throw new Error(`No command found for '${value}'`);
      }

      const [cmd] = getCmdContext({ cmds, ast, index: value.length });

      if (!cmd) {
        throw new Error(`No command found for '${value}'`);
      }

      const args = getArgs(ast);

      if (!cmd.run) {
        throw new Error(`No run function found for '${value}'`);
      }

      return cmd.run({
        args: Object.keys(args).length ? args : undefined,
        commands: getCommands(ast),
        options,
      });
    },
  };

  return input;
};
