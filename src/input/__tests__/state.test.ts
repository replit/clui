import { inputState } from '../index';

describe('update', () => {
  const updatedValue = 'updatedValue';
  const updatedIndex = 3;

  it('updates value', () => {
    const input = inputState({});
    expect(input.value).toEqual('');

    input.update({ value: updatedValue });
    expect(input.value).toEqual(updatedValue);
  });

  it('updates index', () => {
    const input = inputState({});
    expect(input.index).toEqual(0);

    input.update({ index: updatedIndex });
    expect(input.index).toEqual(updatedIndex);
  });

  it('updates value and index', () => {
    const input = inputState({});
    expect(input.index).toEqual(0);
    expect(input.value).toEqual('');

    input.update({ index: updatedIndex, value: updatedValue });
    expect(input.index).toEqual(updatedIndex);
    expect(input.value).toEqual(updatedValue);
  });
});

describe('run', () => {
  it('calls matching function', () => {
    const run = jest.fn();
    const input = inputState({ user: { run } });

    input.update({ value: 'user' }).run();
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith({ commands: ['user'] });
  });

  it('calls matching function with args', () => {
    const run = jest.fn();
    const input = inputState({ user: { run } });

    input.update({ value: 'user addRole --force --id 1 --role mod' }).run();
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith({
      commands: ['user', 'addRole'],
      args: { force: true, role: 'mod', id: '1' },
    });
  });

  it('calls matching function with options', () => {
    const options = { a: 1 };
    const run = jest.fn();
    const input = inputState({ user: { run } });

    input.update({ value: 'user' }).run(options);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith({ commands: ['user'], options });
  });
});

describe('runnable', () => {
  const run = jest.fn();
  const input = inputState({ user: { run } });

  it('returns true when command is matched', () => {
    expect(input.update({ value: 'user' }).runnable).toBe(true);
  });

  it('returns false when command is not matched', () => {
    expect(input.update({ value: 'use' }).runnable).toBe(false);
  });
});

describe('exhausted', () => {
  const run = jest.fn();
  const input = inputState({
    user: {
      run,
      commands: {
        addRole: {
          run,
          args: {
            force: {
              description: 'force',
            },
          },
        },
      },
    },
  });

  it('returns true when no other options can be submitted', () => {
    expect(input.update({ value: 'user addRole --force' }).exhausted).toBe(true);
  });

  ['u', 'user', 'user addRole', 'user addRolw --for'].forEach((value) => {
    it(`returns false when no other options can be submitted: ${value}`, () => {
      expect(input.update({ value }).exhausted).toBe(false);
    });
  });
});
