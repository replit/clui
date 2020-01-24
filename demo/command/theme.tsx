import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import htmlColors from 'html-colors';
import { Success } from './Message';
import events from '../events';
import fonts from '../fonts';
import { defaultTheme, themeDescription } from '../state';

const colorsFn = (search?: string) => {
  const colors = search
    ? htmlColors
        .names()
        .filter(
          (name: string) =>
            name.toLowerCase().includes(search.toLowerCase()) &&
            name !== search,
        )
    : htmlColors.names();

  return colors.slice(0, 6).map((value) => ({ value }));
};

const fontsFn = async (search?: string) => {
  const result = search
    ? fonts.filter(({ name }) => name.includes(search) && name !== search)
    : fonts;

  return result.map((font) => ({ ...font, value: `"${font.name}"` }));
};

const COLOR_KEYS = Object.keys(defaultTheme).filter((k) => {
  const lower = k.toLowerCase();

  if (lower.includes('image')) {
    return false;
  }

  return lower.includes('foreground') || lower.includes('background');
});

const NUM_KEYS = Object.keys(defaultTheme).filter((k) => {
  const lower = k.toLowerCase();

  return lower.includes('size') || lower.includes('opacity');
});

const set = {
  description: 'Configure theme values',
  args: Object.keys(themeDescription).reduce((acc, key) => {
    acc[key] = {
      description: themeDescription[key],
      type: NUM_KEYS.includes(key) ? Number : String,
    };

    if (COLOR_KEYS.includes(key)) {
      acc[key].options = colorsFn;
    } else if (key === 'font') {
      acc[key].options = fontsFn;
    }

    return acc;
  }, {}),
  run: (props: any) => {
    events.emit('ACTION', { type: 'UPDATE_THEME', updates: props.args });

    return <Success {...props}>Theme updated</Success>;
  },
};

const reset = {
  description: 'Reset theme to initial values',
  run: (props: any) => {
    events.emit('ACTION', { type: 'RESET_THEME' });

    return <Success {...props}>Theme reset</Success>;
  },
};

export default {
  description: 'Configure theme',
  commands: {
    set,
    reset,
  },
};
