import { antfu } from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-console': 'off',
    'unused-imports/no-unused-vars': 'off',
    'antfu/no-top-level-await': 'off',
  },
  typescript: true,
})
