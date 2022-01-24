import {
  Option,
  Config,
  CommandNode,
  UpdateOptions,
  CallStage,
  CommandNodePath,
} from './types';

export function createCompleter<Data, MatchResult>({
  root,
  onUpdate,
  matchOption,
}: Config<Data, MatchResult>) {
  // Keeps track of of latest called index to cancel stale work
  let calledIndex = 0;

  let previousMatchedPath: CommandNodePath<Data, MatchResult> = [
    {
      command: root,
      token: { value: '', start: 0, end: 0 },
      parent: null,
    },
  ];

  return async function update({ value }: UpdateOptions) {
    calledIndex++;

    // Acts as an id for the current loop
    const currentCalledIndex = calledIndex;

    const options: Record<string, Option<Data, MatchResult>> = {};
    const errors: Array<{
      error: Error;
      node: CommandNode<Data, MatchResult>;
    }> = [];

    const getCurrentOptions = () => Object.values(options);

    // Turn input string into an array by spliting on whitespace. It expects an
    // input string with keywords separated by a single space.
    const searchPath =
      value === '' ? [''] : ['', ...value.trimStart().split(/\s+/)];

    let searchValue = searchPath[0];

    let currentMatchedNode =
      previousMatchedPath[previousMatchedPath.length - 1];

    if (!currentMatchedNode) {
      throw new Error('Expceted root node');
    }

    let callOnLeave: Array<Array<CommandNode<Data, MatchResult>>> = [];
    const callOnResolveLeave: Array<CommandNode<Data, MatchResult>> = [];

    const matchedPath: CommandNodePath<Data, MatchResult> = [];

    searchPath.forEach((key, i) => {
      const node =
        i < previousMatchedPath.length ? previousMatchedPath[i] : null;

      if (!node) {
        return;
      }

      if (node.token.value !== key) {
        return;
      }

      currentMatchedNode = node;
      matchedPath.push(currentMatchedNode);

      if (node.command.callOnResolveLeave) {
        callOnResolveLeave.push(currentMatchedNode);
      }
    });

    // Remove matched keywords
    searchPath.splice(0, matchedPath.length);
    searchValue = searchPath.length ? searchPath[0] : '';

    await new Promise<void>(async (done) => {
      const atWhitespace =
        searchPath.length && searchPath[searchPath.length - 1] === '';

      let isSearching = false;
      let callStage = CallStage.Enter;
      let workerCount = 0;

      function enque(node: CommandNode<Data, MatchResult>) {
        let parent: CommandNode<Data, MatchResult> | null = node;
        const ancestors: CommandNodePath<Data, MatchResult> = [];

        while (parent.parent) {
          ancestors.unshift(parent);
          parent = parent.parent;
        }

        ancestors.unshift(previousMatchedPath[0]);

        if (!node.command.commands) {
          throw new Error('Expected commands');
        }

        workerCount++;

        const currentSearchDepth = ancestors.length - matchedPath.length;

        Promise.resolve(
          typeof node.command.commands === 'object'
            ? node.command.commands
            : node.command.commands({
                command: node.command,
                data: node.command.data,
                token: node.token,
                ancestors,
                matchedPath,
                currentSearchDepth,
                fullValue: value,
                callStage,
                getCurrentOptions,
                searchValue,
                // Remove "" from searchPath
                searchPath: searchPath.filter(Boolean),
              })
        )
          .then((childCommands) => {
            if (currentCalledIndex !== calledIndex) {
              done();

              return;
            }

            workerCount--;

            if (!childCommands) {
              return;
            }

            const command = childCommands[searchValue];
            const start = node.token.end > 0 ? node.token.end + 1 : 0;

            // Check if index is at the end of an exact match (i.e. "user|"). If this is the case,
            // it shouldn't be considred a match. Once there is a space preceding the index
            // (i.e. "user |") it is considred a match
            const isActiveMatch = searchPath.length === 1 && !atWhitespace;

            if (
              command &&
              !isSearching &&
              !isActiveMatch &&
              callStage === CallStage.Enter
            ) {
              // There's an exact match for a command
              const token = {
                value: searchValue,
                start,
                end: start + searchValue.length,
              };

              const childNode = {
                token,
                command,
                parent: node,
              };

              // Update this to include match
              matchedPath.push(childNode);

              // Adavance searchValue to attempt matching next keyword
              searchPath.shift();
              searchValue = searchPath.length ? searchPath[0] : '';

              if (command.callOnResolveLeave) {
                callOnResolveLeave.push(childNode);
              }

              if (childNode.command.commands) {
                // Repeat this loop for matched command
                enque(childNode);
              }

              return;
            }

            // We didn't find an exact match and are now searching the subtree
            isSearching = true;

            // The search value is now the remaining unmatched text
            searchValue = searchPath.filter((s) => s).join(' ');

            // Look for search matches in sub-commands. Enque any sub-commands that
            // have sub-commands
            for (const [key, childCommand] of Object.entries(childCommands)) {
              const token = {
                value: key,
                start,
                end: start + key.length,
              };

              const child = {
                command: childCommand,
                token,
                parent: node,
              };

              const path = [...ancestors, child];

              const matchParams = {
                command: childCommand,
                data: childCommand.data,
                token,
                ancestors,
                matchedPath,
                currentSearchDepth,
                fullValue: value,
                callStage,
                getCurrentOptions,
                path,
                searchValue,
                // Remove "" from searchPath
                searchPath: searchPath.filter(Boolean),
              };

              const matchFn = childCommand.matchOption || matchOption;
              const matchResult = matchFn(matchParams);

              if (matchResult) {
                const optionValue = path
                  .map((n) => n.token.value)
                  .join(' ')
                  .trimStart();

                options[optionValue] = {
                  command: matchParams.command,
                  data: matchParams.data,
                  searchPath: matchParams.searchPath,
                  searchValue,
                  token,
                  ancestors,
                  path,
                  value: optionValue,
                  matchResult,
                };
              }

              if (callStage !== CallStage.Enter) {
                continue;
              }

              if (childCommand.callOnLeave) {
                const currentIndex = path.length;

                // Add by index so they can be called in the reverse order
                if (callOnLeave[currentIndex]) {
                  callOnLeave[currentIndex].push(child);
                } else {
                  callOnLeave[currentIndex] = [child];
                }
              }

              if (child.command.commands) {
                enque(child);
              }
            }
          })
          .catch((error) => {
            if (currentCalledIndex !== calledIndex) {
              done();

              return;
            }

            workerCount--;

            errors.push({ error, node });
          })
          .finally(() => {
            if (currentCalledIndex !== calledIndex) {
              done();

              return;
            }

            if (workerCount > 0) {
              // Search loop is still running
              return;
            }

            // Before we exit the loop check if any commands should be called on Leave or ResolveLeave
            if (callStage === CallStage.Enter && callOnLeave.length) {
              // Update state to reflect callStage
              callStage = CallStage.Leave;
              callOnLeave = callOnLeave.filter(Boolean);
            }

            if (callStage === CallStage.Leave && callOnLeave.length) {
              // The subtree has been searched and we need to walk back up the tree to call commands
              // that opted into `callOnLeave`
              const nodes = callOnLeave.shift();
              if (nodes) {
                nodes.forEach(enque);
              }
            }

            if (
              !callOnLeave.length &&
              callOnResolveLeave.length &&
              callStage !== CallStage.ResolveLeave
            ) {
              // Update state to reflect callStage
              callStage = CallStage.ResolveLeave;
            }

            if (
              callStage === CallStage.ResolveLeave &&
              callOnResolveLeave.length
            ) {
              // Walk back up to the root if any matched commands need be called again
              const nextNode = callOnResolveLeave.shift();
              if (nextNode) {
                enque(nextNode);
              }
            }

            // Check workerCount again since above enque calls could have incremented it
            if (workerCount > 0) {
              return;
            }

            done();
          });
      }

      if (currentMatchedNode.command.commands) {
        // Start the search loop
        enque(currentMatchedNode);
      } else {
        done();
      }
    });

    if (currentCalledIndex !== calledIndex) {
      return;
    }

    previousMatchedPath = matchedPath;

    onUpdate({
      options: getCurrentOptions(),
      errors: errors.length ? errors : undefined,
      value,
      searchValue,
      matchedPath,
      rootNode: matchedPath[0],
    });
  };
}
