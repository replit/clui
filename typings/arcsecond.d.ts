// Type definitions for arcsecond
// Project: http://https://github.com/francisrstokes/arcsecond
/* eslint-disable */
declare namespace Arcsecond {
  type ParserState<TResult, TData = void> = {
    isError: boolean;
    error?: string | null;
    target?: string;
    data: TData | null;
    index: number;
    result?: TResult | null;
  };

  type SuccessState<TResult, TData> = ParserState<TResult, TData> & { isError: false };
  type ErrorState<TResult, TData> = ParserState<TResult, TData> & { isError: true };

  type StateData<TResult = string, TData = void> = {
    result: TResult;
    data: TData;
  };

  type ChainCallback<TInput, TOutput> = (result: TInput) => Chain<TOutput>;
  type ChainFromDataCallback<TInput, TOutput, TData> = (
    state: StateData<TInput, TData>,
  ) => Parser<TOutput, TData>;
  type ErrorChainCallback<TInput, TOutput, TData> = (
    state: ErrorState<TInput, TData>,
  ) => Parser<TOutput, TData>;
  type ErrorMapCallback = (error: string, index: number, data: any) => string;
  type ForkErrorCallback<TResult, TErrorResult, TData> = (
    error: string,
    newState: ErrorState<TResult, TData>,
  ) => ParserState<TErrorResult, TData>;
  type ForkSuccessCallback<TResult, TSuccessResult, TData> = (
    result: TResult,
    newState: SuccessState<TResult, TData>,
  ) => ParserState<TSuccessResult, TData>;
  type MapCallback<TInput, TOutput> = (result: TInput) => TOutput;
  type MapDataCallback<TData> = (data: TData) => TData;
  type MapFromDataCallback<TInput, TData, TOutput> = (
    state: StateData<TInput, TData>,
  ) => Parser<TOutput, TData>;

  interface Applicative<T> {
    ['fantasy-land/of'](x: T): Applicative<T>;
  }

  interface Apply<T> {
    ['fantasy-land/ap'](parserOfFunction: Apply<T>): Apply<T>;
  }

  interface Chain<TInput> {
    ['fantasy-land/chain']<TOutput>(fn: ChainCallback<TInput, TOutput>): Chain<TOutput>;
  }

  interface Functor<TInput> {
    ['fantasy-land/map']<TOutput>(fn: MapCallback<TInput, TOutput>): Functor<TOutput>;
  }

  interface Parser<TResult, TData = void> extends Apply<TResult>, Chain<TResult>, Functor<TResult> {
    ap(parserOfFunction: Parser<TResult, TData>): Parser<TResult, TData>;
    chain<TOutput>(fn: ChainCallback<TResult, TOutput>): Parser<TOutput, TData>;
    chainFromData<TOutput>(
      fn: ChainFromDataCallback<TResult, TOutput, TData>,
    ): Parser<TOutput, TData>;
    errorChain<TOutput>(fn: ErrorChainCallback<TResult, TOutput, TData>): Parser<TOutput, TData>;
    errorMap(fn: ErrorMapCallback): Parser<TResult, TData>;
    fork<TErrorResult, TSuccessResult>(
      targetString: string,
      errorFn: ForkErrorCallback<TResult, TErrorResult, TData>,
      successFn: ForkSuccessCallback<TResult, TSuccessResult, TData>,
    ): SuccessState<TResult, TData> | ErrorState<TResult, TData>;
    map<TOutput>(fn: MapCallback<TResult, TOutput>): Parser<TResult, TData>;
    mapData(fn: MapDataCallback<TData>): Parser<TResult, TData>;
    mapFromData<TOutput>(fn: MapFromDataCallback<TResult, TData, TOutput>): Parser<TOutput, TData>;
    run(targetString: string): ParserState<TResult, TData>;
  }

  interface ParserConstructor<TResult, TData = void> extends Applicative<TResult> {
    of: Applicative<TResult>['fantasy-land/of'];
    new (p: <TInput>(state: ParserState<TInput, TData>) => ParserState<TResult, TData>): Parser<
      TResult,
      TData
    >;
    readonly prototype: Parser<TResult, TData>;
  }

  interface StringParser<TData = void> extends Parser<string, TData> {}

  interface StringParserConstructor<TData = void> extends ParserConstructor<string, TData> {}

  interface ArcsecondParsers {
    digit: StringParser;
    digits: StringParser;
    getData: StringParser;
    endOfInput: StringParser;
    letter: StringParser;
    letters: StringParser;
    optionalWhitespace: StringParser;
    whitespace: StringParser;
    anyOfString(s: string): StringParser;
    anythingExcept(parser: StringParser): StringParser;
    between(
      leftParser: StringParser,
    ): (rightParser: StringParser) => (parser: StringParser) => StringParser;
    char(c: string): StringParser;
    choice(parsers: Iterable<StringParser>): StringParser;
    composeParsers(parsers: Iterable<StringParser>): StringParser;
    coroutine(g: () => Generator<any, any, any>): StringParser;
    decide<TData = void>(fn: (state: ParserState<string, TData>) => StringParser): StringParser;
    either(parser: StringParser): StringParser;
    errorMapTo<TData = void>(
      fn: (message: string, index: number, data: TData) => string,
    ): StringParser;
    everythingUntil(parser: StringParser): StringParser;
    lookAhead(parser: StringParser): StringParser;
    many(parser: StringParser): StringParser;
    many1(parser: StringParser): StringParser;
    mapTo<TData = void>(fn: (data: TData) => TData): StringParser;
    mapData<TData = void>(fn: (data: TData) => TData): StringParser;
    namedSequenceOf(pairedParsers: { [key: string]: StringParser }): StringParser;
    parse(parser: StringParser): StringParser;
    pipeParsers(parsers: Iterable<StringParser>): StringParser;
    possibly(parser: StringParser): StringParser;
    recursiveParser(parserThunk: () => StringParser): StringParser;
    regex(re: RegExp): StringParser;
    sepBy(parser: StringParser): (parser: StringParser) => StringParser;
    sepBy1(parser: StringParser): (parser: StringParser) => StringParser;
    sequenceOf(parsers: Iterable<StringParser>): StringParser;
    setData(x: any): StringParser;
    skip(parser: StringParser): StringParser;
    str(s: string): StringParser;
    takeLeft(parser: StringParser): (parser: StringParser) => StringParser;
    takeRight(parser: StringParser): (parser: StringParser) => StringParser;
    tapParser<TData = void>(fn: (state: ParserState<string, TData>) => StringParser): StringParser;
    toPromise<TData = void>(result: ParserState<string, TData>): Promise<string>;
    toValue<TData = void>(result: ParserState<string, TData>): string;
    withData(parser: StringParser): StringParser;
  }

  type ArcsecondAPI = {
    Parser: StringParserConstructor;
  };

  type ArcsecondStatic = ArcsecondParsers & ArcsecondAPI;
}

declare const arcsecond: Arcsecond.ArcsecondStatic;

declare module 'arcsecond' {
  export = arcsecond;
}
