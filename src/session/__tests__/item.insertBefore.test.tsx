import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Session, { ISessionItem } from '../Session';

describe('session.insertBefore(<element>)', () => {
  it('inserts <element> before item', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
      </Session>,
    );

    let item = wrapper.find('.a').prop('item') as ISessionItem;

    expect(wrapper.childAt(0).prop('className')).toEqual('a');
    expect(item.session.currentIndex).toEqual(0);
    expect(item.session).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);

    act(() => {
      item.insertBefore(<i className="b" />);
    });
    wrapper.update();

    expect(wrapper.childAt(0).prop('className')).toEqual('b');
    expect(wrapper.childAt(1).prop('className')).toEqual('a');

    item = wrapper.find('.a').prop('item') as ISessionItem;
    expect(item.session.currentIndex).toEqual(1);
    expect(item.session).toHaveLength(2);
  });

  it('inserts multiple <elements> before item', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
      </Session>,
    );

    let item = wrapper.find('.a').prop('item') as ISessionItem;

    expect(wrapper.childAt(0).prop('className')).toEqual('a');
    expect(item.session.currentIndex).toEqual(0);
    expect(item.session).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);

    act(() => {
      item.insertBefore(<i className="b" />, <i className="c" />);
    });
    wrapper.update();

    expect(wrapper.childAt(0).prop('className')).toEqual('b');
    expect(wrapper.childAt(1).prop('className')).toEqual('c');
    expect(wrapper.childAt(2).prop('className')).toEqual('a');

    item = wrapper.find('.a').prop('item') as ISessionItem;
    expect(item.index).toEqual(2);
    expect(item.session.currentIndex).toEqual(2);
    expect(item.session).toHaveLength(3);
  });

  it('inserts multiple <elements> before item and moves back 1 when previous is called', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
      </Session>,
    );

    let item = wrapper.find('.a').prop('item') as ISessionItem;

    expect(wrapper.childAt(0).prop('className')).toEqual('a');
    expect(item.session.currentIndex).toEqual(0);
    expect(item.session).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);

    act(() => {
      item.insertBefore(<i className="b" />, <i className="c" />);
      item.previous();
    });
    wrapper.update();

    expect(wrapper.childAt(0).prop('className')).toEqual('b');
    expect(wrapper.childAt(1).prop('className')).toEqual('c');
    expect(wrapper.find('.a')).toHaveLength(0);

    item = wrapper.find('.b').prop('item') as ISessionItem;
    expect(item.index).toEqual(0);
    expect(item.session.currentIndex).toEqual(1);
    expect(item.session).toHaveLength(3);
  });
});
