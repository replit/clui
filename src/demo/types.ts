import {
  Command as CluiCommand,
  CommandNode as CluiCommandNode,
  CommandNodePath as CluiCommandNodePath,
} from '..';
import { ScoredMatchResult } from '../match';
import { Place } from './places';

export type Data = Place;

export type MatchResult = ScoredMatchResult;

export type Command = CluiCommand<Data, MatchResult>;
export type CommandNode = CluiCommandNode<Data, MatchResult>;
export type CommandNodePath = CluiCommandNodePath<Data, MatchResult>;
