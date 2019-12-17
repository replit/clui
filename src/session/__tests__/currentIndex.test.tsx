import * as React from 'react';
import { mount } from 'enzyme';
import Session from '../Session';
import { act } from 'react-dom/test-utils';
import { expectIndex } from '../../testUtil';

describe('session.next()', () => {
  it('updates currentIndex', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </Session>,
    );

    expectIndex(wrapper, 0)('a');

    let currentStep = wrapper.find('.a');
    // @ts-ignore
    act(() => currentStep.prop('session').next());
    wrapper.update();

    ['a', 'b'].forEach(expectIndex(wrapper, 1));

    currentStep = wrapper.find('.b');
    // @ts-ignore
    act(() => currentStep.prop('session').next());
    wrapper.update();

    ['a', 'b', 'c'].forEach(expectIndex(wrapper, 2));
  });
});
