import { tokenize } from './tokenizer';
import { ICommand, ICommands } from './types';

import { IArgFlagNode, IArgNode, ICmdNode, IAst } from './ast';

const flagPrefix = /^-(-?)/;

export const parse = (
  source: string,
  program: ICommand,
  cacheGet?: (key: string) => null | ICommands,
): IAst => {
  const tokens = tokenize(source).filter((t) => t.kind !== 'WHITESPACE');

  const ast: IAst = { source };
  let cmdNodeCtx: ICmdNode | null = null;
  let argNodeCtx: IArgNode | null = null;

  const queue = [...tokens];
  let done = false;

  while (queue.length && !done) {
    const token = queue.shift();

    if (!token) {
      throw new Error('Expected token');
    }

    const isFlag = flagPrefix.test(token.value);
    const argKey = isFlag ? token.value.replace(/^-(-?)/, '') : null;

    if (!cmdNodeCtx) {
      // Try to resolve first command
      if (
        typeof program.commands === 'object' &&
        program.commands[token.value]
      ) {
        // Set initial command context
        cmdNodeCtx = {
          kind: 'COMMAND',
          ref: program.commands[token.value],
          token,
        };

        ast.command = cmdNodeCtx;
      } else if (typeof program.commands === 'function') {
        const key = source.slice(0, token.end);
        const hit: ICommands | null = cacheGet ? cacheGet(key) : null;

        if (hit && hit[token.value]) {
          // Found match in cache
          const ref: ICommand = hit[token.value];
          cmdNodeCtx = { ref, token, kind: 'COMMAND' };
          ast.command = cmdNodeCtx;
        } else if (!hit) {
          // First command's commands function needs to be resolved
          ast.pending = {
            kind: 'PENDING',
            token,
            resolve: program.commands,
            key,
          };
          done = true;
        }
      } else {
        // No match found for top-level command
        ast.remainder = {
          kind: 'REMAINDER',
          token,
          cmdNodeCtx: { ref: program, token, kind: 'COMMAND' },
        };
        // ast.remainder = { node };
      }
    } else if (argNodeCtx) {
      // Set value for matching arg key
      argNodeCtx.value = {
        kind: 'ARG_VALUE',
        parent: argNodeCtx,
        token,
      };
      // Unset arg context now that the value has been set
      argNodeCtx = null;
    } else if (
      argKey &&
      cmdNodeCtx &&
      cmdNodeCtx.ref.args &&
      cmdNodeCtx.ref.args[argKey]
    ) {
      // Found a matching arg key, setting context
      const argCtx = cmdNodeCtx.ref.args[argKey];

      let argNode;
      if (argCtx.type === 'boolean') {
        argNode = {
          parent: cmdNodeCtx,
          ref: argCtx,
          kind: 'ARG_FLAG',
          token,
          name: token.value.replace(/^-(-?)/, ''),
        } as IArgFlagNode;
      } else {
        argNode = {
          parent: cmdNodeCtx,
          ref: argCtx,
          kind: 'ARG',
        } as IArgNode;
        argNode.key = {
          parent: argNode,
          token,
          kind: 'ARG_KEY',
          name: token.value.replace(/^-(-?)/, ''),
        };

        // Set arg context since arg's value is a key/value pair (rather than flag)
        argNodeCtx = argNode;
      }

      if (cmdNodeCtx.args) {
        cmdNodeCtx.args.push(argNode);
      } else {
        cmdNodeCtx.args = [argNode];
      }
    } else if (
      cmdNodeCtx &&
      typeof cmdNodeCtx.ref.commands === 'object' &&
      cmdNodeCtx.ref.commands[token.value]
    ) {
      // Found matching subcommand, update context
      const ref = cmdNodeCtx.ref.commands[token.value];
      cmdNodeCtx.command = {
        ref,
        token,
        parent: cmdNodeCtx,
        kind: 'COMMAND',
      };
      cmdNodeCtx = cmdNodeCtx.command;
    } else if (cmdNodeCtx && typeof cmdNodeCtx.ref.commands === 'function') {
      const key = source.slice(0, token.end);
      const hit: ICommands | null = cacheGet ? cacheGet(key) : null;

      if (hit && hit[token.value]) {
        // Found match in cache
        const ref: ICommand = hit[token.value];
        cmdNodeCtx.command = {
          ref,
          token,
          parent: cmdNodeCtx,
          kind: 'COMMAND',
        };
        cmdNodeCtx = cmdNodeCtx.command;
      } else if (!hit) {
        // Command's commands function needs to be resolved
        ast.pending = {
          kind: 'PENDING',
          token,
          resolve: cmdNodeCtx.ref.commands,
          key,
        };
        done = true;
      } else {
        // Return leftover node
        ast.remainder = {
          kind: 'REMAINDER',
          token,
          cmdNodeCtx: cmdNodeCtx || undefined,
          argNodeCtx: argNodeCtx || undefined,
        };
      }
    } else {
      if (token) {
        // Return leftover node
        ast.remainder = {
          kind: 'REMAINDER',
          token,
          cmdNodeCtx: cmdNodeCtx || undefined,
          argNodeCtx: argNodeCtx || undefined,
        };
      }

      done = true;
    }
  }

  return ast;
};
