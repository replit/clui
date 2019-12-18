import * as React from 'react';
import { mount } from 'enzyme';
import Session, { ISessionItem } from '../Session';
import { act } from 'react-dom/test-utils';

describe('item.previous()', () => {
  it('shows previous element', () => {
    const wrapper = mount(
      <Session initialIndex={2}>
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </Session>,
    );

    act(() => {
      (wrapper.find('.c').prop('item') as ISessionItem).previous();
    });
    wrapper.update();
    expect(wrapper.find('.c').length).toEqual(0);
    expect(wrapper.find('.b').length).toEqual(1);
    expect(wrapper.find('.a').length).toEqual(1);

    act(() => {
      (wrapper.find('.b').prop('item') as ISessionItem).previous();
    });
    wrapper.update();
    expect(wrapper.find('.b').length).toEqual(0);
    expect(wrapper.find('.a').length).toEqual(1);
  });
});
