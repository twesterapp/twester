module.exports = {
    extends: 'erb',
    rules: {
        // A temporary hack related to IDE not resolving correct package.json
        'import/no-extraneous-dependencies': 'off',
        'react/prop-types': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'react/jsx-props-no-spreading': 'off',
        'no-console': 'off',
        'import/prefer-default-export': 'off',
        '@typescript-eslint/no-shadow': 'off',
        'prefer-destructuring': 'off',
        'react/no-unused-prop-types': 'off',
        'react/require-default-props': 'off',
        '@typescript-eslint/naming-convention': 'off',
        'no-underscore-dangle': 'off',
        'no-empty': 'off',
        'no-restricted-syntax': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-await-in-loop': 'off',
        'class-methods-use-this': 'off',
        'max-classes-per-file': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'consistent-return': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        'import/order': 'off',
        'import/no-cycle': 'off',
        'no-nested-ternary': 'off',
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        createDefaultProgram: true,
    },
    settings: {
        'import/resolver': {
            // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
            node: {},
            webpack: {
                config: require.resolve(
                    './.erb/configs/webpack.config.eslint.js'
                ),
            },
        },
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
    },
};
