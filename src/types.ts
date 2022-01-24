/**
 * A map of commands
 */
interface CommandsMap<Data, MatchResult> {
  [key: string]: Command<Data, MatchResult>;
}

/**
 * A function that dynamically provides sub-commands
 */
export type CommandsFn<Data, MatchResult> = (
  params: MatchParams<Data, MatchResult>
) => CommandsMap<Data, MatchResult> | Promise<CommandsMap<Data, MatchResult>>;

/**
 * The command object. This represents a node in the command tree. It can carry
 * data, provide sub-commands, and define custom matching behavior.
 */
export interface Command<Data, MatchResult> {
  /**
   * Any relevant data associated with the command
   */
  data: Data;
  /**
   * Sub-commands
   */
  commands?: CommandsMap<Data, MatchResult> | CommandsFn<Data, MatchResult>;
  /**
   * If this flag is set any `commands` function will get called again after the tree has
   * been searched. This can be useful for querying for additional results if not enough
   * were found from the initail pass down the tree. They are called in reverse order
   */
  callOnLeave?: boolean;
  /**
   * Servers the same purpose as `callOnLeave` but for the command path that has been matched
   */
  callOnResolveLeave?: boolean;
  /**
   * Override the default `matchOption` function for the given command
   */
  matchOption?: MatchFn<Data, MatchResult>;
}

/**
 * Represents a command in a location
 */
export interface CommandNode<Data, MatchResult> {
  /**
   * The text location and value matching the command
   */
  token: Token;
  /**
   * The command object
   */
  command: Command<Data, MatchResult>;
  /**
   * A reference to it's parent
   */
  parent: CommandNode<Data, MatchResult> | null;
}

export type CommandNodePath<Data, MatchResult> = Array<
  CommandNode<Data, MatchResult>
>;

/**
 * The options to update the completer state
 */
export interface UpdateOptions {
  value: string;
}

/**
 * Represents a yet to be matched option (probably used to display suggestions in
 * an autocomplete UI)
 */
export interface Option<Data, MatchResult> {
  /**
   * The text location and value matching the command
   */
  token: Token;
  /**
   * The command object
   */
  command: Command<Data, MatchResult>;
  /**
   * The data associated with the command
   */
  data: Data;
  /**
   * The command's full value this command. This is unique within the list of options.
   *
   * For example given the following command tree:
   *
   * ```
   * const root = {
   *   users: {
   *     commands: {
   *       search: {}
   *     }
   *   }
   * }
   * ```
   *
   * The value of `option.value` is "users search"
   * To get the value of the command's key ("search") use `option.token.value`
   */
  value: string;
  /**
   * The string used for the match
   */
  searchValue: string;
  /**
   * The values after the matched command's value (characters separated by whitespace)
   */
  searchPath: Array<string>;
  /**
   * The command's path in the tree
   */
  path: CommandNodePath<Data, MatchResult>;
  /**
   * The command's path in the tree
   */
  ancestors: CommandNodePath<Data, MatchResult>;
  /**
   * The result of a command's `congig.match` function. Useful for giving the command
   * more fine grained control over matching details. For example you might want to
   * match against an item's title and fall back to matching against its description
   * but order the description matches after title matches.
   */
  matchResult: MatchResult;
}

/**
 * The text location and value matching a command
 */
export interface Token {
  value: string;
  start: number;
  end: number;
}

export interface UpdateData<Data, MatchResult> {
  options: Array<Option<Data, MatchResult>>;
  errors?: Array<{ error: Error; node: CommandNode<Data, MatchResult> }>;
  value: string;
  searchValue: string;
  rootNode: CommandNode<Data, MatchResult>;
  // The commands matching the current keywords
  matchedPath: Array<CommandNode<Data, MatchResult>>;
}

// Represent different stages a `commands` function` can be called in.
// These have no effect if not using functions or `config.callOnLeave`
// and `config.callOnResolveLeave`.
export enum CallStage {
  // The stage when trying to match keywords to commands
  Enter = 'Enter',

  // Called after all tree searches have completed
  Leave = 'Leave',

  // Same as Leave but for commands the have been matched
  ResolveLeave = 'ResolveLeave',
}

/*
 * The params provided to both the `commands` when determining sub-commands and the `match`
 * function when determining if a single command is a match.
 */
export interface MatchParams<Data, MatchResult> {
  /*
   * The command in question
   */
  command: Command<Data, MatchResult>;
  /*
   * The data associated with the command
   */
  data: Data;
  /**
   * The text location and value matching the command
   */
  token: Token;
  /**
   * The path of the currently matched command nodes. This will change as
   * keywords are matched with commands. It doesn't change once no match
   * for a keyword can be found (we start searching the subtree at this point)
   */
  matchedPath: Array<CommandNode<Data, MatchResult>>;
  /**
   * The depth at which the search is occuring
   */
  currentSearchDepth: number;
  /**
   * The path of the node being searched. This is the full path being searched
   */
  ancestors: Array<CommandNode<Data, MatchResult>>;
  /**
   * The stage at which the function is called. When using `callOnLeave` or
   * `callOnResolveLeave` the `commands` function will be called a second time.
   * This lets you have different logic of each stage.
   */
  callStage: CallStage;
  /**
   * A getter for the latest options. Useful for deciding whether or not to broaden
   * the search to return more options
   */
  getCurrentOptions: () => Array<Option<Data, MatchResult>>;
  /**
   * The full value of the completer instance
   */
  fullValue: string;
  /**
   * The value after the matched command's value and before whitespace
   */
  searchValue: string;
  /**
   * The values after the matched command's value (characters separated by whitespace)
   */
  searchPath: Array<string>;
}

export type MatchFn<Data, MatchResult> = (
  params: MatchParams<Data, MatchResult>
) => MatchResult | null;

export type OnUpdate<Data, MatchResult> = (
  data: UpdateData<Data, MatchResult>
) => void;

export interface Config<Data, MatchResult> {
  /**
   * The tree of commands to be searched
   */
  root: Command<Data, MatchResult>;
  /**
   * Called when the command tree has been searched after the completer has been updated with
   * a new value. If the value changes before the search for the previous value completes it will
   * not get called for the previous value to avoid returning stale results.
   */
  onUpdate: OnUpdate<Data, MatchResult>;
  /**
   * The default matchOption function. Any truthy result returned is considered a match and will be
   * included in the `options` array in the `onUpdate` callback. The result will available as
   * `matchResult` on each option.
   */
  matchOption: MatchFn<Data, MatchResult>;
}
