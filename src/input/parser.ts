// @ts-nocheck
// Wating for better typescript support https://github.com/francisrstokes/arcsecond/pull/35
import * as A from 'arcsecond';
import { INode, IData } from './types';

const keyword = A.regex(/^[a-zA-Z0-9][^\s\\]*/);
const flagPrefix = A.regex(/^-?(-)/);

type IBaseNode = Pick<INode, 'type' | 'node'>;

interface IFromData {
  data: IData;
  result: IBaseNode;
}

const toNode = (type: NodeType) => (result: IBaseNode) => ({
  value: result,
  type,
});

const toLocation = ({ data, result }: IFromData) => ({
  ...result,
  start: data.index,
  end: data.index + (result.value ? result.value.length : 0),
});

const setIndex = ({ result, data }: IFromData) =>
  A.setData({
    ...data,
    index:
      result && result.value ? data.index + result.value.length : data.index,
  });

const whitespace = A.whitespace
  .map(toNode('WHITESPACE'))
  .mapFromData(toLocation)
  .chainFromData(setIndex);

const argKey = A.sequenceOf([
  flagPrefix,
  A.everythingUntil(A.choice([A.endOfInput, whitespace])),
])
  .map(nullify)
  .map((result) => result.join(''))
  .map(toNode('ARG_KEY'))
  .mapFromData(toLocation)
  .chainFromData(setIndex);

const between = (char: string) =>
  A.sequenceOf([
    A.char(char),
    A.everythingUntil(A.char(char)),
    A.char(char),
  ]).map((r) => r.join(''));

const quoted = A.choice([between('"'), between("'")]).map(
  toNode('ARG_VALUE_QUOTED'),
);

const literal = keyword.map(toNode('ARG_VALUE'));

const argValue = A.choice([quoted, literal])
  .mapFromData(toLocation)
  .chainFromData(setIndex);

const arg = A.sequenceOf([
  argKey,
  A.possibly(whitespace),
  A.possibly(argValue),
]).map(nullify);

const args = A.many(
  A.sequenceOf([arg, A.possibly(A.choice([whitespace, A.endOfInput]))]),
)
  .map(flatten)
  .map(nullify)
  .map(flatten);

const command = keyword
  .map(toNode('COMMAND'))
  .mapFromData(toLocation)
  .chainFromData(setIndex);

const commandTerminator = A.choice([A.endOfInput, A.whitespace])
  .mapFromData(({ data, result }) => {
    if (!result) {
      return null;
    }

    return {
      start: data.index,
      end: data.index + result.length,
      type: 'WHITESPACE',
      value: result,
    };
  })
  .chainFromData(setIndex);

function flatten<D>(list: Array<Array<D>>): Array<D> {
  return list.reduce((acc, item) => {
    if (Array.isArray(item)) {
      return [...acc, ...item];
    }

    if (item) {
      return [...acc, item];
    }

    return acc;
  }, []);
}

function nullify<D>(list: Array<Array<D>>): Array<D> {
  return list.reduce((acc: Array<D>, item: Array<D>) => {
    if (!item) {
      return acc;
    }

    if (typeof item === 'object' && item.value === '') {
      return acc;
    }

    return [...acc, item];
  }, []);
}

const commands = A.many(A.sequenceOf([command, commandTerminator]))
  .map(flatten)
  .map(nullify);

const parser = A.withData(
  A.sequenceOf([commands, A.possibly(args)]).map(flatten),
);

export const parse = (source: string) => {
  const parsed = parser({ index: 0 }).run(source);

  return {
    isError: parsed.isError,
    index: parsed.data.index,
    source,
    result: parsed.result,
  };
};
