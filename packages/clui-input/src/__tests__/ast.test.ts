import { parse, IAst, ICmdNode } from '../parser2';

const find = (ast: IAst, index: number): ICmdNode |  {
  const queue = ast.command ? [ast.command] : [];

  while (queue.length) {
    const node = queue.shift();

    if (!node) {
      throw Error('Expected node');
    }

    if (index >= node.node.start && index < node.node.end) {
      return node;
    }

    if (node.args) {
      queue.push(...node.args);
    }

    if (node.command) {
      queue.push(node.command);
    }
  }

  return null;
};

it('finds node', async () => {
  const root = {
    commands: {
      user: {
        commands: {
          add: {},
        },
      },
    },
  };

  const ast = parse('user add', root);

  [0, 1, 2, 3].forEach((num) => {
    const node = find(ast, num);
    expect(node).toEqual(ast.command);
  });

  [5].forEach((num) => {
    const node = find(ast, num);
    expect(node).toEqual(ast.command?.command);
  });
});
