// Command types
export interface ISuggestion {
  inputValue?: string;
  value: string;
  description?: string;
  cursorTarget: number;
}

export type ArgTypeDef = BooleanConstructor | StringConstructor | NumberConstructor;
export type ArgType = boolean | string | number;

export interface IArg {
  name?: string;
  description?: string;
  options?: Array<string>;
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

export interface ICommand<O = any, R = any> {
  name?: string;
  description?: string;
  args?: ICommandArgs;
  commands?: Record<string, ICommand>;
  run?: (ro: IRunOptions<O>) => R;
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
