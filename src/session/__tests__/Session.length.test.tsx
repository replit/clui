import * as React from 'react';
import { mount } from 'enzyme';
import Session, { CLUISession } from '../index';

describe('session.length', () => {
  it('sets the length', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </Session>,
    );

    expect((wrapper.find('.a').prop('session') as CLUISession).length).toEqual(
      3,
    );
  });
});
