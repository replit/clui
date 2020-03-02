import { ICommands, SearchFn, IOption, ICommandArgs } from './types';

export const commandOptions = (options: {
  commands: ICommands;
  inputValue: string;
  searchFn: SearchFn;
  search?: string;
  sliceStart?: number;
  sliceEnd?: number;
}): Array<IOption> =>
  Object.keys(options.commands).reduce((acc: Array<IOption>, key) => {
    if (
      !options.search ||
      options.searchFn({ source: key, search: options.search })
    ) {
      const { sliceStart, sliceEnd, inputValue } = options;

      const newInputValueStart =
        inputValue && sliceStart !== undefined
          ? inputValue.slice(0, sliceStart) + key
          : key;
      const newInputValue =
        newInputValueStart +
        (inputValue && sliceEnd !== undefined
          ? inputValue.slice(sliceEnd)
          : '');

      acc.push({
        value: key,
        data: options.commands[key],
        inputValue: newInputValue,
        cursorTarget: newInputValueStart.length,
        searchValue: options.search,
      });
    }

    return acc;
  }, []);

export const argsOptions = (options: {
  args: ICommandArgs;
  inputValue: string;
  searchFn: SearchFn;
  search?: string;
  sliceStart?: number;
  sliceEnd?: number;
  exclude?: Array<string>;
}): Array<IOption> => {
  const search = options.search
    ? options.search?.replace(/^-(-?)/, '')
    : undefined;

  return Object.keys(options.args).reduce((acc: Array<IOption>, key) => {
    if (options.exclude && options.exclude.includes(key)) {
      return acc;
    }

    if (!search || options.searchFn({ source: key, search })) {
      const value = `--${key}`;
      const { sliceStart, sliceEnd, inputValue } = options;

      const newInputValueStart =
        inputValue && sliceStart !== undefined
          ? inputValue.slice(0, sliceStart) + value
          : value;
      const newInputValue =
        newInputValueStart +
        (inputValue && sliceEnd !== undefined
          ? inputValue.slice(sliceEnd)
          : '');

      acc.push({
        value,
        data: options.args[key],
        inputValue: newInputValue,
        cursorTarget: newInputValueStart.length,
        searchValue: search,
      });
    }

    return acc;
  }, []);
};

export const valueOptions = <V extends { value: string }>(options: {
  options: Array<V>;
  inputValue: string;
  searchFn: SearchFn;
  search?: string;
  sliceStart?: number;
  sliceEnd?: number;
}): Array<IOption> =>
  options.options.reduce((acc: Array<IOption>, option) => {
    const key = option.value;
    if (
      !options.search ||
      options.searchFn({ source: key, search: options.search })
    ) {
      const { sliceStart, sliceEnd, inputValue } = options;

      const newInputValueStart =
        inputValue && sliceStart !== undefined
          ? inputValue.slice(0, sliceStart) + key
          : key;
      const newInputValue =
        newInputValueStart +
        (inputValue && sliceEnd !== undefined
          ? inputValue.slice(sliceEnd)
          : '');

      acc.push({
        value: key,
        data: option,
        inputValue: newInputValue,
        cursorTarget: newInputValueStart.length,
        searchValue: options.search,
      });
    }

    return acc;
  }, []);
