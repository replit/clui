import { parse } from './parser';
import { IAst } from './ast';
import { ICommand, ICommands } from './types';

interface IOptions {
  input: string;
  command: ICommand;
  cache?: Record<string, ICommands>;
}

export const resolve = async (options: IOptions) => {
  let tries = 0;
  const cacheGet = (key: string): ICommands | null => {
    if (options.cache) {
      return options.cache[key] || null;
    }

    return null;
  };

  const cacheSet = (key: string, commands: ICommands) => {
    if (options.cache) {
      options.cache[key] = commands;
    }

    return null;
  };

  const run = async (): Promise<IAst> => {
    tries++;
    const ast = parse(options.input, options.command, cacheGet);

    if (ast.pending && options.cache && tries < 50) {
      const { value } = ast.pending.token;
      const result = await ast.pending.resolve(value || undefined);
      if (result) {
        cacheSet(ast.pending.key, result);

        return run();
      }
    }

    return ast;
  };

  return run();
};
