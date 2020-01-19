// Command types
export interface IOption<D = any> {
  value: string;
  inputValue: string;
  searchValue?: string;
  cursorTarget: number;
  data?: D;
}

export type ArgTypeDef = BooleanConstructor | StringConstructor | NumberConstructor;
export type ArgType = boolean | string | number;

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

export interface ICommands {
  [key: string]: ICommand;
}

export interface ICommandArgs {
  [key: string]: IArg;
}

export interface IRunOptions<O = any> {
  commands: Array<string>;
  args?: Record<string, ArgType>;
  options?: O;
}

type ThunkFn<V> = (str?: string) => Promise<V>;
type Thunk<V> = V | ThunkFn<V>;

type RunFn<O, R> = (options: IRunOptions<O>) => R;

interface ICommandBase<O = any, R = any> {
  args?: ICommandArgs;
  commands?: Thunk<ICommands>;
  run?: RunFn<O, R>;
}

export type ICommand<D = {}, O = any, R = any> = {
  [K in keyof D]: D[K];
} &
  ICommandBase<O, R>;

// AST Types
type NodeType = 'COMMAND' | 'ARG_KEY' | 'ARG_VALUE' | 'ARG_VALUE_QUOTED' | 'WHITESPACE';

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
