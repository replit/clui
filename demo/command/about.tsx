import React from 'react';
import Message from './Message';
import { IRunOptions } from '../../src';

export default {
  description: 'Info about what this is',
  run: (args: IRunOptions) => (
    <Message {...args}>
      This is an exmaple of what you can build with{' '}
      <a href="https://github.com/replit/clui">github.com/replit/clui</a>
    </Message>
  ),
};
