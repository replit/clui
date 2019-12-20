import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Session, { ISessionItem } from '../Session';

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
    expect(wrapper.find('.c')).toHaveLength(0);
    expect(wrapper.find('.b')).toHaveLength(1);
    expect(wrapper.find('.a')).toHaveLength(1);

    act(() => {
      (wrapper.find('.b').prop('item') as ISessionItem).previous();
    });
    wrapper.update();
    expect(wrapper.find('.b')).toHaveLength(0);
    expect(wrapper.find('.a')).toHaveLength(1);
  });
});
