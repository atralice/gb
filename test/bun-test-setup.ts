import { execSync } from "child_process";
import fetchMock from "fetch-mock";
import { mock, afterEach } from "bun:test";
import mockCookies from "./helpers/mockCookies";

await (async () => {
  // disallow http requests
  fetchMock.mockGlobal();

  // prisma migrate to the latest version
  setupTestDb();

  // mock "server-only" imports
  await mockImportServerOnly();

  // mock { cache } from "react"
  await mockImportReactCache();

  // mock next/cache to prevent errors when importing modules that use revalidatePath
  await mockImportNextCache();

  // prevents TypeError: undefined is not an object (evaluating '_react.default.unstable_postpone')
  // from happening when any test imports a file that imports cookies from next/headers
  // even if the file also mocks cookies.  Calling mockCookies() in your test still overrides this,
  // but this is still needed IN ADDITION to that.
  await mockCookies({});

  // restore mocks after each test
  afterEach(() => {
    mock.restore();
  });
})();

function setupTestDb() {
  try {
    if (!process.env.DATABASE_URL?.match(/test/)) {
      throw new Error("DATABASE_URL must contain 'test'");
    }

    execSync(`npx prisma migrate reset --force`);
  } catch (error) {
    console.error("Preload script failed:", error);
    process.exit(1);
  }
}

async function mockImportServerOnly() {
  const noop = () => {};
  await mock.module("server-only", () => noop);
}

async function mockImportReactCache() {
  const mockCache = (fn: any) => fn;
  await mock.module("react", () => ({ cache: mockCache }));
}

async function mockImportNextCache() {
  await mock.module("next/cache", () => ({
    revalidatePath: () => {},
  }));
}
