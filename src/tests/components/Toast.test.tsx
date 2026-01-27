/**
 * Unit tests for Toast component and ToastProvider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { ToastProvider, useToast } from "../../components/Toast";

// Test component that uses the toast hook
const TestComponent: React.FC<{
  onMount?: (showToast: ReturnType<typeof useToast>["showToast"]) => void;
}> = ({ onMount }) => {
  const { showToast } = useToast();

  React.useEffect(() => {
    onMount?.(showToast);
  }, [onMount, showToast]);

  return (
    <div>
      <button onClick={() => showToast("Success message", "success")}>
        Show Success
      </button>
      <button onClick={() => showToast("Error message", "error")}>
        Show Error
      </button>
      <button onClick={() => showToast("Info message", "info")}>
        Show Info
      </button>
      <button onClick={() => showToast("Warning message", "warning")}>
        Show Warning
      </button>
    </div>
  );
};

import React from "react";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("ToastProvider", () => {
    it("should render children", () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("useToast hook", () => {
    it("should throw error when used outside ToastProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useToast must be used within ToastProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("toast display", () => {
    it("should show success toast", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Show Success").click();
      });

      expect(screen.getByText("Success message")).toBeInTheDocument();
    });

    it("should show error toast", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Show Error").click();
      });

      expect(screen.getByText("Error message")).toBeInTheDocument();
    });

    it("should show info toast", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Show Info").click();
      });

      expect(screen.getByText("Info message")).toBeInTheDocument();
    });

    it("should show warning toast", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Show Warning").click();
      });

      expect(screen.getByText("Warning message")).toBeInTheDocument();
    });

    it("should show multiple toasts", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Show Success").click();
        screen.getByText("Show Error").click();
      });

      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });
  });

  describe("toast auto-dismiss", () => {
    it("should auto-dismiss after default duration", async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Show Success").click();
      });

      expect(screen.getByText("Success message")).toBeInTheDocument();

      // Fast forward past the default duration (3000ms) + exit animation (300ms)
      await act(async () => {
        vi.advanceTimersByTime(3500);
      });

      // Wait for the element to be removed
      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
    });

    it("should use custom duration when provided", async () => {
      let capturedShowToast: ReturnType<typeof useToast>["showToast"];

      render(
        <ToastProvider>
          <TestComponent
            onMount={(showToast) => {
              capturedShowToast = showToast;
            }}
          />
        </ToastProvider>,
      );

      act(() => {
        capturedShowToast!("Custom duration toast", "info", 1000);
      });

      expect(screen.getByText("Custom duration toast")).toBeInTheDocument();

      // Fast forward past custom duration (1000ms) + exit animation (300ms)
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      expect(
        screen.queryByText("Custom duration toast"),
      ).not.toBeInTheDocument();
    });
  });

  describe("toast types have correct styling", () => {
    it("should render success icon for success toast", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Show Success").click();
      });

      // Check for green color class on icon
      const toast = screen.getByText("Success message").closest("div");
      expect(toast).toBeInTheDocument();
    });

    it("should render error icon for error toast", () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      act(() => {
        screen.getByText("Show Error").click();
      });

      const toast = screen.getByText("Error message").closest("div");
      expect(toast).toBeInTheDocument();
    });
  });
});
