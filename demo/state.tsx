export interface ITheme {
  background: string;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  foreground: string;
  font: string;
  fontSize: number;
  menuBackground: string;
  menuForeground: string;
  activeMenuItemBackground: string;
  activeMenuItemForeground: string;
  successForeground: string;
}

export const defaultTheme = {
  background: 'black',
  foreground: 'white',
  font: 'Roboto Mono',
  fontSize: 14,
  menuBackground: 'lightslategray',
  menuForeground: 'white',
  activeMenuItemBackground: 'floralwhite',
  activeMenuItemForeground: 'black',
  successForeground: 'springgreen',
  backgroundImage:
    'https://images.unsplash.com/photo-1444927714506-8492d94b4e3d',
  backgroundImageOpacity: 0.75,
};

export const themeDescription = {
  background: 'the background of the whole page',
  foreground: 'the general font color',
  backgroundImage: 'an image url for the background',
  backgroundImageOpacity:
    'the opacity of the background image (overlayed on page background color)',
  font: 'the font (loaded from google fonts)',
  fontSize: 'the size of the text',
  menuBackground: 'the background color of the autocomplete menu',
  menuForeground: 'the text color of thee autocomplete menu',
  activeMenuItemBackground: 'the background color of the active menu item',
  activeMenuItemForeground: 'the text color of the active menu item',
  successForeground: 'Text color of success checkmark',
};

export type IAppState = ITheme;

export type Action =
  | {
      type: 'UPDATE_THEME';
      name: string;
      updates: Partial<ITheme>;
    }
  | {
      type: 'RESET_THEME';
    };

export const reducer = (state: IAppState, action: Action) => {
  switch (action.type) {
    case 'UPDATE_THEME':
      return {
        ...state,
        ...action.updates,
      };
    case 'RESET_THEME':
      return {
        ...state,
        ...defaultTheme,
      };
    default:
      return state;
  }
};

export const initialState = defaultTheme;
