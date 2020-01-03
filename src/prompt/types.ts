export interface ISuggestion {
  inputValue?: string;
  value: string;
  description?: string;
  start: number;
  end: number;
}

export interface IArg {
  name?: string;
  description?: string;
  options?: Array<string>;
}

export interface ICmd<P = any> {
  name?: string;
  description?: string;
  args?: Record<string, IArg>;
  commands?: Record<string, ICmd>;
  run?: React.ComponentType<P>;
}
