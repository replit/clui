// @ts-nocheck
import * as A from 'arcsecond';

type NodeType = 'ROOT' | 'COMMAND' | 'ARGS' | 'ARG' | 'ARG_KEY' | 'ARG_VALUE' | 'WHITESPACE';

const keyword = A.regex(/^[a-zA-Z0-9][^\s\\]*/);
const flagPrefix = A.regex(/^-?(-)/);

const tag = (type: NodeType) => ({ data, result }) => ({
  type,
  start: data.index,
  end: data.index + result.length,
  value: result,
});

const setIndex = ({ result, data }) =>
  A.setData({
    ...data,
    index: result && result.value ? data.index + result.value.length : data.index,
  });

const argKey = A.sequenceOf([flagPrefix, keyword])
  .map((result) => result.join(''))
  .mapFromData(tag('ARG_KEY'))
  .chainFromData(setIndex);

export const between = (char: string) =>
  A.between(A.char(char))(A.char(char))(A.everythingUntil(A.char(char)));

const quoted = A.choice([between('"'), between("'")]);

const argValue = A.choice([quoted, A.everythingUntil(A.choice([A.str(' -'), A.endOfInput]))])
  .mapFromData(tag('ARG_VALUE'))
  .chainFromData(setIndex);

export const arg = A.withData(
  A.sequenceOf([
    argKey,
    A.possibly(A.whitespace.mapFromData(tag('WHITESPACE')).chainFromData(setIndex)),
    A.possibly(argValue),
  ]),
);

const command = keyword.mapFromData(tag('COMMAND')).chainFromData(setIndex);

const commandTerminator = A.choice([A.endOfInput, A.whitespace])
  .mapFromData(({ data, result }) => {
    // console.log(3, { result, data });

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
  return list.reduce((acc, item) => [...acc, ...item], []);
}

const commands = A.many(A.sequenceOf([command, commandTerminator]).map(flatten)).map(flatten);

const parser = A.withData(
  A.sequenceOf([commands]).mapFromData(({ data, result }) =>
    // console.log(5, { data });
    // console.log(JSON.stringify(flatten(result), null, 2));

    ({
      type: 'ROOT',
      value: flatten(result),
      start: 0,
      end: data.index,
    }),
  ),
);

export const parse = (str: string) => parser({ index: 0 }).run(str);
