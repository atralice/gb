import { expect } from "bun:test";

function isResponse(value: unknown): value is Response {
  return (
    value !== null &&
    typeof value === "object" &&
    "status" in value &&
    typeof value.status === "number" &&
    "clone" in value &&
    typeof value.clone === "function"
  );
}

expect.extend({
  async toHaveStatus(received: unknown, expectedStatus: number) {
    if (!isResponse(received)) {
      return {
        pass: false,
        message: () =>
          `toHaveStatus: Received value is not a valid Response object.`,
      };
    }

    const response = received;

    const statusPass = response.status === expectedStatus;
    let errorDetail = "";

    const clonedResponse = response.clone(); // Clone the response

    try {
      const json = await clonedResponse.json();
      errorDetail = json.error || "";
    } catch {
      errorDetail = "Response is not valid JSON";
    }

    const pass = statusPass;

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to have status ${expectedStatus}.`
          : `Expected response to have status ${expectedStatus}, but got status ${response.status} and error "${errorDetail}".`,
    };
  },
});
