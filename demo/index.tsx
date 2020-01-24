import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Helmet } from 'react-helmet';
import { Session } from '../src';
import Prompt from './Prompt';
import root from './command';
import events from './events';
import { reducer, IAppState, Action, initialState } from './state';

const webfontsUrl = (names: Array<string>) =>
  `https://fonts.googleapis.com/css?family=${names
    .map((name) => name.replace(' ', '+'))
    .join('|')}&display=swap`;

const Demo = () => {
  const [theme, dispatch] = React.useReducer<React.Reducer<IAppState, Action>>(
    reducer,
    initialState,
  );

  React.useEffect(() => {
    events.on('ACTION', dispatch);

    return () => events.off('ACTION', dispatch);
  }, [dispatch]);

  return (
    <div>
      <div className="background-image" />
      <Helmet>
        <meta charSet="utf-8" />
        <title>CLUI Demo</title>
        <link href={webfontsUrl([theme.font])} rel="stylesheet" />
      </Helmet>
      <div className="content">
        <Session>
          <Prompt command={root} />
        </Session>
      </div>
      <style jsx global>{`
        :root {
          --background: ${theme.background};
          --background-image-opacity: ${theme.backgroundImageOpacity || 0.75};
          --background-image: url(${theme.backgroundImage});
          --foreground: ${theme.foreground};
          --font: ${theme.font};
          --font-size: ${theme.fontSize}px;
          --menu-background: ${theme.menuBackground};
          --menu-foreground: ${theme.menuForeground};
          --active-menu-item-background: ${theme.activeMenuItemBackground};
          --active-menu-item-foreground: ${theme.activeMenuItemForeground};
          --success-foreground: ${theme.successForeground};
        }
        html,
        body {
          font-family: var(--font);
          font-size: var(--font-size);
          background-color: var(--background);
        }
        body {
          margin: 0;
          color: var(--foreground);
        }
        a,
        a:visited {
          color: var(--foreground);
        }
        .background-image {
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center center;
          top: 0;
          left: 0;
          position: fixed;
          width: 100%;
          height: 100%;
          background-image: var(--background-image);
          opacity: var(--background-image-opacity);
        }
        .content {
          position: relative;
          padding: 20vh 20px 20vh;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>
    </div>
  );
};

export default Demo;
