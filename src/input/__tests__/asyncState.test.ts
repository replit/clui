// import { ICommand } from '../types';
import { inputState } from '../asyncState';

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

      it('returns top-level commands from object', (done) => {
        inputState({
          command: root,
          onOptions: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
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

      it('returns filtered top-level commands from object', (done) => {
        inputState({
          value: 'use',
          index: 'use'.length,
          command: root,
          onOptions: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
                  options: [
                    {
                      value: 'user',
                      inputValue: 'user',
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
      const commands = {
        profile: { commands: crud },
        user: { commands: crud },
      };

      const root = {
        commands: () => Promise.resolve(commands),
      };

      it('returns top-level commands', (done) => {
        inputState({
          command: root,
          onOptions: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
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

      it('returns filtered top-level commands', (done) => {
        inputState({
          value: 'use',
          index: 'use'.length,
          command: root,
          onOptions: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
                  options: [
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

      it('returns top-level sub-commands', (done) => {
        inputState({
          command: root,
          value: 'user ',
          index: 'user '.length,
          onOptions: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
                  options: [
                    {
                      value: 'create',
                      inputValue: 'user create',
                      cursorTarget: 11,
                      data: root.commands?.user.commands?.create,
                    },
                    {
                      value: 'read',
                      inputValue: 'user read',
                      cursorTarget: 9,
                      data: root.commands?.user.commands?.read,
                    },
                    {
                      value: 'update',
                      inputValue: 'user update',
                      cursorTarget: 11,
                      data: root.commands?.user.commands?.update,
                    },
                    {
                      value: 'destroy',
                      inputValue: 'user destroy',
                      cursorTarget: 12,
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

      it('returns filtered top-level sub-commands', (done) => {
        inputState({
          command: root,
          value: 'user crea',
          index: 'user crea'.length,
          onOptions: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
                  options: [
                    {
                      value: 'create',
                      inputValue: 'user create',
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

    describe('async function', () => {
      const root = {
        commands: {
          profile: { commands: crud },
          user: { commands: crud },
        },
      };

      it('returns top-level sub-commands', (done) => {
        inputState({
          command: root,
          value: 'user ',
          index: 'user '.length,
          onOptions: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
                  options: [
                    {
                      value: 'create',
                      inputValue: 'user create',
                      cursorTarget: 11,
                      data: root.commands?.user.commands?.create,
                    },
                    {
                      value: 'read',
                      inputValue: 'user read',
                      cursorTarget: 9,
                      data: root.commands?.user.commands?.read,
                    },
                    {
                      value: 'update',
                      inputValue: 'user update',
                      cursorTarget: 11,
                      data: root.commands?.user.commands?.update,
                    },
                    {
                      value: 'destroy',
                      inputValue: 'user destroy',
                      cursorTarget: 12,
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

      it('returns filtered top-level sub-commands', (done) => {
        inputState({
          command: root,
          value: 'user crea',
          index: 'user crea'.length,
          onOptions: afterNCalls(1, ({ mock }) => {
            expect(mock.calls).toEqual([
              [
                {
                  options: [
                    {
                      value: 'create',
                      inputValue: 'user create',
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
        onOptions: afterNCalls(1, ({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
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
        onOptions: afterNCalls(1, ({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                options: [
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
  });

  // describe('arg.options', () => {
  // const root = {
  // commands: {
  // user: {
  // args: {
  // email: {
  // options: async (_: { value: string }) =>
  // Promise.resolve([{ value: 'a' }, { value: 'ab' }]),
  // },
  // },
  // },
  // },
  // };

  // const filterData = [{ value: 'a' }, { value: 'ab' }];

  // it('returns arg options', (done) => {
  // inputState({
  // value: 'user --email c',
  // index: 'user --email c'.length,
  // command: root,
  // onOptions: afterNCalls(2, ({ mock }) => {
  // expect(mock.calls).toEqual([
  // [
  // {
  // options: [],
  // loading: true,
  // },
  // ],
  // [
  // {
  // options: [
  // {
  // value: 'a',
  // inputValue: 'user --email a',
  // cursorTarget: 'user --email a'.length,
  // data: filterData[0],
  // },
  // {
  // value: 'ab',
  // inputValue: 'user --email ab',
  // cursorTarget: 'user --email ab'.length,
  // data: filterData[1],
  // },
  // ],
  // loading: false,
  // },
  // ],
  // ]);
  // done();
  // }),
  // });
  // });
  // });
});
