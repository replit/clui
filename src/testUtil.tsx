import { CLUISession } from './Session';
import { ReactWrapper } from 'enzyme';

export const expectIndex = (wrapper: ReactWrapper, expected: number) => (
  className: string,
) => {
  const session = wrapper
    .find(`.${className}`)
    .first()
    .prop('session') as CLUISession;

  expect(session.currentIndex).toEqual(expected);
};
