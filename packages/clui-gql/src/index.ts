import { __InputValue, __Type, __Field } from './graphqlTypes';

export { default as typeQuery } from './typeQuery';

const toArgDec = (inputValue: __InputValue) => {
  let parts: Array<string> = [];
  const queue = [inputValue.type];

  while (queue.length) {
    const n = queue.shift();

    if (!n) {
      break;
    }

    const start = parts.splice(0, Math.floor(parts.length / 2));

    if (n.ofType) {
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
      // TODO convert enum values to options
      parts = [...start, n.name, ...parts];
    }
  }

  return `$${inputValue.name}: ${parts.join('')}`;
};

interface IToOperationOptions {
  path: Array<string>;
  field: __Field;
  operation: Operation;
  output: (
    options: Omit<IToOperationOptions, 'output' | 'fragments'>,
  ) => { fields: string; fragments?: string };
}

export const toOperation = ({
  output,
  path,
  field,
  operation = 'query',
}: IToOperationOptions) => {
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

const typeFromScalar = (name: string) => {
  switch (name) {
    case 'Boolean':
      return Boolean;
    case 'Int':
    case 'Float':
      return Number;
    default:
      return String;
  }
};

const toArgs = (args: Array<__InputValue>) => {
  const ret = args.reduce((acc: any, inputValue: __InputValue) => {
    const arg: any = {
      description: inputValue.description || undefined,
    };

    const queue = [inputValue.type];

    while (queue.length) {
      const n = queue.shift();

      if (!n) {
        break;
      }

      if (n.ofType) {
        if (n.kind === 'NON_NULL') {
          arg.required = true;
        }
        queue.push(n.ofType);
      } else if (n.kind === 'SCALAR' && n.name) {
        arg.type = typeFromScalar(n.name);
      }
    }

    acc[inputValue.name] = arg;

    return acc;
  }, {});

  return Object.keys(ret).length ? ret : undefined;
};

interface IField extends Omit<__Field, 'isDeprecated'> {
  isDeprecated?: boolean;
}

export type RunFn<F extends IField = IField, O = any, R = any> = (info: {
  field: F;
  operation: string;
  path: Array<string>;
}) => (_: O) => R | undefined;
type OutputFn = IToOperationOptions['output'];
type Operation = 'query' | 'mutation' | 'subscription';

export const toCommand = (options: {
  operation?: Operation;
  type: __Type;
  mountPath: Array<string>;
  runFn: RunFn;
  outputFn: OutputFn;
  outputFragmentsFn?: OutputFn;
  transformCommandName?: (str: string) => string;
  skipArgs?: boolean;
}) => {
  const {
    mountPath = [],
    operation = 'query',
    type,
    runFn,
    outputFn,
  } = options;
  const root = {};

  const fieldsToCommands = (
    fields: Array<any>,
    parent: any,
    fieldPath: Array<string>,
  ) => {
    for (const field of fields) {
      const path = [...fieldPath, field.name];
      const command = {
        args: options.skipArgs ? undefined : toArgs(field.args),
        description: field.description || undefined,
        run: runFn({
          field,
          path,
          operation: toOperation({
            path,
            field,
            operation,
            output: outputFn,
          }),
        }),
      };

      const commandName = options.transformCommandName
        ? options.transformCommandName(field.name)
        : field.name;

      if (parent.commands) {
        parent.commands[commandName] = command;
      } else {
        parent.commands = { [commandName]: command };
      }

      if (field.type?.fields) {
        fieldsToCommands(field.type.fields, command, path);
      }
    }
  };

  if (type.fields) {
    fieldsToCommands(type.fields, root, mountPath);
  } else {
    throw new Error('A type with fields is required');
  }

  return root;
};
