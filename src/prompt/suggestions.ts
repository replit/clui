import { getNode, getArgs } from '../parser';
import { IResult } from '../parser/types';
import { ICmd, IArg, ISuggestion } from './types';

export const getCmdContext = ({
  cmds,
  ast,
  index,
}: {
  cmds: Record<string, ICmd>;
  ast: IResult;
  index: number;
}): [ICmd | undefined, string | undefined] => {
  const commands = ast.result.value
    .filter((n) => n.type === 'COMMAND' && n.end <= index && typeof n.value === 'string')
    .map((n) => String(n.value));

  let match;
  let next = commands[0];
  let ctx = cmds;

  while (commands.length) {
    const command = commands.shift();
    if (command && ctx[command]) {
      match = ctx[command];
      [next] = commands;
      if (match.commands) {
        ctx = match.commands;
      }
    }
  }

  return [match, next];
};

const cmdsToSuggestions = (
  cmds: Record<string, ICmd>,
  opts: {
    filter?: string;
    start: number;
  },
) =>
  Object.keys(cmds).reduce((acc: Array<ISuggestion>, key) => {
    if ((opts.filter && key.includes(opts.filter)) || !opts.filter) {
      acc.push({
        value: key,
        description: cmds[key].description,
        start: opts.start,
        end: opts.start + key.length,
      });
    }

    return acc;
  }, []);

const argsToSuggestions = (
  args: Record<string, IArg>,
  opts: {
    filter?: string;
    start: number;
    exclude?: Array<string>;
  },
) =>
  Object.keys(args).reduce((acc: Array<ISuggestion>, key) => {
    if (
      (!opts.exclude || !opts.exclude.includes(key)) &&
      ((opts.filter && key.includes(opts.filter)) || !opts.filter)
    ) {
      acc.push({
        value: `--${key}`,
        description: args[key].description,
        start: opts.start,
        end: opts.start + key.length + 2,
      });
    }

    return acc;
  }, []);

export const getSuggestions = ({
  cmds,
  ast,
  index,
}: {
  cmds: Record<string, ICmd>;
  ast?: IResult;
  index?: number;
}): Array<ISuggestion> => {
  if (!ast || index === undefined) {
    return cmdsToSuggestions(cmds, { start: index || 0 });
  }

  const [cmd, next] = getCmdContext({ cmds, ast, index });

  const prevNode = getNode(ast.result.value, index - 1);

  if (!cmd) {
    const opts = {
      start: prevNode?.type === 'WHITESPACE' ? prevNode.end : 0,
      filter: next,
    };

    return cmdsToSuggestions(cmds, opts);
  }

  if (cmd && (cmd.commands || cmd.args) && !next && prevNode?.type === 'WHITESPACE') {
    const opts = { start: prevNode.end };

    const inputArgs = Object.keys(getArgs(ast));
    const exclude = cmd.args
      ? Object.keys(cmd.args).filter((key) => inputArgs.includes(key))
      : undefined;

    return [
      ...(cmd.commands ? cmdsToSuggestions(cmd.commands, opts) : []),
      ...(cmd.args ? argsToSuggestions(cmd.args, { ...opts, exclude }) : []),
    ];
  }

  if (cmd && (cmd.commands || cmd.args) && next && prevNode) {
    const opts = {
      start: prevNode.type === 'WHITESPACE' ? prevNode.end : prevNode.start,
      filter: next,
    };

    const inputArgs = Object.keys(getArgs(ast));
    const exclude = cmd.args
      ? Object.keys(cmd.args).filter((key) => inputArgs.includes(key))
      : undefined;

    return [
      ...(cmd.commands ? cmdsToSuggestions(cmd.commands, opts) : []),
      ...(cmd.args ? argsToSuggestions(cmd.args, { ...opts, exclude }) : []),
    ];
  }

  if (cmd && cmd.args && prevNode?.type === 'ARG_KEY') {
    const inputArgs = Object.keys(getArgs(ast));

    return argsToSuggestions(cmd.args, {
      start: prevNode.start,
      exclude: Object.keys(cmd.args).filter((key) => inputArgs.includes(key)),
    });
  }

  // const currentNode = getNode(ast.result.value, index);
  // console.log({ cmd, next, ast: ast.result.value, index, prevNode, currentNode });

  return [];
};
