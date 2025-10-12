import { expect } from "bun:test";
/**
 * This matcher checks if the received function returns a different count than the expected count.
 * It uses the query function to get the count before and after the received function is called.
 * It returns true if the count is different, and false otherwise.
 */
expect.extend({
    async toHaveDifference(
        received: unknown,
        expected: Record<
            string,
            { count: number; query: () => Promise<number> }
        >
    ) {
        if (typeof received !== "function") {
            throw new Error(
                `Expected received to be a function, but got ${typeof received}`
            );
        }

        if (typeof expected !== "object" || expected === null) {
            throw new Error(
                `Expected expected to be an object with named checks, but got ${typeof expected}`
            );
        }

        const checks = Object.entries(expected).map(
            ([name, { count, query }]) => {
                if (typeof query !== "function") {
                    throw new Error(
                        `Query for ${name} must be a function, got ${typeof query}`
                    );
                }
                return { name, count, query };
            }
        );

        const initialCounts = await Promise.all(
            checks.map((check) => check.query())
        );
        await received();
        const finalCounts = await Promise.all(
            checks.map((check) => check.query())
        );

        const failedChecks = checks
            .map((check, index) => ({
                name: check.name,
                expectedDifference: check.count,
                actualDifference:
                    (finalCounts[index] ?? 0) - (initialCounts[index] ?? 0)
            }))
            .filter(
                ({ expectedDifference, actualDifference }) =>
                    actualDifference !== expectedDifference
            );

        const pass = failedChecks.length === 0;

        return {
            pass,
            message: () =>
                pass
                    ? ""
                    : failedChecks
                          .map(
                              ({
                                  name,
                                  expectedDifference,
                                  actualDifference
                              }) =>
                                  `${name}: Expected ${expectedDifference}, but got ${actualDifference}`
                          )
                          .join("\n")
        };
    }
});
