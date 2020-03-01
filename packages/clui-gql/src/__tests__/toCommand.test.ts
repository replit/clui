// @ts-nocheck
import { introspection } from './util';
import toCommand from '../toCommand';
import { IGQLCommand } from '../types';

describe('toCommand', () => {
  let root: IGQLCommand | void;

  beforeAll(async () => {
    root = toCommand({
      operation: 'query',
      mountPath: ['cli'],
      introspectionSchema: introspection.__schema,
      rootTypeName: 'Cli',
      output: () => ({ fields: 'name' }),
    });
  });

  it('converts child fields to nested commands', async () => {
    const { weather } = root.commands;
    expect(Object.keys(weather.commands)).toEqual(['config', 'services']);
    expect(Object.keys(weather.commands.services.commands)).toEqual(['name']);
  });

  it('converts args', async () => {
    const { weather } = root.commands;
    [
      [
        'zipcode',
        {
          name: 'zipcode',
          type: 'string',
          description: 'Zipcode',
          required: true,
          graphql: { kind: 'SCALAR', list: false },
        },
      ],
      [
        'view',
        {
          type: 'string',
          name: 'view',
          graphql: { kind: 'SCALAR', list: false },
        },
      ],
      [
        'count',
        {
          type: 'int',
          name: 'count',
          graphql: { kind: 'SCALAR', list: false },
        },
      ],
      [
        'time',
        {
          type: 'float',
          name: 'time',
          graphql: { kind: 'SCALAR', list: false },
        },
      ],
      [
        'tomorrow',
        {
          type: 'boolean',
          name: 'tomorrow',
          graphql: { kind: 'SCALAR', list: false },
        },
      ],
      [
        'today',
        {
          type: 'boolean',
          required: true,
          name: 'today',
          graphql: { kind: 'SCALAR', list: false },
        },
      ],
      [
        'days',
        {
          type: 'string',
          name: 'days',
          graphql: { kind: 'SCALAR', list: true },
        },
      ],
      [
        'hours',
        {
          type: 'int',
          name: 'hours',
          graphql: { kind: 'SCALAR', list: true },
        },
      ],
      [
        'minutes',
        {
          type: 'float',
          required: true,
          name: 'minutes',
          graphql: { kind: 'SCALAR', list: true },
        },
      ],
      [
        'status',
        {
          type: 'string',
          name: 'status',
          graphql: { kind: 'ENUM', list: false },
          options: [{ value: 'ACTIVE' }, { value: 'INACTIVE' }],
        },
      ],
    ].forEach(([key, arg]) => {
      expect(weather.args[key]).toEqual(arg);
    });
  });

  it('transforms command name', async () => {
    const command = toCommand({
      operation: 'query',
      transform: { commandName: (str: string) => str.toUpperCase() },
      mountPath: ['cli'],
      introspectionSchema: introspection.__schema,
      rootTypeName: 'Cli',
      output: () => ({ fields: 'name' }),
    });
    expect(command.commands.STATUS).toBeTruthy();
    expect(command.commands.WEATHER).toBeTruthy();
  });

  it('transforms arg name', async () => {
    const command = toCommand({
      operation: 'query',
      rootTypeName: 'Cli',
      transform: { argName: (str: string) => str.toUpperCase() },
      mountPath: ['cli'],
      introspectionSchema: introspection.__schema,
      output: () => ({ fields: 'name' }),
    });
    expect(command.commands.weather.args.ZIPCODE).toBeTruthy();
  });
});
