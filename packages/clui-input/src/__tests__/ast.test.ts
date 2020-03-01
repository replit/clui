import { parse } from '../parser';
import { find, closestPrevious, IArgNode, toArgs, commandPath } from '../ast';
import { ICommand } from '../types';

const root: ICommand = {
  commands: {
    user: {
      commands: {
        add: {
          args: {
            name: {},
            info: {
              type: 'boolean',
            },
          },
        },
      },
    },
  },
};

describe('find', () => {
  const ast = parse('user add --info --name foo', root);
  it('finds command node', async () => {
    [0, 1, 2, 3].forEach((num) => {
      const node = find(ast, num);
      expect(node).toEqual(ast.command);
    });

    expect(find(ast, 4)).toEqual(null);
  });

  it('finds subcommand node', async () => {
    [5, 6, 7].forEach((num) => {
      const node = find(ast, num);
      expect(node).toEqual(ast.command?.command);
    });

    expect(find(ast, 8)).toEqual(null);
  });

  it('finds arg flag node', async () => {
    [9, 10, 11, 12, 13, 14].forEach((num) => {
      const node = find(ast, num);

      if (!ast.command?.command?.args) {
        throw Error('expected args');
      }

      expect(node).toEqual(ast.command?.command?.args[0]);
    });

    expect(find(ast, 15)).toEqual(null);
  });

  it('finds arg key node', async () => {
    [16, 17, 18, 19, 20, 21].forEach((num) => {
      const node = find(ast, num);

      if (!ast.command?.command?.args) {
        throw Error('expected args');
      }

      const arg = ast.command?.command?.args[1] as IArgNode;
      expect(node).toEqual(arg.key);
    });

    expect(find(ast, 22)).toEqual(null);
  });

  it('finds arg value node', async () => {
    [23, 24, 25].forEach((num) => {
      const node = find(ast, num);

      if (!ast.command?.command?.args) {
        throw Error('expected args');
      }

      const arg = ast.command?.command?.args[1] as IArgNode;
      expect(node).toEqual(arg.value);
    });

    expect(find(ast, 26)).toEqual(null);
  });

  it('finds remainder node', async () => {
    const ast2 = parse('us', root);
    const node = find(ast2, 1);

    expect(node?.kind).toEqual('REMAINDER');
  });
});

describe('commandPath', () => {
  it('finds command path', async () => {
    const ast = parse('user add --info', root);
    if (!ast.command) {
      throw Error('Expected command');
    }
    const path = commandPath(ast.command);
    expect(path.map((p) => p.token.value)).toEqual(['user', 'add']);
  });
});

describe('closestPrevious', () => {
  const ast = parse('user add --info --name foo', root);

  it('finds closest previous command node', async () => {
    expect(closestPrevious(ast, 4)).toEqual(ast.command);
  });
});

describe('toArgs', () => {
  it('parses args', async () => {
    const command: ICommand = {
      commands: {
        user: {
          args: {
            name: {},
            info: { type: 'boolean' },
            id: { type: 'int' },
            username: { type: 'string' },
          },
        },
      },
    };

    const ast = parse('user --name "Foo Bar" --id 2 --username bar', command);

    if (!ast.command) {
      throw Error('expected command');
    }

    expect(toArgs(ast.command).parsed).toEqual({
      id: 2,
      name: 'Foo Bar',
      username: 'bar',
    });
  });
});
