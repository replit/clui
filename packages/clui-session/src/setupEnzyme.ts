/* eslint-disable import/no-extraneous-dependencies */
import { configure } from 'enzyme';
import EnzymeAdapter from 'enzyme-adapter-react-16';
/* eslint-enable import/no-extraneous-dependencies */

configure({ adapter: new EnzymeAdapter() });
