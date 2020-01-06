import { parse } from '../parser';
import { getCmdContext, getCommands, getArgs, getNode } from '../util';
import { ILocation, INode, ICommand } from '../types';
import cmds from './cmds';

describe('index', () => {
  describe('getCommands', () => {
    const tests: Array<[string, Array<string>]> = [
      ['add', ['add']],
      ['user add', ['user', 'add']],
      ['user add role', ['user', 'add', 'role']],
      ['user add --role', ['user', 'add']],
      ['user add --role admin', ['user', 'add']],
    ];

    tests.forEach(([command, expected]) => {
      it(`gets commands from '${command}'`, () => {
        expect(getCommands(parse(command))).toEqual(expected);
      });
    });
  });

  describe('getArgs', () => {
    const tests: Array<[string, Record<string, string | true>]> = [
      ['add', {}],
      ['user add', {}],
      ['user add -r', { r: true }],
      ['user add --r', { r: true }],
      ['user add -r admin', { r: 'admin' }],
      ['user add -r "admin"', { r: 'admin' }],
      ['user add -f -r "admin"', { f: true, r: 'admin' }],
      ["user add -f -r 'admin'", { f: true, r: 'admin' }],
      ["user add -f -r 'admin' -p", { f: true, r: 'admin', p: true }],
      ["user add --f --r 'admin'", { f: true, r: 'admin' }],
    ];

    tests.forEach(([command, expected]) => {
      it(`gets args from '${command}'`, () => {
        expect(getArgs(parse(command))).toEqual(expected);
      });
    });
  });

  describe('getNode', () => {
    const first: INode = { start: 0, end: 3, type: 'COMMAND', value: '123' };
    const second: INode = { start: 3, end: 8, type: 'COMMAND', value: '4567' };
    const third: INode = { start: 8, end: 12, type: 'COMMAND', value: '8910' };

    const nodes = [first, second, third];

    const tests: Array<[number, ILocation | undefined]> = [
      [0, first],
      [2, first],
      [3, second],
      [7, second],
      [8, third],
      [11, third],
      [12, undefined],
    ];

    tests.forEach(([index, expected]) => {
      it(`gets node at index: ${index}`, () => {
        expect(getNode(nodes, index)).toEqual(expected);
      });
    });
  });
});

describe('getCmdContext', () => {
  it('returns undefined when there is no matching command', () => {
    const input = 'foo';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      undefined,
      'foo',
    ]);
  });

  it('returns undefined when there is a partially matching command', () => {
    const input = 'use';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      undefined,
      'use',
    ]);
  });

  it('returns undefined when index is on a partially matching command', () => {
    const input = 'user';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length - 1 })).toEqual([
      undefined,
      undefined,
    ]);
  });

  it('returns command when matched', () => {
    const input = 'user';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      cmds.user,
      undefined,
    ]);
  });

  it('returns command when matched with space', () => {
    const input = 'user ';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      cmds.user,
      undefined,
    ]);
  });

  it('returns command when matched with space and partial sub command', () => {
    const input = 'user ad';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      cmds.user,
      'ad',
    ]);
  });

  it('returns command when matched with space and partial sub command and flag', () => {
    const input = 'user ad --foo';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      cmds.user,
      'ad',
    ]);
  });

  const userCommands = cmds.user.commands as Record<string, ICommand>;

  it('returns sub-command when matched with sub-command', () => {
    const input = 'user addRole';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      userCommands.addRole,
      undefined,
    ]);
  });

  it('returns sub-command when matched with sub-command and space', () => {
    const input = 'user addRole ';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      userCommands.addRole,
      undefined,
    ]);
  });

  it('returns sub-command when matched with sub-command and spaces', () => {
    const input = 'user addRole  ';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      userCommands.addRole,
      undefined,
    ]);
  });

  it('returns sub-command when matched with sub-command, spaces and flag', () => {
    const input = 'user addRole  --foo';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length })).toEqual([
      userCommands.addRole,
      undefined,
    ]);
  });

  it('returns command when matched with sub-command but index is at command', () => {
    const input = 'user addRole';
    expect(getCmdContext({ cmds, ast: parse(input), index: input.length - 2 })).toEqual([
      cmds.user,
      undefined,
    ]);
  });
});
