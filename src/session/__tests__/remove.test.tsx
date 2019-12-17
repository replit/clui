import * as React from 'react';
import { mount } from 'enzyme';
import Session, { CLUISession } from '../Session';
import { act } from 'react-dom/test-utils';

describe('session.remove()', () => {
  it('removes node', () => {
    const wrapper = mount(
      <Session initialIndex={1}>
        <i className="a" />
        <i className="b" />
      </Session>,
    );

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(1);
    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(1);

    act(() => (wrapper.find('.b').prop('session') as CLUISession).remove());
    wrapper.update();

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(0);
    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(0);
  });
});
