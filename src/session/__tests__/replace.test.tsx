import * as React from 'react';
import { mount } from 'enzyme';
import Session, { CLUISession } from '../Session';
import { act } from 'react-dom/test-utils';

describe('session.replace()', () => {
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
      (wrapper.find('.b').prop('session') as CLUISession).currentIndex,
    ).toEqual(1);

    act(() =>
      (wrapper.find('.b').prop('session') as CLUISession).replace(
        <i className="c" />,
      ),
    );
    wrapper.update();

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(0);
    expect(wrapper.find('.c').length).toEqual(1);
    expect(
      (wrapper.find('.c').prop('session') as CLUISession).currentIndex,
    ).toEqual(1);
  });
});
