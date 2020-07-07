import { ICommand, ICommands } from '../types';
import { createInput } from '../input';
import { parse } from '../parser';

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

describe('no input', () => {
  it('suggests commands', (done) => {
    const root: ICommand = { commands: { user: { commands: { add: {} } } } };

    createInput({
      command: root,
      value: '',
      index: ''.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'user',
            data: { commands: { add: {} } },
            inputValue: 'user',
            cursorTarget: 'user'.length,
          },
        ]);
        done();
      },
    });
  });
});

describe('includeExactMatch', () => {
  it('includes exact command match', (done) => {
    const root: ICommand = {
      commands: {
        user: {
          commands: { add: {} },
        },
      },
    };

    createInput({
      includeExactMatch: true,
      command: root,
      value: 'user',
      index: 'user'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'user ',
            data: { commands: { add: {} } },
            inputValue: 'user ',
            cursorTarget: 'user '.length,
          },
        ]);
        done();
      },
    });
  });

  it('includes exact sub-command match', (done) => {
    const root: ICommand = {
      commands: {
        user: {
          commands: { add: {} },
        },
      },
    };

    createInput({
      includeExactMatch: true,
      command: root,
      value: 'user add',
      index: 'user add'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'add ',
            data: {},
            inputValue: 'user add ',
            cursorTarget: 'user add '.length,
          },
        ]);
        done();
      },
    });
  });

  it('includes exact arg key match', (done) => {
    const root: ICommand = {
      commands: {
        user: {
          args: {
            id: {},
          },
          commands: { add: {} },
        },
      },
    };

    createInput({
      includeExactMatch: true,
      command: root,
      value: 'user --id',
      index: 'user --id'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: '--id ',
            data: {},
            inputValue: 'user --id ',
            cursorTarget: 'user --id '.length,
          },
        ]);
        done();
      },
    });
  });

  it('includes exact arg flag match', (done) => {
    const root: ICommand = {
      commands: {
        user: {
          args: {
            id: {
              type: 'boolean',
            },
          },
        },
      },
    };

    createInput({
      includeExactMatch: true,
      command: root,
      value: 'user --id',
      index: 'user --id'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: '--id ',
            data: { type: 'boolean' },
            inputValue: 'user --id ',
            cursorTarget: 'user --id '.length,
          },
        ]);
        done();
      },
    });
  });

  it('searches when there is no exact match', (done) => {
    const root: ICommand = {
      commands: {
        user: {
          commands: {
            add: {},
          },
        },
      },
    };

    createInput({
      includeExactMatch: true,
      command: root,
      value: 'use',
      index: 'use'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'user',
            data: { commands: { add: {} } },
            inputValue: 'user',
            searchValue: 'use',
            cursorTarget: 'user'.length,
          },
        ]);
        done();
      },
    });
  });
});

describe('previousNode', () => {
  it('suggests commands', (done) => {
    const root: ICommand = { commands: { user: { commands: { add: {} } } } };

    createInput({
      command: root,
      value: 'us',
      index: 'us'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'user',
            data: { commands: { add: {} } },
            inputValue: 'user',
            searchValue: 'us',
            cursorTarget: 'user'.length,
          },
        ]);
        done();
      },
    });
  });

  it('suggests subcommands from function', (done) => {
    const root: ICommand = {
      commands: { user: { commands: async () => ({ add: {} }) } },
    };

    const expected = {
      value: 'add',
      data: {},
      inputValue: 'user add',
      cursorTarget: 'user add'.length,
    };

    createInput({
      command: root,
      value: 'user ',
      index: 'user '.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([expected]);
        done();
      },
    });

    createInput({
      command: root,
      value: 'user a',
      index: 'user '.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([expected]);
        done();
      },
    });

    createInput({
      command: root,
      value: 'user a',
      index: 'user a'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([{ ...expected, searchValue: 'a' }]);
        done();
      },
    });
  });

  it('suggests subcommands', (done) => {
    const root: ICommand = { commands: { user: { commands: { add: {} } } } };

    createInput({
      command: root,
      value: 'user a',
      index: 'user a'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'add',
            data: {},
            inputValue: 'user add',
            searchValue: 'a',
            cursorTarget: 'user add'.length,
          },
        ]);
        done();
      },
    });
  });

  it('suggests subcommands after arg flag', (done) => {
    const root: ICommand = {
      commands: {
        user: { args: { add: { type: 'boolean' } }, commands: { add: {} } },
      },
    };

    createInput({
      command: root,
      value: 'user --add ',
      index: 'user --add '.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'add',
            data: {},
            inputValue: 'user --add add',
            cursorTarget: 'user --add add'.length,
          },
        ]);
        done();
      },
    });
  });

  it('does not suggest subcommands after arg value', (done) => {
    const root: ICommand = {
      commands: {
        user: { args: { add: { type: 'string' } }, commands: { add: {} } },
      },
    };

    createInput({
      command: root,
      value: 'user --add ',
      index: 'user --add '.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([]);
        done();
      },
    });
  });

  it('suggests subcommands and arg flag', (done) => {
    const root: ICommand = {
      commands: {
        user: { args: { add: { type: 'boolean' } }, commands: { add: {} } },
      },
    };

    createInput({
      command: root,
      value: 'user ',
      index: 'user '.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: '--add',
            data: { type: 'boolean' },
            inputValue: 'user --add',
            cursorTarget: 'user --add'.length,
          },
          {
            value: 'add',
            data: {},
            inputValue: 'user add',
            cursorTarget: 'user add'.length,
          },
        ]);
        done();
      },
    });
  });

  describe('arg flags', () => {
    const root: ICommand = {
      commands: {
        user: { args: { id: { type: 'boolean' }, info: { type: 'boolean' } } },
      },
    };

    it('suggests args', (done) => {
      createInput({
        command: root,
        value: 'user --i',
        index: 'user --i'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: '--id',
              data: { type: 'boolean' },
              inputValue: 'user --id',
              searchValue: 'i',
              cursorTarget: 'user --id'.length,
            },
            {
              value: '--info',
              data: { type: 'boolean' },
              inputValue: 'user --info',
              searchValue: 'i',
              cursorTarget: 'user --info'.length,
            },
          ]);
          done();
        },
      });
    });

    it('suggests filtred args', (done) => {
      createInput({
        command: root,
        value: 'user --in',
        index: 'user --in'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: '--info',
              data: { type: 'boolean' },
              inputValue: 'user --info',
              searchValue: 'in',
              cursorTarget: 'user --info'.length,
            },
          ]);
          done();
        },
      });
    });
  });

  describe('args', () => {
    const root: ICommand = {
      commands: { user: { args: { id: {}, info: {} } } },
    };

    it('suggests args', (done) => {
      createInput({
        command: root,
        value: 'user --i',
        index: 'user --i'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: '--id',
              data: {},
              inputValue: 'user --id',
              searchValue: 'i',
              cursorTarget: 'user --id'.length,
            },
            {
              value: '--info',
              data: {},
              inputValue: 'user --info',
              searchValue: 'i',
              cursorTarget: 'user --info'.length,
            },
          ]);
          done();
        },
      });
    });

    it('suggests filtred args', (done) => {
      createInput({
        command: root,
        value: 'user --in',
        index: 'user --in'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: '--info',
              data: {},
              inputValue: 'user --info',
              searchValue: 'in',
              cursorTarget: 'user --info'.length,
            },
          ]);
          done();
        },
      });
    });
  });

  describe('arg options', () => {
    const root: ICommand = {
      commands: { user: { args: { id: { options: [{ value: 'foo' }] } } } },
    };

    it('suggests arg options', (done) => {
      createInput({
        command: root,
        value: 'user --id ',
        index: 'user --id '.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: 'foo',
              data: { value: 'foo' },
              inputValue: 'user --id foo',
              cursorTarget: 'user --id foo'.length,
            },
          ]);
          done();
        },
      });
    });

    it('suggests filtred arg options', (done) => {
      createInput({
        command: root,
        value: 'user --id f',
        index: 'user --id f'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: 'foo',
              data: { value: 'foo' },
              inputValue: 'user --id foo',
              searchValue: 'f',
              cursorTarget: 'user --id foo'.length,
            },
          ]);
          done();
        },
      });
    });
  });
});

describe('currentNode', () => {
  it('suggests commands', (done) => {
    const root: ICommand = { commands: { user: { commands: { add: {} } } } };

    createInput({
      command: root,
      value: 'user',
      index: 'us'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'user',
            data: { commands: { add: {} } },
            inputValue: 'user',
            searchValue: 'us',
            cursorTarget: 'user'.length,
          },
        ]);
        done();
      },
    });
  });

  it('suggests subcommands', (done) => {
    const root: ICommand = { commands: { user: { commands: { add: {} } } } };

    createInput({
      command: root,
      value: 'user add',
      index: 'user a'.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'add',
            data: {},
            inputValue: 'user add',
            searchValue: 'a',
            cursorTarget: 'user add'.length,
          },
        ]);
        done();
      },
    });
  });

  describe('arg flags', () => {
    const root: ICommand = {
      commands: {
        user: { args: { id: { type: 'boolean' }, info: { type: 'boolean' } } },
      },
    };

    it('suggests args', (done) => {
      createInput({
        command: root,
        value: 'user --info --i',
        index: 'user --i'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: '--id',
              data: { type: 'boolean' },
              inputValue: 'user --id --i',
              searchValue: 'i',
              cursorTarget: 'user --id'.length,
            },
            {
              value: '--info',
              data: { type: 'boolean' },
              inputValue: 'user --info --i',
              searchValue: 'i',
              cursorTarget: 'user --info'.length,
            },
          ]);
          done();
        },
      });
    });

    it('suggests filtred args', (done) => {
      createInput({
        command: root,
        value: 'user --inf',
        index: 'user --in'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: '--info',
              data: { type: 'boolean' },
              inputValue: 'user --info',
              searchValue: 'in',
              cursorTarget: 'user --info'.length,
            },
          ]);
          done();
        },
      });
    });
  });

  describe('args', () => {
    const root: ICommand = {
      commands: { user: { args: { id: {}, info: {} } } },
    };

    it('suggests args', (done) => {
      createInput({
        command: root,
        value: 'user --in',
        index: 'user --i'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: '--id',
              data: {},
              inputValue: 'user --id',
              searchValue: 'i',
              cursorTarget: 'user --id'.length,
            },
            {
              value: '--info',
              data: {},
              inputValue: 'user --info',
              searchValue: 'i',
              cursorTarget: 'user --info'.length,
            },
          ]);
          done();
        },
      });
    });

    it('suggests filtred args', (done) => {
      createInput({
        command: root,
        value: 'user --inf',
        index: 'user --in'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: '--info',
              data: {},
              inputValue: 'user --info',
              searchValue: 'in',
              cursorTarget: 'user --info'.length,
            },
          ]);
          done();
        },
      });
    });
  });

  describe('arg options', () => {
    const root: ICommand = {
      commands: { user: { args: { id: { options: [{ value: 'foo' }] } } } },
    };

    it('suggests arg options', (done) => {
      createInput({
        command: root,
        value: 'user --id fo',
        index: 'user --id f'.length,
        onUpdate: (updates) => {
          expect(updates.options).toEqual([
            {
              value: 'foo',
              data: { value: 'foo' },
              inputValue: 'user --id foo',
              searchValue: 'f',
              cursorTarget: 'user --id foo'.length,
            },
          ]);
          done();
        },
      });
    });
  });
});

describe('commands function', () => {
  it('suggests commands', (done) => {
    const commands = jest.fn(
      async (str?: string): Promise<ICommands> => {
        if (str === 'ad') {
          return { add: {} };
        }

        return {
          all: {},
        };
      },
    );

    const root: ICommand = {
      commands: {
        user: { commands },
      },
    };

    createInput({
      command: root,
      value: 'user add',
      index: 'user a'.length,
      onUpdate: (updates) => {
        expect(commands.mock.calls).toEqual([['add'], ['a']]);

        expect(updates.options).toEqual([
          {
            value: 'all',
            data: {},
            inputValue: 'user all',
            searchValue: 'a',
            cursorTarget: 'user all'.length,
          },
        ]);
        done();
      },
    });
  });

  it('suggests commands dynamically', (done) => {
    const commands = jest.fn(
      async (str?: string): Promise<ICommands> => {
        if (str === 'ad') {
          return { add: {} };
        }

        return {
          all: {},
        };
      },
    );

    const root: ICommand = {
      commands: {
        user: { commands },
      },
    };

    createInput({
      command: root,
      value: 'user add',
      index: 'user ad'.length,
      onUpdate: (updates) => {
        expect(commands.mock.calls).toEqual([['add'], ['ad']]);

        expect(updates.options).toEqual([
          {
            value: 'add',
            data: {},
            inputValue: 'user add',
            searchValue: 'ad',
            cursorTarget: 'user add'.length,
          },
        ]);
        done();
      },
    });
  });

  it('suggests subcommands dynamically', (done) => {
    const commands = jest.fn(
      async (): Promise<ICommands> => ({ add: { commands: { info: {} } } }),
    );

    const root: ICommand = {
      commands: {
        user: { commands },
      },
    };

    createInput({
      command: root,
      value: 'user add info',
      index: 'user add i'.length,
      onUpdate: (updates) => {
        // expect(commands.mock.calls).toEqual([['add'], ['ad']]);

        expect(updates.options).toEqual([
          {
            value: 'info',
            data: {},
            inputValue: 'user add info',
            searchValue: 'i',
            cursorTarget: 'user add info'.length,
          },
        ]);
        done();
      },
    });
  });
});

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
                ast: parse('', root),
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
                ast: parse('use', root),
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
                ast: parse('', root),
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
                ast: parse('user ', root),
                commands: [{ name: 'user' }],
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
                ast: parse('user crea', root),
                commands: [{ name: 'user' }],
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

  describe('async function', () => {
    const commands = {
      profile: { commands: crud },
      user: { commands: crud },
    };

    const root = {
      commands: async () => commands,
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
                ast: parse('user ', { commands }),
                commands: [{ name: 'user' }],
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
    createInput({
      value: 'user ',
      index: 'user '.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              ast: parse('user ', root),
              exhausted: false,
              commands: [{ name: 'user' }],
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
              ast: parse('user --em', root),
              exhausted: false,
              commands: [{ name: 'user' }],
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
    const command = {
      commands: { user: { args: { email: { options } } } },
    };

    createInput({
      value: 'user --email foo',
      index: 'user --em'.length,
      command,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              ast: parse('user --email foo', command),
              exhausted: true,
              commands: [{ name: 'user', args: { email: 'foo' } }],
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

  it('returns no options when at no previous node matches', (done) => {
    const options = [{ value: 'foo' }];
    const command = {
      commands: { user: { args: { email: { options } } } },
    };

    createInput({
      value: 'user --em ',
      index: 'user --em '.length,
      command,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              ast: parse('user --em ', command),
              exhausted: false,
              commands: [{ name: 'user' }],
              nodeStart: 'user --em '.length,
              options: [],
            },
          ],
        ]);
        done();
      }),
    });
  });

  it('returns unique args', (done) => {
    const options = [{ value: 'foo' }];
    const command = {
      commands: {
        user: { args: { email: { options }, name: { options } } },
      },
    };

    createInput({
      value: 'user --name f -',
      index: 'user --name f -'.length,
      command,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              ast: parse('user --name f -', command),
              exhausted: false,
              commands: [{ name: 'user', args: { name: 'f' } }],
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
  const commands: ICommands = {
    user: {
      args: {
        verbose: { type: 'boolean' },
        email: { options },
        name: { options },
      },
    },
  };

  const root: ICommand = { commands };

  it('returns remaining arg options', (done) => {
    createInput({
      value: 'user --name bar ',
      index: 'user --name bar '.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              ast: parse('user --name bar ', root),
              commands: [{ name: 'user', args: { name: 'bar' } }],
              args: { name: 'bar' },
              exhausted: false,
              nodeStart: 'user --name bar '.length,
              options: [
                {
                  value: '--verbose',
                  inputValue: 'user --name bar --verbose',
                  cursorTarget: 'user --name bar --verbose'.length,
                  data: commands.user.args?.verbose,
                },
                {
                  value: '--email',
                  inputValue: 'user --name bar --email',
                  cursorTarget: 'user --name bar --email'.length,
                  data: commands.user.args?.email,
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });

  it('returns options after "boolean" flag', (done) => {
    createInput({
      value: 'user --verbose ',
      index: 'user --verbose '.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              ast: parse('user --verbose ', root),
              commands: [{ name: 'user', args: { verbose: true } }],
              args: { verbose: true },
              exhausted: false,
              nodeStart: 'user --verbose '.length,
              options: [
                {
                  value: '--email',
                  inputValue: 'user --verbose --email',
                  cursorTarget: 'user --verbose --email'.length,
                  data: commands.user.args?.email,
                },
                {
                  value: '--name',
                  inputValue: 'user --verbose --name',
                  cursorTarget: 'user --verbose --name'.length,
                  data: commands.user.args?.name,
                },
              ],
            },
          ],
        ]);
        done();
      }),
    });
  });

  ([['user --verbose ', 'user --verbose '.length, { verbose: true }]] as Array<
    [string, number, {}]
  >).forEach(([value, index, args]) => {
    it('returns no options', (done) => {
      const command: ICommand = {
        commands: {
          user: {
            args: {
              verbose: { type: 'boolean' },
            },
          },
        },
      };

      createInput({
        value,
        index,
        command,
        onUpdate: mockFn(({ mock }) => {
          expect(mock.calls).toEqual([
            [
              {
                ast: parse(value, command),
                commands: [{ name: 'user', args: { verbose: true } }],
                args,
                exhausted: true,
                nodeStart: 'user --verbose '.length,
                options: [],
              },
            ],
          ]);
          done();
        }),
      });
    });
  });

  it('returns arg value options when value type is not "boolean"', (done) => {
    createInput({
      value: 'user --name ',
      index: 'user --name '.length,
      command: root,
      onUpdate: mockFn(({ mock }) => {
        expect(mock.calls).toEqual([
          [
            {
              ast: parse('user --name ', root),
              commands: [{ name: 'user' }],
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

  it('suggests default options', (done) => {
    const cmd: ICommand = {
      commands: {
        user: {
          commands: {
            add: {
              args: {
                user: {
                  options: async (_?: string) => [
                    { value: 'a' },
                    { value: 'b' },
                  ],
                },
              },
            },
          },
        },
      },
    };

    createInput({
      command: cmd,
      value: 'user add --user ',
      index: 'user add --user '.length,
      onUpdate: (updates) => {
        expect(updates.options).toEqual([
          {
            value: 'a',
            data: { value: 'a' },
            inputValue: 'user add --user a',
            cursorTarget: 'user add --user a'.length,
          },
          {
            value: 'b',
            data: { value: 'b' },
            inputValue: 'user add --user b',
            cursorTarget: 'user add --user b'.length,
          },
        ]);
        done();
      },
    });
  });
});

describe('quoted string', () => {
  it('allows single quote inside double quotes', (done) => {
    const root: ICommand = {
      commands: { user: { args: { reason: { type: 'string' } } } },
    };

    createInput({
      command: root,
      value: 'user --reason "It\'s complicated"',
      index: 'user --reason "It\'s complicated"'.length,
      onUpdate: (updates) => {
        expect(updates.args).toEqual({ reason: "It's complicated" });
        done();
      },
    });
  });

  it('allows double quotes inside single quotes', (done) => {
    const root: ICommand = {
      commands: { user: { args: { reason: { type: 'string' } } } },
    };

    createInput({
      command: root,
      value: "user --reason 'It\"s complicated'",
      index: "user --reason 'It\"s complicated'".length,
      onUpdate: (updates) => {
        expect(updates.args).toEqual({ reason: 'It"s complicated' });
        done();
      },
    });
  });

  it('allows double quoted string inside single quotes', (done) => {
    const root: ICommand = {
      commands: { user: { args: { reason: { type: 'string' } } } },
    };

    createInput({
      command: root,
      value: 'user --reason \'It is "complicated"\'',
      index: 'user --reason \'It is "complicated"\''.length,
      onUpdate: (updates) => {
        expect(updates.args).toEqual({ reason: 'It is "complicated"' });
        done();
      },
    });
  });

  it('allows single quoted string inside double quotes', (done) => {
    const root: ICommand = {
      commands: { user: { args: { reason: { type: 'string' } } } },
    };

    createInput({
      command: root,
      value: 'user --reason "It is \'complicated\'"',
      index: 'user --reason "It is \'complicated\'"'.length,
      onUpdate: (updates) => {
        expect(updates.args).toEqual({ reason: "It is 'complicated'" });
        done();
      },
    });
  });
});
