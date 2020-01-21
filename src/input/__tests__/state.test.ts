import { inputState } from '../state';
import { ICommand, ICommands } from '../types';

const afterNCalls = (calls: number, cb: (mock: jest.Mock) => void) => {
  const fn: jest.Mock = jest.fn(() => cb(fn));

  for (const _ of [...Array(calls - 1)]) {
    fn.mockImplementationOnce(() => null);
  }

  return fn;
};

const crud = {
  create: {},
  read: {},
  update: {},
  destroy: {},
};

describe('options', () => {
  describe('commands', () => {
    describe('object', () => {
      const root = {
        commands: {
          profile: { commands: crud },
          user: { commands: crud },
        },
      };

      it('returns commands from object', (done) => {
        inputState({
          command: root,
          onUpdate: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
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
        inputState({
          value: 'use',
          index: 'use'.length,
          command: root,
          onUpdate: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
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

        inputState({
          command: root,
          onUpdate: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
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

      ([
        [undefined, undefined, undefined],
        ['u', 1, 'u'],
        ['user', 1, 'u'],
        ['user', 'user'.length, 'user'],
      ] as Array<[string?, number?, string?]>).forEach(([value, index, expected]) => {
        it(`calls function with '${expected}' for input '${value}' at index: ${index}`, (done) => {
          const commands = jest.fn();

          inputState({
            command: { commands },
            value,
            index,
            onUpdate: afterNCalls(1, () => {
              expect(commands).toHaveBeenCalledWith(expected);
              done();
            }),
          });
        });
      });
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
        inputState({
          command: root,
          value: 'user ',
          index: 'user '.length,
          onUpdate: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
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
        inputState({
          command: root,
          value: 'user crea',
          index: 'user crea'.length,
          onUpdate: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
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

    describe('async function with args', () => {
      const root = {
        commands: {
          a: {
            args: {
              name: {},
            },
            commands: {
              b: {},
              c: {},
            },
          },
        },
      };

      ([
        ['a --name b', 'a --name b'.length, 'a --name '.length],
        ['a --name b', 'a --name '.length, 'a --name '.length],
        ['a --name b', 'a --name'.length, 'a '.length],
        ['a --name b ', 'a --name b '.length, 'a --name b '.length],
      ] as Array<[string, number, number]>).forEach(([value, index, nodeStart]) => {
        it('returns sub-commands', (done) => {
          inputState({
            command: root,
            value,
            index,
            onUpdate: afterNCalls(1, ({ mock }) => {
              expect(mock.calls).toEqual([
                [
                  {
                    exhausted: false,
                    nodeStart,
                    options: [],
                  },
                ],
              ]);
              done();
            }),
          });
        });
      });
    });

    describe('async function', () => {
      const commands = {
        profile: { commands: crud },
        user: { commands: crud },
      };

      const root = {
        commands: async () => commands,
      };

      it('returns sub-commands', (done) => {
        inputState({
          command: root,
          value: 'user ',
          index: 'user '.length,
          onUpdate: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
                  exhausted: false,
                  nodeStart: 'user '.length,
                  options: [
                    {
                      value: 'create',
                      inputValue: 'user create',
                      cursorTarget: 11,
                      data: commands.user.commands?.create,
                    },
                    {
                      value: 'read',
                      inputValue: 'user read',
                      cursorTarget: 9,
                      data: commands.user.commands?.read,
                    },
                    {
                      value: 'update',
                      inputValue: 'user update',
                      cursorTarget: 11,
                      data: commands.user.commands?.update,
                    },
                    {
                      value: 'destroy',
                      inputValue: 'user destroy',
                      cursorTarget: 12,
                      data: commands.user.commands?.destroy,
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
      inputState({
        value: 'user ',
        index: 'user '.length,
        command: root,
        onUpdate: afterNCalls(1, ({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                exhausted: false,
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
      inputState({
        value: 'user --em',
        index: 'user --em'.length,
        command: root,
        onUpdate: afterNCalls(1, ({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                exhausted: false,
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

      inputState({
        value: 'user --email foo',
        index: 'user --em'.length,
        command: { commands: { user: { args: { email: { options } } } } },
        onUpdate: afterNCalls(1, ({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                exhausted: true,
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

      inputState({
        value: 'user --name f -',
        index: 'user --name f -'.length,
        command: { commands: { user: { args: { email: { options }, name: { options } } } } },
        onUpdate: afterNCalls(1, ({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                exhausted: false,
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
});

describe('function commands cache', () => {
  const commands = {
    user: {
      commands: {
        info: {
          commands: async (str?: string): Promise<ICommands> => {
            if (str === 'a') {
              return { x: {} };
            }
            if (str === 'aa') {
              return { xx: {} };
            }
            if (str === 'b') {
              return { z: {} };
            }

            return {};
          },
        },
      },
    },
  };

  const root: ICommand = { commands };

  it('returns different commands', (done) => {
    let step = 0;

    const update = inputState({
      value: 'user info a',
      index: 'user info a'.length,
      command: root,
      onUpdate: (arg) => {
        if (step === 0) {
          expect(arg.options).toEqual([
            {
              inputValue: 'user info x',
              cursorTarget: 11,
              data: {},
              value: 'x',
              searchValue: 'a',
            },
          ]);

          update({
            value: 'user info aa',
            index: 'user info aa'.length,
          });
        }

        if (step === 1) {
          expect(arg.options).toEqual([
            {
              inputValue: 'user info xx',
              cursorTarget: 12,
              data: {},
              value: 'xx',
              searchValue: 'aa',
            },
          ]);

          update({
            value: 'user info b',
            index: 'user info b'.length,
          });
        }

        if (step === 2) {
          expect(arg.options).toEqual([
            {
              inputValue: 'user info z',
              cursorTarget: 11,
              data: {},
              value: 'z',
              searchValue: 'b',
            },
          ]);

          done();
        }

        step++;
      },
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
    inputState({
      value: 'user --name bar ',
      index: 'user --name bar '.length,
      command: root,
      onUpdate: afterNCalls(1, ({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
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
    inputState({
      value: 'user --verbose ',
      index: 'user --verbose '.length,
      command: root,
      onUpdate: afterNCalls(1, ({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
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
    ['user --verbose ', 'user --verbose'.length],
    ['user --name ', 'user --name'.length],
  ] as Array<[string, number]>).forEach(([value, index]) => {
    it('returns no options', (done) => {
      inputState({
        value,
        index,
        command: root,
        onUpdate: afterNCalls(1, ({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
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

  it('returns arg value options when value type is not Boolean', (done) => {
    inputState({
      value: 'user --name ',
      index: 'user --name '.length,
      command: root,
      onUpdate: afterNCalls(1, ({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
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
