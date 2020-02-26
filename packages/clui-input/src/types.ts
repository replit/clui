// Command types
export interface IOption<D = any> {
  value: string;
  inputValue: string;
  searchValue?: string;
  cursorTarget: number;
  data?: D;
}

export type ArgTypeDef =
  | BooleanConstructor
  | StringConstructor
  | NumberConstructor;

export interface IArgsOption {
  value: string;
}

type PValue<T> = Promise<T> | T;

type ArgsOptionsFn = (str?: string) => PValue<Array<IArgsOption>>;

export interface IArg<D = any> {
  options?: ArgsOptionsFn | Array<IArgsOption>;
  type?: ArgTypeDef;
  required?: true;
  data?: D;
}

export interface ICommands<C = ICommand> {
  [key: string]: C;
}

export interface ICommandArgs {
  [key: string]: IArg;
}

export type ArgType = string | boolean | number;
export type ArgsMap = Record<string, ArgType>;

export interface IRunOptions<O = any> {
  commands: Array<{ name: string; args?: ArgsMap }>;
  args?: ArgsMap;
  options?: O;
}

type ThunkFn<V> = (str?: string) => Promise<V>;
type Thunk<V> = V | ThunkFn<V>;

type RunFn<O, R> = (options: IRunOptions<O>) => R;

export interface ICommand<O = any, R = any> {
  args?: ICommandArgs;
  commands?: Thunk<ICommands<ICommand>>;
  run?: RunFn<O, R>;
}

export type SubCommands<C extends ICommand> = Thunk<ICommands<C>>;

// AST Types
type NodeType =
  | 'COMMAND'
  | 'ARG_KEY'
  | 'ARG_VALUE'
  | 'ARG_VALUE_QUOTED'
  | 'WHITESPACE';

export interface IData {
  index: number;
}

export interface ILocation {
  start: number;
  end: number;
}

export interface INode extends ILocation {
  type: NodeType;
  value: string;
}

export interface IResult {
  isError: boolean;
  index: number;
  source: string;
  result: Array<INode>;
}
