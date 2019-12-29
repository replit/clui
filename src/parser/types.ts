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
  result: {
    type: 'ROOT';
    value: Array<INode>;
    start: number;
    end: number;
  };
}

export type Args = Record<string, string | boolean>;
