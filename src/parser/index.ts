import { IResult, INode, Args } from './types';
import * as parser from './parser';

export const parse = (str: string): IResult => parser.parse(str);

export const getCommands = ({ result }: IResult): Array<string> =>
  result.value.reduce((acc: Array<string>, item: INode) => {
    const isCommand = item.type === 'COMMAND';

    if (isCommand && typeof item.value === 'string') {
      return [...acc, item.value];
    }

    return acc;
  }, []);

const argValueNodeTypes = ['ARG_VALUE', 'ARG_VALUE_QUOTED'];
const argNodeTypes = ['ARG_KEY', ...argValueNodeTypes];

const isArgNode = (node: INode) => argNodeTypes.includes(node.type);

const flagToKey = (str: string) => str.replace(/^-?(-)/, '');

export const getArgs = ({ result }: IResult): Args => {
  const argNodes = result.value.filter(isArgNode);

  return argNodes.reduce((acc: Args, node: INode, index: number) => {
    if (typeof node.value === 'string' && node.type === 'ARG_KEY') {
      acc[flagToKey(node.value)] = true;

      return acc;
    }

    if (index > 0 && typeof node.value === 'string' && argValueNodeTypes.includes(node.type)) {
      const prev = argNodes[index - 1];

      if (typeof prev.value === 'string' && prev.type === 'ARG_KEY') {
        let { value } = node;

        if (node.type === 'ARG_VALUE_QUOTED') {
          value = value.slice(1, value.length - 1);
        }

        acc[flagToKey(prev.value)] = value;
      }
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
