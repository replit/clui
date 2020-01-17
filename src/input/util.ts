import { IResult, INode, ICommand, IArg } from './types';

export const commandPath = (ast: IResult, index?: number): Array<INode> => {
  const nodes: Array<INode> = [];

  for (const node of ast.result) {
    if (node.type === 'COMMAND') {
      if (index === undefined) {
        nodes.push(node);
      } else if (node.start <= index) {
        const end = index < node.end ? index : node.end;

        nodes.push({
          ...node,
          end,
          value: node.value.slice(0, end - node.start),
        });
      }
    }
  }

  return nodes;
};

const argValueNodeTypes = ['ARG_VALUE', 'ARG_VALUE_QUOTED'];
const argNodeTypes = ['ARG_KEY', ...argValueNodeTypes];

const isArgNode = (node: INode) => argNodeTypes.includes(node.type);

const flagToKey = (str: string) => str.replace(/^-?(-)/, '');

export const getArgs = ({ result }: IResult) => {
  const argNodes = result.filter(isArgNode);

  return argNodes.reduce((acc: Record<string, string | true>, node: INode, index: number) => {
    if (node.type === 'ARG_KEY') {
      acc[flagToKey(node.value)] = true;

      return acc;
    }

    const prev = argNodes[index - 1];

    if (prev && prev.type === 'ARG_KEY' && argValueNodeTypes.includes(node.type)) {
      let { value } = node;

      if (node.type === 'ARG_VALUE_QUOTED') {
        value = value.slice(1, value.length - 1);
      }

      acc[flagToKey(prev.value)] = value;
    }

    return acc;
  }, {});
};

export const getNode = (nodes: Array<INode>, index: number): INode | undefined =>
  nodes.find((node) => node.start <= index && index < node.end);

export const argKeys = (ast: IResult, index?: number) =>
  ast.result.reduce((acc: Array<string>, node) => {
    if (node.type === 'ARG_KEY' && (!index || node.end <= index)) {
      const value =
        index && index > node.start ? node.value.slice(0, index - node.start) : node.value;
      acc.push(value);
    }

    return acc;
  }, []);

export const getArgContext = ({
  command,
  ast,
  index,
}: {
  command: ICommand;
  ast: IResult;
  index: number;
}): IArg | undefined => {
  if (!command.args) {
    return undefined;
  }

  const queue = [];

  const current = getNode(ast.result, index - 1);
  if (current) {
    queue.push(current);
  }

  while (queue.length) {
    const node = queue.shift();

    if (!node || node.type === 'COMMAND') {
      break;
    }

    if (node.type === 'ARG_KEY') {
      return command.args[node.value.replace(/^-?(-)/, '')];
    }

    const prev = getNode(ast.result, node.start - 1);

    if (prev) {
      queue.push(prev);
    }
  }

  return undefined;
};
