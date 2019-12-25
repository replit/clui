import React from 'react';
import { Session } from '..';

describe('index', () => {
  it('renders <Session>', () => {
    expect(
      React.isValidElement(
        <Session>
          <i />
        </Session>,
      ),
    ).toEqual(true);
  });
});
