import { parse } from './parser2';
import { IAst } from './ast';
import { ICommand, ICommands } from './types';

const join = (path: Array<string>) => path.join(':');

export const resolve = async (input: string, program: ICommand) => {
  let tries = 0;
  const cache: Record<string, ICommands> = {};

  const cacheGet = (path: Array<string>): ICommands | null =>
    cache[join(path)] || null;

  const cacheSet = (path: Array<string>, commands: ICommands) => {
    cache[join(path)] = commands;
  };

  const run = async (): Promise<IAst> => {
    tries++;

    const ast = parse(input, program, cacheGet);

    if (ast.pending && tries < 20) {
      const { value } = ast.pending.token;
      const result = await ast.pending.resolve(value || undefined);
      if (result) {
        cacheSet(ast.pending.path, result);

        return run();
      }
    }

    return ast;
  };

  return run();
};
