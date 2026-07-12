import next from "eslint-config-next"

const eslintConfig = [
  ...next,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
      "**/*.snap",
    ],
  },
]

export default eslintConfig
