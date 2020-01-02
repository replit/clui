import { parse } from '../parser';
import { getCommands, getArgs, getNode } from '../index';
import { Args, ILocation, INode } from '../types';

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
    const tests: Array<[string, Args]> = [
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
