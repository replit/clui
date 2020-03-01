import {
  IntrospectionSchema,
  IntrospectionType,
  IntrospectionInputValue,
  IntrospectionInputTypeRef,
  IntrospectionObjectType,
  IntrospectionInterfaceType,
  IntrospectionOutputTypeRef,
  IntrospectionNamedTypeRef,
} from 'graphql';
import { IGQLCommand, IGQLCommandArg, OutputFn } from './types';
import toOperation from './toOperation';

export const findType = ({
  introspectionSchema,
  name,
}: {
  introspectionSchema: IntrospectionSchema;
  name: string;
}): IntrospectionType | void =>
  introspectionSchema.types.find((type) => type.name === name);

const getBaseType = (
  type: IntrospectionInputTypeRef | IntrospectionOutputTypeRef,
) => {
  const queue = [type];

  while (queue.length) {
    const t = queue.shift();

    if (!t) {
      throw Error('Expected type');
    }

    if ('ofType' in t && t.ofType) {
      queue.push(t.ofType);
    } else {
      return t;
    }
  }

  return null;
};

const isNonNull = (type: IntrospectionInputTypeRef) => type.kind === 'NON_NULL';
const isList = (type: IntrospectionInputTypeRef) => type.kind === 'LIST';

const getTypeFromOutputType = ({
  introspectionSchema,
  outputType,
}: {
  introspectionSchema: IntrospectionSchema;
  outputType: IntrospectionOutputTypeRef;
}) => {
  const base = getBaseType(outputType);

  if (base && 'name' in base && base.name) {
    return findType({ introspectionSchema, name: base.name });
  }

  return null;
};

const argType = (type: IntrospectionNamedTypeRef) => {
  if (type.kind === 'ENUM') {
    return 'string';
  }

  switch (type.name) {
    case 'Int':
      return 'int';
    case 'Float':
      return 'float';
    case 'Boolean':
      return 'boolean';
    default:
      return 'string';
  }
};

const isListType = (type: IntrospectionInputTypeRef) => {
  const queue = [type];

  while (queue.length) {
    const t = queue.shift();

    if (!t) {
      throw Error('Expected type');
    }

    if (isList(t)) {
      return true;
    }

    if ('ofType' in t && t.ofType) {
      queue.push(t.ofType);
    }
  }

  return false;
};

const toArg = ({
  introspectionSchema,
  inputType,
}: {
  introspectionSchema: IntrospectionSchema;
  inputType: IntrospectionInputValue;
}) => {
  const baseType = getBaseType(inputType.type);

  if (!baseType) {
    throw new Error(`Expected to find type for "${inputType.type}"`);
  }

  const arg: IGQLCommandArg = {
    name: inputType.name,
    type: 'name' in baseType && baseType.name ? argType(baseType) : undefined,
    required: isNonNull(inputType.type) || undefined,
    description: inputType.description || undefined,
    graphql: {
      kind: baseType.kind,
      list: isListType(inputType.type),
    },
  };

  if (baseType.kind === 'ENUM') {
    const enumType = findType({ introspectionSchema, name: baseType.name });
    if (enumType && 'enumValues' in enumType && enumType.enumValues.length) {
      arg.options = enumType.enumValues.map((v) => ({
        value: v.name,
        description: v.description || undefined,
      }));
    }
  }

  return arg;
};

export interface IOptions {
  rootTypeName: string;
  transform?: {
    commandName?: (str: string) => string;
    argName?: (str: string) => string;
  };
  introspectionSchema: IntrospectionSchema;
  mountPath: Array<string>;
  operation: 'query' | 'mutation';
  output: OutputFn;
}

const toCommand = ({
  rootTypeName,
  transform,
  introspectionSchema,
  mountPath,
  operation,
  output,
}: IOptions) => {
  const rootType = findType({ introspectionSchema, name: rootTypeName });

  if (!rootType) {
    throw Error(`Expected type with name: "${rootTypeName}"`);
  }

  if (!('fields' in rootType)) {
    throw Error('Expected root type with fields');
  }

  const rootCommand: IGQLCommand = {
    path: mountPath,
    outputType: rootType.name,
  };

  const queue: Array<{
    type: IntrospectionObjectType | IntrospectionInterfaceType;
    command: IGQLCommand;
  }> = [{ type: rootType, command: rootCommand }];

  while (queue.length) {
    const i = queue.shift();

    if (!i) {
      throw new Error('Expected item');
    }

    const commands: Record<string, IGQLCommand> = {};

    for (const field of i.type.fields) {
      const base = getBaseType(field.type);

      if (!base || !('name' in base && base.name)) {
        throw Error(`Expected type with name: "${field.name}"`);
      }

      const subCommand: IGQLCommand = {
        outputType: base.name,
        path: [...i.command.path, field.name],
        description: field.description || undefined,
      };

      if (field.args && field.args.length) {
        const args: Record<string, IGQLCommandArg> = {};

        for (const fieldArg of field.args) {
          const arg = toArg({ introspectionSchema, inputType: fieldArg });
          const name: string =
            transform && transform.argName
              ? transform.argName(fieldArg.name)
              : fieldArg.name;

          args[name] = arg;
        }

        if (Object.keys(args).length) {
          subCommand.args = args;
        }
      }

      subCommand[operation] = toOperation({
        field,
        operation,
        path: subCommand.path,
        output,
      });

      const name =
        transform && transform.commandName
          ? transform.commandName(field.name)
          : field.name;
      commands[name] = subCommand;

      const fieldType = getTypeFromOutputType({
        introspectionSchema,
        outputType: field.type,
      });

      if (fieldType && 'fields' in fieldType && fieldType.fields) {
        queue.push({ type: fieldType, command: subCommand });
      }

      i.command.commands = commands;
    }
  }

  return rootCommand;
};

export default toCommand;
