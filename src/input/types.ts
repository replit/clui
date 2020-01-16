// Command types
export interface IOption<D = any> {
  value: string;
  inputValue: string;
  cursorTarget: number;
  data?: D;
}

export type ArgTypeDef = BooleanConstructor | StringConstructor | NumberConstructor;
export type ArgType = boolean | string | number;

export interface IArgsOption {
  value: string;
}

type ArgsOptionsFn = (str?: string) => Promise<Array<IArgsOption>>;

export interface IArg {
  options?: ArgsOptionsFn | Array<IArgsOption>;
  type?: ArgTypeDef;
  required?: true;
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

type CommandsFn = (str?: string) => Promise<ICommands>;

type RunFn<O, R> = (options: IRunOptions<O>) => R;

export interface ICommand<O = any, R = any> {
  args?: ICommandArgs;
  commands?: ICommands | CommandsFn;
  run?: RunFn<O, R>;
}

// AST Types
type NodeType = 'ROOT' | 'COMMAND' | 'ARG_KEY' | 'ARG_VALUE' | 'ARG_VALUE_QUOTED' | 'WHITESPACE';

export interface IData {
  index: number;
}

export interface ILocation {
  start: number;
  end: number;
}

export interface INode extends ILocation {
  type: NodeType;
  value: Array<INode> | string;
}

export interface IValueNode extends Omit<INode, 'value' | 'type'> {
  type: 'COMMAND' | 'ARG_KEY' | 'ARG_VALUE' | 'ARG_VALUE_QUOTED' | 'WHITESPACE';
  value: string;
}

export interface IResult {
  isError: boolean;
  index: number;
  result: {
    type: 'ROOT';
    value: Array<INode>;
    start: number;
    end: number;
    source: string;
  };
}
