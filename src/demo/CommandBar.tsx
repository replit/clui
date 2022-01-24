import * as React from 'react';
import { useCombobox } from 'downshift';
import { useCompleter } from '../react';
import { simpleMatch } from '../match';
import { places } from './places';
import { CommandNode, Data, MatchResult } from './types';
import {
  Block,
  InputBlock,
  Map,
  Menu,
  MenuItem,
  Output,
  Prompt,
  XButton,
} from './ui';

export default function CommandBar() {
  const completer = useCompleter<Data, MatchResult>({
    root: places,
    matchOption({ searchValue, data, currentSearchDepth }) {
      return simpleMatch(data.label, { searchValue, currentSearchDepth });
    },
    sortOptions(a, b) {
      return b.matchResult.score - a.matchResult.score;
    },
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  const combobox = useCombobox({
    defaultHighlightedIndex: 0,
    initialHighlightedIndex: 0,
    inputValue: completer.inputValue,
    items: completer.options,
    itemToString(item) {
      return item?.value || '';
    },
    onSelectedItemChange({ selectedItem }) {
      if (!selectedItem) {
        return;
      }

      completer.selectPath(selectedItem.path);
      //combobox.openMenu();
    },
  });

  const selectedCommand: undefined | CommandNode =
    completer.matchedPath[completer.matchedPath.length - 1];

  const inputIcon = (() => {
    if (combobox.inputValue) {
      return (
        <XButton
          onClick={() => {
            completer.updateInputValue('');
            inputRef.current?.focus();
          }}
        />
      );
    }

    if (combobox.isOpen) {
      return;
    }

    return (
      <button className="DownButton" {...combobox.getToggleButtonProps()}>
        <span>▼</span>
      </button>
    );
  })();

  const selectedData = selectedCommand?.command.data;

  return (
    <div>
      <div className="CommandBar">
        <div {...combobox.getComboboxProps()}>
          <Prompt>
            {completer.matchedPath.map(({ token, command }, index) => {
              if (!token.value) {
                return null;
              }
              const { data } = command;

              return (
                <Block
                  key={token.value + token.start}
                  label={data.label}
                  active={completer.isIndexSelected(index)}
                  onTextClick={() => {
                    completer.selectPath(
                      completer.matchedPath.slice(0, index),
                      { inputValue: command.data.label }
                    );
                    setTimeout(() => {
                      inputRef.current?.select();
                    });
                  }}
                  onRemoveClick={() => {
                    completer.selectPath(completer.matchedPath.slice(0, index));
                    setTimeout(() => {
                      inputRef.current?.focus();
                    });
                  }}
                />
              );
            })}
            <InputBlock
              iconRight={inputIcon}
              hasSubCommands={Boolean(selectedCommand?.command.commands)}
            >
              <input
                {...combobox.getInputProps({
                  placeholder: 'Type here...',
                  ref: inputRef,
                  onKeyDown: completer.handleKeydown,
                  onFocus: () => combobox.openMenu(),
                  onChange(e) {
                    completer.updateInputValue(e.currentTarget.value);
                  },
                })}
              />
              <div {...combobox.getMenuProps()}>
                <Menu>
                  {combobox.isOpen ? (
                    <ul>
                      {completer.options.map((item, index) => {
                        const heading = item.ancestors
                          .slice(completer.matchedPath.length)
                          .map(({ command }) =>
                            'label' in command.data ? command.data.label : null
                          )
                          .filter(Boolean)
                          .join(' > ');

                        return (
                          <li
                            key={item.value}
                            {...combobox.getItemProps({ item, index })}
                          >
                            <MenuItem
                              active={combobox.highlightedIndex === index}
                              heading={heading}
                              label={item.data.label}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </Menu>
              </div>
            </InputBlock>
          </Prompt>
        </div>
      </div>
      {selectedData?.type === 'place' ? (
        <Output dimmed={combobox.isOpen && completer.options.length > 0}>
          <Map place={selectedData} />
        </Output>
      ) : null}
    </div>
  );
}
