import { IResult, INode, IValueNode, ICommand, IArg } from './types';

export const commandPath = (ast: IResult, index?: number): Array<IValueNode> => {
  const nodes: Array<IValueNode> = [];

  for (const node of ast.result.value) {
    if (node.type === 'COMMAND' && typeof node.value === 'string') {
      if (index === undefined) {
        nodes.push(node as IValueNode);
      } else if (node.start <= index) {
        const end = index < node.end ? index : node.end;

        nodes.push({
          ...(node as IValueNode),
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
  const argNodes = result.value.filter(isArgNode);

  return argNodes.reduce((acc: Record<string, string | true>, node: INode, index: number) => {
    if (typeof node.value === 'string' && node.type === 'ARG_KEY') {
      acc[flagToKey(node.value)] = true;

      return acc;
    }

    const prev = argNodes[index - 1];

    if (
      prev &&
      prev.type === 'ARG_KEY' &&
      typeof prev.value === 'string' &&
      argValueNodeTypes.includes(node.type) &&
      typeof node.value === 'string'
    ) {
      let { value } = node;

      if (node.type === 'ARG_VALUE_QUOTED') {
        value = value.slice(1, value.length - 1);
      }

      acc[flagToKey(prev.value)] = value;
    }

    return acc;
  }, {});
};

export const getNode = (nodes: Array<INode>, index: number): INode | undefined => {
  for (const node of nodes) {
    if (index >= node.start && index < node.end) {
      return node;
    }
  }

  return undefined;
};

export interface ICommandContext {
  command: ICommand;
  key?: string;
}

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

  let prevNode = getNode(ast.result.value, index - 1);
  if (prevNode?.type === 'ARG_KEY' && typeof prevNode.value === 'string') {
    return command.args[prevNode.value.replace(/^-?(-)/, '')];
  }

  if (prevNode?.type === 'WHITESPACE') {
    prevNode = getNode(ast.result.value, prevNode.start - 1);
    if (prevNode?.type === 'ARG_KEY' && typeof prevNode.value === 'string') {
      return command.args[prevNode.value.replace(/^-?(-)/, '')];
    }
  }

  if (prevNode?.type === 'ARG_VALUE') {
    prevNode = getNode(ast.result.value, prevNode.start - 1);
    if (prevNode?.type === 'WHITESPACE') {
      prevNode = getNode(ast.result.value, prevNode.start - 1);
      if (prevNode?.type === 'ARG_KEY' && typeof prevNode.value === 'string') {
        return command.args[prevNode.value.replace(/^-?(-)/, '')];
      }
    }
  }

  return undefined;
};
