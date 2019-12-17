import * as React from 'react';
import { mount } from 'enzyme';
import Session from '../index';
import { act } from 'react-dom/test-utils';
import { expectIndex } from '../../testUtil';

describe('session.next()', () => {
  it('updates currentIndex', () => {
    const wrapper = mount(
      <Session>
        <i className="a">a</i>
        <i className="b">b</i>
        <i className="c">c</i>
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
