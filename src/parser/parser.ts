// @ts-nocheck
import * as A from 'arcsecond';

type NodeType = 'ROOT' | 'COMMAND' | 'ARGS' | 'ARG' | 'ARG_KEY' | 'ARG_VALUE' | 'WHITESPACE';

const keyword = A.regex(/^[a-zA-Z0-9][^\s\\]*/);
const flagPrefix = A.regex(/^-?(-)/);

const toNode = (type: NodeType) => (result) => ({
  value: result,
  type,
});

const toPos = ({ data, result }) => ({
  ...result,
  start: data.index,
  end: data.index + (result.value ? result.value.length : 0),
});

const setIndex = ({ result, data }) =>
  A.setData({
    ...data,
    index: result && result.value ? data.index + result.value.length : data.index,
  });

const argKey = A.sequenceOf([flagPrefix, keyword])
  .map((result) => result.join(''))
  .map(toNode('ARG_KEY'))
  .mapFromData(toPos)
  .chainFromData(setIndex);

const between = (char: string) =>
  A.sequenceOf([A.char(char), A.everythingUntil(A.char(char)), A.char(char)]).map((r) =>
    r.join(''),
  );

const quoted = A.choice([between('"'), between("'")]).map(toNode('ARG_VALUE_QUOTED'));

const literal = A.everythingUntil(A.choice([A.str(' -'), A.endOfInput])).map(toNode('ARG_VALUE'));

const argValue = A.choice([quoted, literal])
  .mapFromData(toPos)
  .chainFromData(setIndex);

const whitespace = A.whitespace
  .map(toNode('WHITESPACE'))
  .mapFromData(toPos)
  .chainFromData(setIndex);

const arg = A.sequenceOf([argKey, A.possibly(whitespace), A.possibly(argValue)]).map(nullify);

const args = A.many(A.sequenceOf([arg, A.choice([whitespace, A.endOfInput])]))
  .map(flatten)
  .map(nullify)
  .map(flatten)
  .map((result) => {
    if (!result || !result.length) {
      return null;
    }

    return {
      type: 'ARGS',
      start: result[0].start,
      end: result[result.length - 1].end,
      value: result,
    };
  })
  .chainFromData(setIndex);

const command = keyword
  .map(toNode('COMMAND'))
  .mapFromData(toPos)
  .chainFromData(setIndex);

const commandTerminator = A.choice([A.endOfInput, A.whitespace])
  .mapFromData(({ data, result }) => {
    if (!result) {
      return {
        start: data.index,
        end: data.index,
        type: 'END',
        value: '',
      };
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
  return list.reduce((acc, item) => [...acc, ...(item || [])], []);
}

function nullify<D>(list: Array<Array<D>>): Array<D> {
  return list.reduce((acc, item) => {
    if (!item) {
      return acc;
    }

    if (typeof item === 'object' && item.value === '') {
      return acc;
    }

    return [...acc, item];
  }, []);
}

const commands = A.many(A.sequenceOf([command, commandTerminator]).map(flatten)).map(flatten);

const parser = A.withData(
  A.sequenceOf([commands, A.possibly(args)]).mapFromData(({ data, result }) => ({
    type: 'ROOT',
    value: flatten(result),
    start: 0,
    end: data.index,
  })),
);

export const parse = (str: string) => parser({ index: 0 }).run(str);
