import { IConfig, IInputStateUpdates } from './state';
import { createInput } from './input';

export {
  ICommands,
  ICommand,
  ICommandArgs,
  IArg,
  ArgType,
  ArgTypeDef,
  IOption,
  IRunOptions,
  SubCommands,
} from './types';

export { IConfig, IInputStateUpdates };

export default createInput;
