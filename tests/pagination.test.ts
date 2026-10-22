import { describe, expect, it } from "vitest";
import { pageWindow } from "@/lib/pagination";

describe("pageWindow", () => {
  it("shows every page when there are few", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });
  it("collapses distant pages into gaps", () => {
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
  });
  it("does not insert a gap between adjacent pages", () => {
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});
