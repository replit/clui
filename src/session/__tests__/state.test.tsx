import * as React from 'react';
import { mount } from 'enzyme';
import Session, { CLUISession } from '../Session';
import { act } from 'react-dom/test-utils';

describe('session.insert(<node>)', () => {
  it('updates state by value', () => {
    const wrapper = mount(
      <Session initialState={{ a: 1 }}>
        <i className="a" />
      </Session>,
    );

    expect((wrapper.find('.a').prop('session') as CLUISession).state).toEqual({
      a: 1,
    });

    act(() =>
      (wrapper.find('.a').prop('session') as CLUISession).setState({
        a: 2,
      }),
    );
    wrapper.update();

    expect((wrapper.find('.a').prop('session') as CLUISession).state).toEqual({
      a: 2,
    });
  });

  it('updates state by function', () => {
    const wrapper = mount(
      <Session initialState={{ a: 1 }}>
        <i className="a" />
      </Session>,
    );

    expect((wrapper.find('.a').prop('session') as CLUISession).state).toEqual({
      a: 1,
    });

    act(() =>
      (wrapper.find('.a').prop('session') as CLUISession<{
        a: number;
      }>).setState(prev => ({
        a: prev.a + 1,
      })),
    );
    wrapper.update();

    expect((wrapper.find('.a').prop('session') as CLUISession).state).toEqual({
      a: 2,
    });
  });
});
