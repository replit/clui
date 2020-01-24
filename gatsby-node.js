// eslint-disable-next-line
const path = require('path');

exports.createPages = async ({ actions: { createPage } }) => {
  const component = path.resolve(__dirname, '../demo/index.tsx');
  createPage({ path: '/demo', component });
};
