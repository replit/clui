const cmds = {
  user: {
    name: 'user',
    description: 'user description',
    args: {
      report: { description: 'report user' },
    },
    commands: {
      addRole: {
        description: 'adds role',
        run: () => null,
        args: {
          role: { name: 'role', description: 'the role' },
          user: { name: 'user', description: 'the user id' },
        },
      },
      removeRole: {
        description: 'removes role',
        run: () => null,
        args: {
          role: { name: 'role', description: 'the role' },
          user: { name: 'user', description: 'the user id' },
        },
      },
    },
  },
  version: {
    name: 'version',
    description: 'version description',
  },
};

export default cmds;
