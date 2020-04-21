import { IToken } from './tokenizer';
import {
  ICommand,
  ICommands,
  IArg,
  ArgsMap,
  ArgType,
  ArgTypeDef,
} from './types';

export type ASTNodeKind =
  | 'COMMAND'
  | 'ARG'
  | 'ARG_FLAG'
  | 'ARG_KEY'
  | 'ARG_VALUE'
  | 'REMAINDER'
  | 'PENDING';

export interface IArgKeyNode {
  kind: 'ARG_KEY';
  parent: IArgNode;
  token: IToken;
  name: string;
}

export interface IArgValueNode {
  kind: 'ARG_VALUE';
  parent: IArgNode;
  token: IToken;
}

export interface IArgFlagNode {
  kind: 'ARG_FLAG';
  ref: IArg;
  parent: ICmdNode;
  token: IToken;
  name: string;
}

export interface IArgNode {
  kind: 'ARG';
  ref: IArg;
  parent: ICmdNode;
  key: IArgKeyNode;
  value?: IArgValueNode;
}

export interface ICmdNode {
  kind: 'COMMAND';
  ref: ICommand;
  token: IToken;
  parent?: ICmdNode;
  command?: ICmdNode;
  args?: Array<IArgNode | IArgFlagNode>;
}

export interface IRemainder {
  kind: 'REMAINDER';
  token: IToken;
  cmdNodeCtx?: ICmdNode;
  argNodeCtx?: IArgNode;
}

export interface IPending {
  kind: 'PENDING';
  key: string;
  token: IToken;
  resolve: (str?: string) => Promise<ICommands>;
}

export interface IAst {
  source: string;
  command?: ICmdNode;
  remainder?: IRemainder;
  pending?: IPending;
}

export type ASTNode =
  | ICmdNode
  | IArgNode
  | IArgValueNode
  | IArgKeyNode
  | IArgFlagNode
  | IRemainder
  | IPending;

export const find = (ast: IAst, index: number): ASTNode | null => {
  const queue: Array<ASTNode> = [];
  if (ast.command) {
    queue.push(ast.command);
  }

  if (ast.remainder) {
    queue.push(ast.remainder);
  }

  if (ast.pending) {
    queue.push(ast.pending);
  }

  while (queue.length) {
    const node = queue.shift();

    if (!node) {
      throw Error('Expected node');
    }

    if (!('token' in node)) {
      throw Error('Expected token');
    }

    if (index >= node.token.start && index < node.token.end) {
      return node;
    }

    if ('args' in node && node.args) {
      for (const arg of node.args) {
        if ('token' in arg) {
          queue.push(arg);
        } else {
          queue.push(arg.key);

          if (arg.value) {
            queue.push(arg.value);
          }
        }
      }
    }

    if ('command' in node && node.command) {
      queue.push(node.command);
    }
  }

  return null;
};

export const closestPrevious = (ast: IAst, index: number): ASTNode | null => {
  let i = index;

  while (i > 0) {
    i--;
    const node = find(ast, i);

    if (node) {
      return node;
    }
  }

  return null;
};

export const commandPath = (root: ICmdNode): Array<ICmdNode> => {
  const path = [];

  let node: ICmdNode | void = root;

  while (node) {
    path.push(node);
    node = node.command;
  }

  return path;
};

const removeQuotes = (str: string) => {
  for (const quote of ["'", '"']) {
    if (str.startsWith(quote) && str.endsWith(quote)) {
      return str.slice(1, str.length - 1);
    }
  }

  return str;
};

const parseValue = ({ value, type }: { value: string; type: ArgTypeDef }) => {
  switch (type) {
    case 'boolean':
      return !!value;
    case 'int':
      return parseInt(value, 10);
    case 'float':
      return parseFloat(value);
    default:
      return value;
  }
};

export const toArgs = (
  command: ICmdNode,
): { parsed?: ArgsMap; remaining?: Array<IArg>; exhausted: boolean } => {
  const parsed: ArgsMap = {};

  if (!command.ref.args) {
    return { exhausted: true };
  }

  if (command.args) {
    for (const arg of command.args) {
      if (arg.kind === 'ARG_FLAG') {
        parsed[arg.name] = true;
      } else {
        const str = arg.value?.token.value;

        if (str) {
          const value: ArgType = arg.ref.type
            ? parseValue({ value: str, type: arg.ref.type })
            : str;
          parsed[arg.key.name] =
            typeof value === 'string' ? removeQuotes(value) : value;
        }
      }
    }
  }

  const remaining: Array<IArg> = [];

  for (const key of Object.keys(command.ref.args)) {
    if (!parsed[key]) {
      remaining.push(command.ref.args[key]);
    }
  }

  return {
    parsed: Object.keys(parsed).length ? parsed : undefined,
    remaining: remaining.length ? remaining : undefined,
    exhausted: !remaining.length,
  };
};
