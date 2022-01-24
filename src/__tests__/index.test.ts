import { createCompleter } from '..';

it('exports state', () => {
  expect(typeof createCompleter).toEqual('function');
});
