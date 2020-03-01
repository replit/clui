import { PromptArgs, IGQLCommand, IGQLCommandArg } from './types';

const parseValue = (options: { value: string; arg: IGQLCommandArg }) => {
  if (options.arg.graphql.kind === 'ENUM') {
    return options.value;
  }

  switch (options.arg.type) {
    case 'string':
      return options.value;
    case 'int':
      return parseInt(options.value, 10);
    case 'float':
      return parseFloat(options.value);
    case 'boolean':
      return !!options.value;
    default:
      return undefined;
  }
};

// The submitted data from the user is just a map to strings
// to string | boolean. This takes that map and casts it's values
// to match the types defined by the graphql field arguments
// so the query/mutation is called with valid variables
// Not hanldeing every case (like nested lists) and just
// uppercasing ENUM stings for now (could get actual ENUM type info later?)
const parseArgs = (options: {
  args: PromptArgs;
  command: IGQLCommand;
}): {
  variables: PromptArgs;
  extra?: PromptArgs;
  missing: {
    required?: Array<IGQLCommandArg>;
    optional?: Array<IGQLCommandArg>;
  };
} => {
  const required = [];
  const optional = [];
  const variables: PromptArgs = {};

  const extra = { ...options.args };

  if (!options.command.args) {
    return {
      variables,
      missing: {},
      extra: Object.keys(extra).length ? extra : undefined,
    };
  }

  for (const [key, arg] of Object.entries(options.command.args)) {
    const value = options.args[key];
    delete extra[key];

    if (value === undefined) {
      if (arg.required) {
        required.push(arg);
      } else {
        optional.push(arg);
      }
    } else if (arg.type === 'boolean' && typeof value === 'boolean') {
      variables[arg.name] = value;
    } else {
      const val = parseValue({ value: value.toString(), arg });

      if (val) {
        variables[arg.name] = val;
      }
    }
  }

  const missing = {
    ...(required.length ? { required } : {}),
    ...(optional.length ? { optional } : {}),
  };

  return {
    variables,
    missing,
    extra: Object.keys(extra).length ? extra : undefined,
  };
};

export default parseArgs;
