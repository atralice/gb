import "bun:test";

// fixes ts error: "Property 'toHaveDifference' does not exist on type 'Matchers<() => Promise<void>>'."
declare module "bun:test" {
    interface Matchers<R> {
        toHaveDifference(
            checks: Array<{ count: number; fn: () => Promise<number> }>
        ): Promise<R>;
    }
}
