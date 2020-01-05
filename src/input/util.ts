import { IResult, INode, ICommand } from './types';

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

export const getCmdContext = ({
  cmds,
  ast,
  index,
}: {
  cmds: Record<string, ICommand>;
  ast: IResult;
  index: number;
}): [ICommand | undefined, string | undefined] => {
  const commands = ast.result.value
    .filter((n) => n.type === 'COMMAND' && n.end <= index && typeof n.value === 'string')
    .map((n) => String(n.value));

  let match: ICommand | undefined;
  let next = commands[0];
  let ctx = cmds;

  while (commands.length) {
    const command = commands.shift();
    if (command && ctx[command]) {
      match = ctx[command];
      [next] = commands;
      if (match.commands) {
        ctx = match.commands;
      }
    }
  }

  return [match, next];
};
