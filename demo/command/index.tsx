import { ICommand, SubCommands } from '../../src';
import about from './about';
import depth from './depth';
import theme from './theme';

export interface IAppCommand extends ICommand {
  description?: string;
  commands?: SubCommands<IAppCommand>;
}

const root: IAppCommand = {
  commands: {
    about,
    theme,
    depth,
  },
};

export default root;
