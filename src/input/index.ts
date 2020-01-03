import { ICmd } from '../prompt/types';
import { IResult } from '../parser/types';
import { parse, getNode, getArgs } from '../parser';
import { getCmdContext } from '../prompt/suggestions';

export interface ICmdInput {
  value: string;
  index: number;
  suggestions: Array<ISuggestion>;
  update(updates: { index?: number; value?: string }): ICmdInput;
}

export interface ISuggestion {
  value: string;
  inputValue: string;
  cursorTarget: number;
  description?: string;
}

export const cmdInput = (cmds: Record<string, ICmd>) => {
  let value = '';
  let index = 0;
  let ast: null | IResult;

  const input = {
    get suggestions() {
      console.log({ value, index });
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
        // console.log(0, { prevNode, cmd, next });

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
        // console.log(1, { prevNode, cmd, next, currentNode });
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

        // console.log(2, { prevNode, cmd, next, index, filter, value });

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
        const filter: string = (next || value.slice(prevNode.start, index)).replace(/^-?(-)/, '');
        const inputArgs = Object.keys(getArgs(ast));
        const exclude = cmd.args
          ? Object.keys(cmd.args).filter((key) => inputArgs.includes(key))
          : undefined;

        // console.log(3, { prevNode, cmd, next, index, filter, value });

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
        // console.lo
      }
      // if (!ast) {
      // return Object.keys(cmds).reduce((acc: Array<ISuggestion>, key) => {
      // if ((value && key.includes(value)) || !value) {
      // acc.push({
      // value: key,
      // inputValue: key,
      // description: cmds[key].description,
      // cursorTarget: key.length,
      // });
      // }

      // return acc;
      // }, []);
      // }

      console.log(-1, { prevNode, cmd, next });

      return [];
    },

    get value() {
      return value;
    },

    get index() {
      return index;
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
