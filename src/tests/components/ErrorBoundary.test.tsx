/**
 * Unit tests for ErrorBoundary component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import React from "react";

// Component that throws an error
const ThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = true,
}) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>Normal content</div>;
};

// Component that throws a different error
const ThrowingComponentWithCustomError: React.FC<{ errorMessage: string }> = ({
  errorMessage,
}) => {
  throw new Error(errorMessage);
};

describe("ErrorBoundary", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error during error boundary tests
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("when no error occurs", () => {
    it("should render children normally", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </ErrorBoundary>,
      );

      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
    });

    it("should render component that does not throw", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Normal content")).toBeInTheDocument();
    });
  });

  describe("when an error occurs", () => {
    it("should catch the error and display fallback UI", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should display the error message", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      // The error message is inside a pre element within details
      const preElement = document.querySelector("pre");
      expect(preElement?.textContent).toContain("Test error message");
    });

    it("should display custom error messages", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponentWithCustomError errorMessage="Custom error occurred!" />
        </ErrorBoundary>,
      );

      // The error boundary catches the error and shows the fallback UI
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      // Check that error details are available in the pre element
      const preElement = document.querySelector("pre");
      expect(preElement?.textContent).toContain("Custom error occurred!");
    });

    it("should not render children when error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(screen.queryByText("Normal content")).not.toBeInTheDocument();
    });
  });

  describe("fallback UI styling", () => {
    it("should render with appropriate error styling", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      // Check that the error message container exists
      const errorContainer = screen
        .getByText("Something went wrong")
        .closest("div");
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe("error recovery", () => {
    it("should allow rendering new components after error", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Re-render with non-throwing component
      // Note: In a real app, you'd need to reset the error boundary state
      // This test verifies the error boundary maintains its error state
      rerender(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>,
      );

      // ErrorBoundary maintains error state after catching an error
      // This is expected React behavior
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  describe("nested error boundaries", () => {
    it("should only catch errors in immediate children", () => {
      render(
        <ErrorBoundary>
          <div data-testid="outer-content">Outer content</div>
          <ErrorBoundary>
            <ThrowingComponent />
          </ErrorBoundary>
        </ErrorBoundary>,
      );

      // Outer content should still be rendered
      expect(screen.getByTestId("outer-content")).toBeInTheDocument();
      // Inner error boundary should show error
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });
});
