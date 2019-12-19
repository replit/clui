import * as React from 'react';
import { mount } from 'enzyme';
import Session, { ISessionItem } from '../Session';
import { act } from 'react-dom/test-utils';

describe('session.replace()', () => {
  it('replaces element', () => {
    const wrapper = mount(
      <Session initialIndex={1}>
        <i className="a" />
        <i className="b" />
      </Session>,
    );

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(1);
    expect((wrapper.find('.b').prop('item') as ISessionItem).session.currentIndex).toEqual(1);

    act(() => {
      (wrapper.find('.b').prop('item') as ISessionItem).replace(<i className="c" />);
    });
    wrapper.update();

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(0);
    expect(wrapper.find('.c').length).toEqual(1);
    expect((wrapper.find('.c').prop('item') as ISessionItem).session.currentIndex).toEqual(1);
  });
});
