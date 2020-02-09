// @ts-nocheck
import { query } from './util';
import { __Type, __Field, __InputValue } from './generated/schema';
import { toCommand, toOperation } from '..';

describe('toCommand', () => {
  let root: any;

  beforeAll(async () => {
    const data = await query<__Type>({ name: 'Cli' });
    root = toCommand({
      type: data.__type,
      mountPath: ['cli'],
      // eslint-disable-next-line
      runFn: () => () => {},
      outputFn: () => 'name',
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
      ['zipcode', { type: String, description: 'Zipcode', required: true }],
      ['view', { type: String }],
      ['count', { type: Number }],
      ['time', { type: Number }],
      ['tomorrow', { type: Boolean }],
      ['today', { type: Boolean, required: true }],
      ['days', { type: String }],
      ['hours', { type: Number }],
      ['minutes', { type: Number, required: true }],
    ].forEach(([key, arg]) => {
      expect(weather.args[key]).toEqual(arg);
    });
  });

  it('transforms command name', async () => {
    const data = await query<__Type>({ name: 'Cli' });
    const command = toCommand({
      type: data.__type,
      transformCommandName: (str: string) => str.toUpperCase(),
      mountPath: ['cli'],
      // eslint-disable-next-line
      runFn: () => () => {},
      outputFn: () => 'name',
    });
    expect(command.commands.STATUS).toBeTruthy();
    expect(command.commands.WEATHER).toBeTruthy();
  });

  it('skips args', async () => {
    const data = await query<__Type>({ name: 'Cli' });
    const command = toCommand({
      type: data.__type,
      skipArgs: true,
      mountPath: ['cli'],
      // eslint-disable-next-line
      runFn: () => () => {},
      outputFn: () => 'name',
    });
    expect(command.commands.weather.args).toBe(undefined);
  });
});

test('toOperation', async () => {
  const data = await query<__Type>({ name: 'Cli' });
  const field = data.__type.fields.find(
    (f: { name: string }) => f.name === 'weather',
  );

  const output = 'services { name }';
  const res = toOperation({
    path: ['cli', field.name],
    field,
    output: () => ({ fields: output }),
  });

  /* eslint-disable max-len */
  expect(res)
    .toEqual(`query Query($zipcode: String!, $view: String, $count: Int, $time: Float, $days: [String], $hours: [Int], $minutes: [Float!]!, $tomorrow: Boolean, $today: Boolean!, $status: STATUS) {
cli {
weather(zipcode: $zipcode, view: $view, count: $count, time: $time, days: $days, hours: $hours, minutes: $minutes, tomorrow: $tomorrow, today: $today, status: $status) {
${output}
}
}
}`);
  /* eslint-enable max-len */
});
