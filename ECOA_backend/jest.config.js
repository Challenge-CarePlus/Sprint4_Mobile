/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.ts"],
    // bcrypt + multipart real: folga pra máquinas lentas.
    testTimeout: 30000,
    transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json", diagnostics: false }],
    },
};
