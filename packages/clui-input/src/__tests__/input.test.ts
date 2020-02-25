// import { ICommand } from '../types';
import { createInput } from '../input';

const crud = {
  create: {},
  read: {},
  update: {},
  destroy: {},
};

const mockFn = (cb: (mock: jest.Mock) => void) => {
  const fn: jest.Mock = jest.fn(() => cb(fn));

  return fn;
};

describe('commands', () => {
  describe('object', () => {
    const root = {
      commands: {
        profile: { commands: crud },
        user: { commands: crud },
      },
    };

    it('returns commands from object', (done) => {
      createInput({
        command: root,
        onUpdate: mockFn(({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                commands: [],
                exhausted: false,
                nodeStart: 0,
                options: [
                  {
                    value: 'profile',
                    inputValue: 'profile',
                    cursorTarget: 'profile'.length,
                    data: root.commands?.profile,
                  },
                  {
                    value: 'user',
                    inputValue: 'user',
                    cursorTarget: 'user'.length,
                    data: root.commands?.user,
                  },
                ],
              },
            ],
          ]);
          done();
        }),
      });
    });

    it('returns filtered commands from object', (done) => {
      createInput({
        value: 'use',
        index: 'use'.length,
        command: root,
        onUpdate: mockFn(({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                commands: [],
                exhausted: false,
                nodeStart: 0,
                options: [
                  {
                    value: 'user',
                    inputValue: 'user',
                    searchValue: 'use',
                    cursorTarget: 4,
                    data: root.commands?.user,
                  },
                ],
              },
            ],
          ]);
          done();
        }),
      });
    });
  });

  describe('async function', () => {
    it('returns commands', (done) => {
      const commands = {
        profile: { commands: crud },
        user: { commands: crud },
      };

      const root = {
        commands: () => Promise.resolve(commands),
      };

      createInput({
        command: root,
        onUpdate: mockFn(({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                commands: [],
                exhausted: false,
                nodeStart: 0,
                options: [
                  {
                    value: 'profile',
                    inputValue: 'profile',
                    cursorTarget: 7,
                    data: commands.profile,
                  },
                  {
                    value: 'user',
                    inputValue: 'user',
                    cursorTarget: 4,
                    data: commands.user,
                  },
                ],
              },
            ],
          ]);
          done();
        }),
      });
    });

    // TODO: decide how to handle function search
    // ([
    // [undefined, undefined, undefined],
    // ['u', 1, 'u'],
    // ['user', 1, 'u'],
    // ['user', 'user'.length, 'user'],
    // ] as Array<[string?, number?, string?]>).forEach(
    // ([value, index, expected]) => {
    // it.only(`calls function with '${expected}' for input '${value}' at index: ${index}`, (done) => {
    // const commands = jest.fn(async () => ({ user: {} }));

    // createInput({
    // command: { commands },
    // value,
    // index,
    // onUpdate: mockFn(() => {
    // expect(commands).toHaveBeenCalledWith(expected);
    // done();
    // }),
    // });
    // });
    // },
    // );
  });
});

describe('sub-commands', () => {
  describe('object', () => {
    const root = {
      commands: {
        profile: { commands: crud },
        user: { commands: crud },
      },
    };

    it('returns sub-commands', (done) => {
      createInput({
        command: root,
        value: 'user ',
        index: 'user '.length,
        onUpdate: mockFn(({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                commands: ['user'],
                exhausted: false,
                nodeStart: 'user '.length,
                options: [
                  {
                    value: 'create',
                    inputValue: 'user create',
                    cursorTarget: 'user create'.length,
                    data: root.commands?.user.commands?.create,
                  },
                  {
                    value: 'read',
                    inputValue: 'user read',
                    cursorTarget: 'user read'.length,
                    data: root.commands?.user.commands?.read,
                  },
                  {
                    value: 'update',
                    inputValue: 'user update',
                    cursorTarget: 'user update'.length,
                    data: root.commands?.user.commands?.update,
                  },
                  {
                    value: 'destroy',
                    inputValue: 'user destroy',
                    cursorTarget: 'user destroy'.length,
                    data: root.commands?.user.commands?.destroy,
                  },
                ],
              },
            ],
          ]);
          done();
        }),
      });
    });

    it('returns filtered sub-commands', (done) => {
      createInput({
        command: root,
        value: 'user crea',
        index: 'user crea'.length,
        onUpdate: mockFn(({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                commands: ['user'],
                exhausted: false,
                nodeStart: 'user '.length,
                options: [
                  {
                    value: 'create',
                    inputValue: 'user create',
                    searchValue: 'crea',
                    cursorTarget: 11,
                    data: root.commands?.user.commands?.create,
                  },
                ],
              },
            ],
          ]);
          done();
        }),
      });
    });
  });

  // describe('async function with args', () => {
  // const root = {
  // commands: {
  // a: {
  // args: {
  // name: {},
  // },
  // commands: {
  // b: {},
  // c: {},
  // },
  // },
  // },
  // };

  // ([
  // ['a --name b', 'a --name b'.length, 'a --name '.length, { name: 'b' }],
  // ['a --name b', 'a --name '.length, 'a --name '.length, { name: 'b' }],
  // ['a --name b', 'a --name'.length, 'a '.length, { name: 'b' }],
  // [
  // 'a --name b ',
  // 'a --name b '.length,
  // 'a --name b '.length,
  // { name: 'b' },
  // ],
  // ] as Array<[string, number, number, {}]>).forEach(
  // ([value, index, nodeStart, args]) => {
  // it('returns sub-commands', (done) => {
  // createInput({
  // command: root,
  // value,
  // index,
  // onUpdate: mockFn(({ mock }) => {
  // expect(mock.calls).toEqual([
  // [
  // {
  // exhausted: false,
  // commands: ['a'],
  // args,
  // nodeStart,
  // options: [],
  // },
  // ],
  // ]);
  // done();
  // }),
  // });
  // });
  // },
  // );
  // });

  // describe('async function', () => {
  // const commands = {
  // profile: { commands: crud },
  // user: { commands: crud },
  // };

  // const root = {
  // commands: async () => commands,
  // };

  // it('returns sub-commands', (done) => {
  // createInput({
  // command: root,
  // value: 'user ',
  // index: 'user '.length,
  // onUpdate: mockFn(({ mock }) => {
  // expect(mock.calls).toEqual([
  // [
  // {
  // commands: ['user'],
  // exhausted: false,
  // nodeStart: 'user '.length,
  // options: [
  // {
  // value: 'create',
  // inputValue: 'user create',
  // cursorTarget: 11,
  // data: commands.user.commands?.create,
  // },
  // {
  // value: 'read',
  // inputValue: 'user read',
  // cursorTarget: 9,
  // data: commands.user.commands?.read,
  // },
  // {
  // value: 'update',
  // inputValue: 'user update',
  // cursorTarget: 11,
  // data: commands.user.commands?.update,
  // },
  // {
  // value: 'destroy',
  // inputValue: 'user destroy',
  // cursorTarget: 12,
  // data: commands.user.commands?.destroy,
  // },
  // ],
  // },
  // ],
  // ]);
  // done();
  // }),
  // });
  // });
  // });
});

describe('args', () => {
  const root = {
    commands: {
      user: {
        args: {
          id: {},
          email: {},
        },
      },
    },
  };

  it('returns args', (done) => {
    createInput({
      value: 'user ',
      index: 'user '.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              exhausted: false,
              commands: ['user'],
              nodeStart: 'user '.length,
              options: [
                {
                  value: '--id',
                  inputValue: 'user --id',
                  cursorTarget: 'user --id'.length,
                  data: root.commands?.user.args?.id,
                },
                {
                  value: '--email',
                  inputValue: 'user --email',
                  cursorTarget: 'user --email'.length,
                  data: root.commands?.user.args?.email,
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });

  it('returns filtred args', (done) => {
    createInput({
      value: 'user --em',
      index: 'user --em'.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              exhausted: false,
              commands: ['user'],
              nodeStart: 'user '.length,
              options: [
                {
                  value: '--email',
                  inputValue: 'user --email',
                  cursorTarget: 'user --email'.length,
                  searchValue: 'em',
                  data: root.commands?.user.args?.email,
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });

  it('returns filtred args at index', (done) => {
    const options = [{ value: 'foo' }];

    createInput({
      value: 'user --email foo',
      index: 'user --em'.length,
      command: {
        commands: { user: { args: { email: { options } } } },
      },
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              exhausted: true,
              commands: ['user'],
              args: { email: 'foo' },
              nodeStart: 'user '.length,
              options: [
                {
                  value: '--email',
                  inputValue: 'user --email foo',
                  cursorTarget: 'user --email'.length,
                  searchValue: 'em',
                  data: { options },
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });

  it('returns unique args', (done) => {
    const options = [{ value: 'foo' }];

    createInput({
      value: 'user --name f -',
      index: 'user --name f -'.length,
      command: {
        commands: {
          user: { args: { email: { options }, name: { options } } },
        },
      },
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              exhausted: false,
              commands: ['user'],
              args: { name: 'f' },
              nodeStart: 'user --name f '.length,
              options: [
                {
                  value: '--email',
                  inputValue: 'user --name f --email',
                  cursorTarget: 'user --name f --email'.length,
                  data: { options },
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });
});

describe('options variations', () => {
  const options = [{ value: 'foo' }];
  const commands = {
    user: {
      args: {
        verbose: { type: Boolean },
        email: { options },
        name: { options },
      },
    },
  };

  const root = { commands };

  it('returns remaining arg options', (done) => {
    createInput({
      value: 'user --name bar ',
      index: 'user --name bar '.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              commands: ['user'],
              args: { name: 'bar' },
              exhausted: false,
              nodeStart: 'user --name bar '.length,
              options: [
                {
                  value: '--verbose',
                  inputValue: 'user --name bar --verbose',
                  cursorTarget: 'user --name bar --verbose'.length,
                  data: commands.user.args.verbose,
                },
                {
                  value: '--email',
                  inputValue: 'user --name bar --email',
                  cursorTarget: 'user --name bar --email'.length,
                  data: commands.user.args.email,
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });

  it('returns options after Boolean flag', (done) => {
    createInput({
      value: 'user --verbose ',
      index: 'user --verbose '.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              commands: ['user'],
              args: { verbose: true },
              exhausted: false,
              nodeStart: 'user --verbose '.length,
              options: [
                {
                  value: '--email',
                  inputValue: 'user --verbose --email',
                  cursorTarget: 'user --verbose --email'.length,
                  data: commands.user.args.email,
                },
                {
                  value: '--name',
                  inputValue: 'user --verbose --name',
                  cursorTarget: 'user --verbose --name'.length,
                  data: commands.user.args.name,
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });

  ([
    ['user --verbose ', 'user --verbose'.length, { verbose: true }],
    ['user --name ', 'user --name'.length, undefined],
  ] as Array<[string, number, {}]>).forEach(([value, index, args]) => {
    it('returns no options', (done) => {
      createInput({
        value,
        index,
        command: root,
        onUpdate: mockFn(({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                commands: ['user'],
                args,
                exhausted: false,
                nodeStart: 'user '.length,
                options: [],
              },
            ],
          ]);
          done();
        }),
      });
    });
  });

  it.skip('returns arg value options when value type is not Boolean', (done) => {
    createInput({
      value: 'user --name ',
      index: 'user --name '.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              commands: ['user'],
              exhausted: false,
              nodeStart: 'user --name '.length,
              options: [
                {
                  value: 'foo',
                  inputValue: 'user --name foo',
                  cursorTarget: 'user --name foo'.length,
                  data: options[0],
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });
});
