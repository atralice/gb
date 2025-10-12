import { describe, test, expect, spyOn } from "bun:test";
import catchErrors from "../catchErrors";
import * as captureExceptionModule from "../captureException";

class TestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestError";
  }
}

class AnotherTestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnotherTestError";
  }
}

describe("catchErrors", () => {
  describe("executes successfully", () => {
    test("returns success result from sync function", () => {
      const result = catchErrors(() => "success");
      expect(result).toBe("success");
    });

    test("returns success result from async function", async () => {
      const result = await catchErrors(async () => "success");
      expect(result).toBe("success");
    });
  });

  describe("catches all errors", () => {
    test("catches and logs sync error when no error types specified", () => {
      const mockCaptureException = spyOn(
        captureExceptionModule,
        "captureException"
      );
      const error = new Error("Generic error");

      const result = catchErrors(() => {
        throw error;
      });

      expect(result).toBeUndefined();
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    test("catches and logs async error when no error types specified", async () => {
      const mockCaptureException = spyOn(
        captureExceptionModule,
        "captureException"
      );
      const error = new Error("Generic error");

      const result = await catchErrors(async () => {
        throw error;
      });

      expect(result).toBeUndefined();
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    test("catches and logs non-Error objects", () => {
      const mockCaptureException = spyOn(
        captureExceptionModule,
        "captureException"
      );
      const nonError = { message: "Not an error" };

      const result = catchErrors(() => {
        throw nonError;
      });

      expect(result).toBeUndefined();
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(nonError);
    });
  });

  describe("catches specific error types", () => {
    test("catches specified error from sync function", () => {
      const mockCaptureException = spyOn(
        captureExceptionModule,
        "captureException"
      );
      const error = new TestError("Test error");

      const result = catchErrors(() => {
        throw error;
      }, [TestError]);

      expect(result).toBeUndefined();
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    test("catches specified error from async function", async () => {
      const mockCaptureException = spyOn(
        captureExceptionModule,
        "captureException"
      );
      const error = new TestError("Test error");

      const result = await catchErrors(async () => {
        throw error;
      }, [TestError]);

      expect(result).toBeUndefined();
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    test("catches errors of multiple specified types", () => {
      const mockCaptureException = spyOn(
        captureExceptionModule,
        "captureException"
      );
      const error1 = new TestError("Test error");
      const error2 = new AnotherTestError("Another test error");

      const result1 = catchErrors(() => {
        throw error1;
      }, [TestError, AnotherTestError]);

      const result2 = catchErrors(() => {
        throw error2;
      }, [TestError, AnotherTestError]);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(mockCaptureException).toHaveBeenCalledTimes(2);
      expect(mockCaptureException).toHaveBeenCalledWith(error1);
      expect(mockCaptureException).toHaveBeenCalledWith(error2);
    });
  });

  describe("rethrows errors", () => {
    test("rethrows error from sync function when type doesn't match", () => {
      const unhandledError = new Error("Unhandled error");

      expect(() =>
        catchErrors(() => {
          throw unhandledError;
        }, [TestError])
      ).toThrow(unhandledError);
    });

    test("rethrows error from async function when type doesn't match", async () => {
      const unhandledError = new Error("Unhandled error");

      await expect(
        catchErrors(async () => {
          throw unhandledError;
        }, [TestError])
      ).rejects.toThrow(unhandledError);
    });

    test("rethrows error when it matches none of multiple specified types", () => {
      const unhandledError = new Error("Unhandled error");

      expect(() =>
        catchErrors(() => {
          throw unhandledError;
        }, [TestError, AnotherTestError])
      ).toThrow(unhandledError);
    });
  });
});
