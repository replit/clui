import {
  // ICommands,
  ICommand,
  IOption,
  // IResult,
  // IArg,
  // IArgsOption,
  ArgType,
} from './types';
import { resolve } from './resolver';
// import { IAst } from './parser2';

export interface IInputStateUpdates<D = any, R = any> {
  nodeStart?: number;
  commands: Array<string>;
  args?: Record<string, ArgType>;
  exhausted: boolean;
  options: Array<IOption>;
  run?: (opt?: D) => R;
}

export interface IConfig<C extends ICommand = ICommand> {
  onUpdate: (updates: IInputStateUpdates) => void;
  command: C;
  value?: string;
  index?: number;
}

export const createInput = (config: IConfig) => {
  // const commandsCache: Record<string, ICommands> = {};
  // const optionsCache: Record<string, Array<IArgsOption>> = {};

  let updatedAt = Date.now();
  let value = config.value || '';
  let index = config.index || 0;
  // let ast: IAst = parse(value, config.command);

  const processUpdates = async () => {
    const current = updatedAt;

    const ast = await resolve(value, config.command);

    if (current !== updatedAt) {
      return;
    }

    console.log({ ast, index });
    config.onUpdate({
      exhausted: true,
      commands: [],
      options: [],
    });
  };

  const update = (updates: { index?: number; value?: string }) => {
    if (updates.index !== undefined) {
      index = updates.index;
      updatedAt = Date.now();
    }

    if (updates.value !== undefined) {
      value = updates.value;
      // ast = parse(value, config.command);
      updatedAt = Date.now();
    }

    processUpdates();
  };

  processUpdates();

  return update;
};
