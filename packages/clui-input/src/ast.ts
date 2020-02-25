import { IToken } from './tokenizer';
import { ICommand, ICommands, IArg } from './types';

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

interface IRemainder {
  kind: 'REMAINDER';
  token: IToken;
  cmdNodeCtx?: ICmdNode;
  argNodeCtx?: IArgNode;
}

interface IPending {
  kind: 'PENDING';
  path: Array<string>;
  token: IToken;
  resolve: (str: string) => Promise<ICommands>;
}

export interface IAst {
  command?: ICmdNode;
  remainder?: IRemainder;
  pending?: IPending;
}
