import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";

// Stub OverlayProvider — useOverlayActivity returns a noop unregister
vi.mock("../components/OverlayLayer/OverlayProvider", () => ({
  useOverlayActivity: () => () => () => {},
}));

// Import after mock
import { useFloatingPanel } from "../components/OverlayLayer/useFloatingPanel";

function createRect(x = 0, y = 0, w = 100, h = 40): DOMRect {
  return DOMRect.fromRect({ x, y, width: w, height: h });
}

describe("useFloatingPanel", () => {
  it("starts closed", () => {
    const { result } = renderHook(() => useFloatingPanel<number>());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.state.phase).toBe("closed");
    expect(result.current.state.payload).toBeNull();
  });

  describe("open", () => {
    it("transitions to opening with payload", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());
      const rect = createRect();

      act(() => result.current.open(rect, 42));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.state.phase).toBe("opening");
      expect(result.current.state.payload).toBe(42);
      expect(result.current.state.anchorRect).toBe(rect);
    });

    it("increments instanceId on each open", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());
      const rect = createRect();

      act(() => result.current.open(rect, 1));
      const id1 = result.current.state.instanceId;

      act(() => result.current.open(rect, 2));
      expect(result.current.state.instanceId).toBeGreaterThan(id1);
    });
  });

  describe("markOpen", () => {
    it("transitions opening -> open", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.open(createRect(), 1));
      act(() => result.current.markOpen());

      expect(result.current.state.phase).toBe("open");
    });
  });

  describe("close", () => {
    it("transitions open -> closing", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.open(createRect(), 1));
      act(() => result.current.markOpen());
      act(() => result.current.close());

      expect(result.current.state.phase).toBe("closing");
      expect(result.current.isOpen).toBe(true);
    });

    it("is no-op when already closed", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.close());

      expect(result.current.state.phase).toBe("closed");
    });
  });

  describe("markClosed", () => {
    it("resets from closing -> closed", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.open(createRect(), 1));
      act(() => result.current.close());
      act(() => result.current.markClosed());

      expect(result.current.state.phase).toBe("closed");
      expect(result.current.isOpen).toBe(false);
    });

    it("resets from opening -> closed (direct markClosed without close)", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.open(createRect(), 1));
      act(() => result.current.markClosed());

      expect(result.current.state.phase).toBe("closed");
      expect(result.current.isOpen).toBe(false);
      expect(result.current.state.payload).toBeNull();
    });

    it("resets from open -> closed (direct markClosed without close)", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.open(createRect(), 1));
      act(() => result.current.markOpen());
      act(() => result.current.markClosed());

      expect(result.current.state.phase).toBe("closed");
      expect(result.current.isOpen).toBe(false);
      expect(result.current.state.payload).toBeNull();
    });
  });

  describe("toggle", () => {
    it("opens when closed", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.toggle(createRect(), 5));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.state.payload).toBe(5);
    });

    it("closes when open with same payload", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.toggle(createRect(), 5));
      act(() => result.current.toggle(createRect(), 5));

      expect(result.current.state.phase).toBe("closing");
    });

    it("switches to new payload when open with different payload", () => {
      const { result } = renderHook(() => useFloatingPanel<number>());

      act(() => result.current.toggle(createRect(), 5));
      const firstId = result.current.state.instanceId;

      act(() => result.current.toggle(createRect(), 10));

      expect(result.current.state.phase).toBe("opening");
      expect(result.current.state.payload).toBe(10);
      expect(result.current.state.instanceId).toBeGreaterThan(firstId);
    });
  });
});
