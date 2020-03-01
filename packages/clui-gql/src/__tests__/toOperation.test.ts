import toOperation from '../toOperation';
import { introspection } from './util';

test('toOperation', () => {
  const cli = introspection.__schema.types.find((t) => t.name === 'Cli');

  if (!cli) {
    throw Error('Expected field');
  }

  if (!('fields' in cli)) {
    throw Error('Expected fields');
  }

  const weather = cli.fields.find((f) => f.name === 'weather');

  if (!weather) {
    throw Error('Expected field');
  }

  const output = 'services { name }';
  const res = toOperation({
    path: ['cli', weather.name],
    field: weather,
    output: () => ({ fields: output }),
    operation: 'query',
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
