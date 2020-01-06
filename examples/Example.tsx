import React, { useRef } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import Downshift from 'downshift';

import { useInputState, ISuggestion, Session, ISessionItemProps } from '../src';
import commands from './commands';

interface IProps extends ISessionItemProps {
  value?: string;
}

const Prompt = (props: IProps) => {
  const input = useRef<HTMLInputElement>(null);
  const [state, update] = useInputState({ commands, value: props.value });
  const [selection, setSelection] = React.useState<ISuggestion>(null);

  const onKeyUp = React.useCallback(
    (e) => {
      const index = e.target.selectionStart;
      if (state.index !== index) {
        update({ index });
      }
    },
    [state.index],
  );

  const run = React.useCallback(() => {
    if (!props.item || !state.run) {
      return;
    }

    props.item.insertAfter(state.run(), <Prompt value="" {...props} />).next();
  }, [state.run, props.item]);

  React.useEffect(() => {
    if (selection && state.exhausted) {
      run();
    }
  }, [selection]);

  React.useEffect(() => {
    if (selection && input.current) {
      const index = selection.cursorTarget + 1;
      input.current.setSelectionRange(index, index);
    }
  }, [selection, input]);

  return (
    <Downshift
      isOpen
      inputValue={state.value}
      initialHighlightedIndex={0}
      defaultHighlightedIndex={0}
      onChange={(suggestion: ISuggestion) => {
        if (!suggestion) {
          return;
        }

        update({ value: `${suggestion.inputValue} `, index: suggestion.cursorTarget + 1 });
        setSelection(suggestion);
      }}
      itemToString={() => state.value}
    >
      {(ds) => (
        <div className="container">
          <div className="input-container">
            <input
              {...ds.getInputProps({
                ref: input,
                autoFocus: true,
                spellCheck: false,
                placeholder: 'type a command',
                onKeyUp,
                onChange: ({ target }) => {
                  update({ value: target.value, index: target.selectionStart });
                },
                onKeyDown: (event) => {
                  setSelection(null);
                  if (event.key === 'Enter' && !state.suggestions.length && state.runnable) {
                    run();
                  }
                },
              })}
            />
            <div className="menu-anchor">
              <div className="menu">
                <div className="menu-offset">{state.value.slice(0, state.index)}</div>
                <ul {...ds.getMenuProps({ style: { listStyle: 'none', margin: 0, padding: 0 } })}>
                  {state.suggestions.length
                    ? state.suggestions.map((item, index) => (
                        <li
                          className={ds.highlightedIndex === index ? 'highlighted' : undefined}
                          {...ds.getItemProps({
                            key: item.value,
                            index,
                            item,
                          })}
                        >
                          {item.value}
                        </li>
                      ))
                    : null}
                </ul>
              </div>
            </div>
          </div>
          {true && (
            <pre style={{ fontSize: 10 }}>
              <code>{JSON.stringify({ state }, null, 2)}</code>
            </pre>
          )}
          <style jsx>
            {`
              input {
                background-color: transparent;
                border: 0 none;
                padding: 5px 0;
                display: block;
                width: 100%;
              }

              input:focus {
                outline: 0 none;
              }

              input,
              input::placeholder {
                color: inherit;
              }

              input,
              .menu-offset {
                font-size: 18px;
                font-family: 'IBM Plex Sans Condensed', sans-serif;
                font-family: 'IBM Plex Mono', monospace;
              }

              .menu {
                display: flex;
              }

              .menu-offset {
                flex: 0 0 auto;
                white-space: pre;
                visibility: hidden;
              }

              ul {
                padding: 0;
                list-style: none;
                background-color: rgba(255, 255, 255, 0.2);
              }

              li {
                white-space: nowrap;
              }

              .highlighted {
                background-color: rgba(255, 255, 255, 0.4);
              }
            `}
          </style>
        </div>
      )}
    </Downshift>
  );
};

const Example = () => (
  <div>
    <Session>
      <Prompt />
    </Session>
    <style jsx>
      {`
        div {
          padding: 10px;
          color: white;
          background-color: black;
          font-family: 'IBM Plex Sans', sans-serif;
        }
      `}
    </style>
  </div>
);

export default Example;
