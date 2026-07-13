import { retry } from "../src/index";

describe("retry", () => {
  it("resolves on first attempt", async () => {
    const fn = jest.fn().mockResolvedValue("success");
    await expect(retry(fn)).resolves.toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and eventually succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValue("success");
    await expect(retry(fn, { maxRetries: 3, delayMs: 10 })).resolves.toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("always fails"));
    await expect(retry(fn, { maxRetries: 2, delayMs: 10 })).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
