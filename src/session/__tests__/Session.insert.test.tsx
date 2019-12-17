import * as React from 'react';
import { mount } from 'enzyme';
import Session, { CLUISession } from '../index';
import { act } from 'react-dom/test-utils';

describe('session.insert(<node>)', () => {
  it('inserts <node> and advances to it', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
      </Session>,
    );

    expect(wrapper.find('.a').length).toEqual(1);
    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(0);
    expect(wrapper.find('.b').length).toEqual(0);

    // @ts-ignore
    act(() =>
      (wrapper.find('.a').prop('session') as CLUISession).insert(
        <i className="b" />,
      ),
    );
    wrapper.update();

    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(1);
  });

  it('inserts multiple <node>s and advances to the first', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
      </Session>,
    );

    expect(wrapper.find('.a').length).toEqual(1);
    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(0);
    expect(wrapper.find('.b').length).toEqual(0);

    act(() =>
      (wrapper.find('.a').prop('session') as CLUISession).insert(
        <i className="b" />,
        <i className="c" />,
      ),
    );
    wrapper.update();

    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(1);

    expect((wrapper.find('.a').prop('session') as CLUISession).length).toEqual(
      3,
    );

    expect(wrapper.find('.b').length).toEqual(1);
    expect(wrapper.find('.c').length).toEqual(0);
  });
});
