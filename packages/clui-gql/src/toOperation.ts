import { IntrospectionInputValue, IntrospectionField } from 'graphql';
import { OutputFn } from './types';

const toArgDec = (inputValue: IntrospectionInputValue) => {
  let parts: Array<string> = [];
  const queue = [inputValue.type];

  while (queue.length) {
    const n = queue.shift();

    if (!n) {
      break;
    }

    const start = parts.splice(0, Math.floor(parts.length / 2));

    if ('ofType' in n && n.ofType) {
      if (n.kind === 'NON_NULL') {
        parts = [...start, '', '!', ...parts];
      }
      if (n.kind === 'LIST') {
        parts = [...start, '[', ']', ...parts];
      }
      queue.push(n.ofType);
    } else if (n.kind === 'SCALAR' && n.name) {
      parts = [...start, n.name, ...parts];
    } else if (n.kind === 'ENUM' && n.name) {
      parts = [...start, n.name, ...parts];
    }
  }

  return `$${inputValue.name}: ${parts.join('')}`;
};

const toOperation = ({
  output,
  path,
  field,
  operation,
}: {
  operation: 'query' | 'mutation';
  path: Array<string>;
  field: IntrospectionField;
  output: OutputFn;
}) => {
  const args = field.args.map(toArgDec);
  const argVars = field.args.map((a) => `${a.name}: $${a.name}`);
  const operationArgs = args.length ? `(${args.join(', ')}) ` : '';
  const operationArgVars = argVars.length ? `(${argVars.join(', ')})` : '';

  const operationName =
    operation.slice(0, 1).toUpperCase() + operation.slice(1);

  const [last, ...first] = [...path].reverse();
  const lines = [
    `${operation} ${operationName}${operationArgs}{`,
    ...first.reverse().map((p) => `${p} {`),
    `${last}${operationArgVars} {`,
  ];

  const { fields, fragments } = output({ path, field, operation });
  lines.push(fields);
  lines.push(...[...Array(lines.length - 1)].map(() => '}'));

  if (fragments) {
    lines.push(fragments);
  }

  return lines.join('\n');
};

export default toOperation;
