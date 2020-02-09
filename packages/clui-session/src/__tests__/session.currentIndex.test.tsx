import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Session, { ISessionItem } from '../Session';

describe('item.session.currentIndex', () => {
  describe('item.next()', () => {
    it('updates', () => {
      const wrapper = mount(
        <Session>
          <i className="a" />
          <i className="b" />
          <i className="c" />
        </Session>,
      );

      ['a'].forEach((s, index) => {
        const item = wrapper.find(`.${s}`).prop('item') as ISessionItem;
        expect(item.index).toEqual(index);
        expect(item.session.currentIndex).toEqual(0);
      });

      let currentStep = wrapper.find('.a');
      act(() => {
        (currentStep.prop('item') as ISessionItem).next();
      });
      wrapper.update();

      ['a', 'b'].forEach((s, index) => {
        const item = wrapper.find(`.${s}`).prop('item') as ISessionItem;
        expect(item.index).toEqual(index);
        expect(item.session.currentIndex).toEqual(1);
      });

      currentStep = wrapper.find('.b');
      act(() => {
        (currentStep.prop('item') as ISessionItem).next();
      });

      wrapper.update();

      ['a', 'b', 'c'].forEach((s, index) => {
        const item = wrapper.find(`.${s}`).prop('item') as ISessionItem;
        expect(item.index).toEqual(index);
        expect(item.session.currentIndex).toEqual(2);
      });
    });

    it('does not increase beyond list size', () => {
      const wrapper = mount(
        <Session>
          <i className="a" />
        </Session>,
      );

      [null, null].forEach(() => {
        act(() => {
          (wrapper.find('.a').prop('item') as ISessionItem).next();
        });
      });

      expect(
        (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
      ).toEqual(0);

      wrapper.update();

      expect(
        (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
      ).toEqual(0);
    });
  });

  describe('item.previous()', () => {
    it('updates', () => {
      const wrapper = mount(
        <Session initialIndex={2}>
          <i className="a" />
          <i className="b" />
          <i className="c" />
        </Session>,
      );

      ['a', 'b', 'c'].forEach((s, index) => {
        const item = wrapper.find(`.${s}`).prop('item') as ISessionItem;
        expect(item.index).toEqual(index);
        expect(item.session.currentIndex).toEqual(2);
      });

      let currentStep = wrapper.find('.c');
      act(() => {
        (currentStep.prop('item') as ISessionItem).previous();
      });
      wrapper.update();

      ['a', 'b'].forEach((s, index) => {
        const item = wrapper.find(`.${s}`).prop('item') as ISessionItem;
        expect(item.index).toEqual(index);
        expect(item.session.currentIndex).toEqual(1);
      });

      currentStep = wrapper.find('.b');
      act(() => {
        (currentStep.prop('item') as ISessionItem).previous();
      });

      wrapper.update();

      ['a'].forEach((s, index) => {
        const item = wrapper.find(`.${s}`).prop('item') as ISessionItem;
        expect(item.index).toEqual(index);
        expect(item.session.currentIndex).toEqual(0);
      });
    });

    it('does not go below 0', () => {
      const wrapper = mount(
        <Session>
          <i className="a" />
        </Session>,
      );

      [null, null].forEach(() => {
        act(() => {
          (wrapper.find('.a').prop('item') as ISessionItem).previous();
        });
      });

      expect(
        (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
      ).toEqual(0);

      wrapper.update();

      expect(
        (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
      ).toEqual(0);
    });
  });
});
