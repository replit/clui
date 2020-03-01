import { ICommand, IArg } from '@replit/clui-input';

export interface IGQLCommand {
  outputType: string;
  description?: string;
  path: Array<string>;
  mutation?: string;
  query?: string;
  args?: Record<string, IGQLCommandArg>;
  commands?: Record<string, IGQLCommand>;
  run?: ICommand['run'];
}

type Parsed = string | number | boolean;
export type PromptArgs = Record<string, Parsed>;

export interface IGQLCommandArg extends IArg {
  name: string;
  description?: string;
  graphql: {
    kind: string;
    list?: boolean;
  };
}

export type OutputFn = (options: {
  path: Array<string>;
  field: any;
  operation: 'query' | 'mutation';
}) => { fields: string; fragments?: string };
