/* eslint-disable import/no-extraneous-dependencies */

module.exports = {
  ...require('@vadistic/prettier-config'),

  overrides: [
    {
      files: '*.md',
      options: {
        maxWidth: 160,
      },
    },
  ],
}
