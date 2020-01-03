import { ICmd } from '../prompt/types';
import { IResult } from '../parser/types';

const getCmdContext = ({
  cmds,
  ast,
  index,
}: {
  cmds: Record<string, ICmd>;
  ast: IResult;
  index: number;
}): [ICmd | undefined, string | undefined] => {
  const commands = ast.result.value
    .filter((n) => n.type === 'COMMAND' && n.end <= index && typeof n.value === 'string')
    .map((n) => String(n.value));

  let match: ICmd | undefined;
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

export default getCmdContext;
