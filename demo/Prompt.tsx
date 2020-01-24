import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import Downshift from 'downshift';
import MatchSubString from './MatchSubString';
import { IAppCommand } from './command';

import { useInputState, IOption, ISessionItemProps } from '../src';

interface IProps extends ISessionItemProps {
  command: IAppCommand;
  value?: string;
}

const Prompt = (props: IProps) => {
  const [state, update] = useInputState({
    command: props.command,
    value: props.value || '',
    index: props.value ? props.value.length : 0,
  });

  const onKeyUp = React.useCallback(
    (e) => update({ index: e.target.selectionStart }),
    [update],
  );

  const run = React.useCallback(() => {
    if (!props.item || !state.run) {
      return;
    }

    props.item.insertAfter(state.run(), <Prompt {...props} value="" />).next();
  }, [props.item, state.run]);

  const isLast =
    props.item && props.item.index === props.item.session.currentIndex;

  return (
    <Downshift
      isOpen
      inputValue={state.value}
      onChange={(option: IOption) => {
        if (!option) {
          return;
        }

        update({
          value: `${option.inputValue} `,
          index: option.cursorTarget + 1,
        });
      }}
      itemToString={() => state.value}
    >
      {(ds) => (
        <div className="container">
          <div className="input-container">
            {isLast && state.run && (state.exhausted || state.args) ? (
              <div className="input-shadow">
                <span>{state.value}</span>
                <button type="button" onClick={run}>
                  run ↵
                </button>
              </div>
            ) : null}
            <input
              {...ds.getInputProps({
                autoFocus: true,
                spellCheck: false,
                placeholder: 'type a command',
                onKeyUp,
                disabled: !isLast,
                onChange: ({ target }) => {
                  update({ value: target.value, index: target.selectionStart });
                },
                onKeyDown: (event) => {
                  if (
                    event.key === 'Enter' &&
                    (!state.options.length ||
                      typeof ds.highlightedIndex !== 'number') &&
                    state.run
                  ) {
                    run();
                  }

                  if (event.key === 'ArrowUp' && ds.highlightedIndex === 0) {
                    // eslint-disable-next-line
                    // @ts-ignore
                    event.nativeEvent.preventDownshiftDefault = true;
                    event.preventDefault();
                    ds.setState({ highlightedIndex: null });
                  }
                },
              })}
            />
            <div className="menu-anchor">
              <div className="menu">
                <div className="menu-offset">
                  {state.value.slice(0, state.index)}
                </div>
                <ul {...ds.getMenuProps()}>
                  {isLast
                    ? state.options.map((item, index) => (
                        <li
                          {...ds.getItemProps({ item })}
                          key={item.value}
                          className={`item${
                            ds.highlightedIndex === index ? ' active' : ''
                          }`}
                        >
                          <div className="value">
                            {item.searchValue ? (
                              <MatchSubString
                                source={item.value}
                                match={item.searchValue}
                              />
                            ) : (
                              item.value
                            )}
                          </div>
                          {item.data ? (
                            <div className="description">
                              {item.data.description}
                            </div>
                          ) : null}
                        </li>
                      ))
                    : null}
                  {state.loading ? <li>loading...</li> : null}
                </ul>
              </div>
            </div>
          </div>
          <style jsx>
            {`
              .container {
                opacity: ${isLast ? 1 : 0.8};
              }
              input {
                background-color: transparent;
                color: inherit;
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
              .input-shadow,
              .menu-offset {
                font-size: inherit;
                font-family: inherit;
              }
              .input-container {
                position: relative;
              }
              .menu-anchor {
                position: absolute;
                top: 100%;
                left: 0;
              }
              .menu {
                display: flex;
              }
              .description {
                opacity: 0.75;
                padding: 2px 0px;
              }
              .menu-offset {
                flex: 0 0 auto;
                white-space: pre;
                visibility: hidden;
              }
              ul {
                max-width: 300px;
                padding: 0;
                margin: 0;
                list-style: none;
                background-color: var(--menu-background);
                color: var(--menu-foreground);
              }
              .item {
                padding: 5px 0;
              }
              .active {
                background-color: var(--active-menu-item-background);
                color: var(--active-menu-item-foreground);
              }
              .input-shadow {
                pointer-events: none;
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
              }
              .input-shadow span {
                visibility: hidden;
              }
              .input-shadow button {
                margin-left: 15px;
                pointer-events: all;
                background-color: transparent;
                border: 1px solid var(--foreground);
                color: inherit;
                border-radius: 3px;
                font-size: 14px;
                text-transform: uppercase;
                padding: 3px 8px;
                font-size: 14px;
                cursor: pointer;
              }
              .input-shadow button:hover {
                color: var(--active-menu-item-foreground);
                border-color: var(--active-menu-item-background);
                background-color: var(--active-menu-item-background);
              }
              .input-shadow button:focus {
                outline: 0 none;
              }
            `}
          </style>
        </div>
      )}
    </Downshift>
  );
};

export default Prompt;
