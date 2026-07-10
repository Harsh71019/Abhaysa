import { describe, expect, it } from "vitest";
import type { Connection } from "mongoose";
import { HealthController } from "./health.controller";

function fakeConnection(readyState: number): Connection {
  return { readyState } as Connection;
}

describe("HealthController", () => {
  it("reports ok + connected when mongo readyState is 1", () => {
    const controller = new HealthController(fakeConnection(1));
    expect(controller.check()).toEqual({ status: "ok", mongo: "connected" });
  });

  it("reports ok + disconnected when mongo readyState is 0", () => {
    const controller = new HealthController(fakeConnection(0));
    expect(controller.check()).toEqual({ status: "ok", mongo: "disconnected" });
  });

  it("reports ok + connecting when mongo readyState is 2", () => {
    const controller = new HealthController(fakeConnection(2));
    expect(controller.check()).toEqual({ status: "ok", mongo: "connecting" });
  });
});
