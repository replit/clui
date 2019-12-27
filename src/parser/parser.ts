// @ts-nocheck
import * as A from 'arcsecond';

const command = A.regex(/^[a-zA-Z0-9][^\s\\]*/)
  .mapFromData(({ data, result }) =>
    // console.log(1, { result, data });

    ({
      start: data.index,
      end: data.index + result.length,
      type: 'COMMAND',
      value: result,
    }),
  )
  .chainFromData(({ result, data }) =>
    // console.log(2, { result, data });

    A.setData({
      ...data,
      index: data.index + result.value.length,
    }),
  );

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
  .chainFromData(({ result, data }) =>
    // console.log(4, { result, data });

    A.setData({
      ...data,
      index: data.index + result.value.length,
    }),
  );

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
