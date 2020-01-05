const cmds = {
  user: {
    args: {
      report: {},
    },
    commands: {
      addRole: {
        args: {
          role: {},
          user: {},
        },
      },
      removeRole: {
        args: {
          role: {},
          user: {},
        },
      },
    },
  },
  version: {},
};

export default cmds;
