/**
 * Unit tests for ActionsContext (Command dispatcher)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ActionsProvider,
  useCommands,
} from "../../renderer/contexts/ActionsContext";
import React from "react";

// Test component that uses the commands hook
const TestComponent: React.FC<{
  actionToDispatch?: string;
  actionToRegister?: string;
  onAction?: () => void;
}> = ({ actionToDispatch, actionToRegister, onAction }) => {
  const { dispatch, register } = useCommands();

  React.useEffect(() => {
    if (actionToRegister && onAction) {
      const unsubscribe = register(actionToRegister, onAction);
      return unsubscribe;
    }
  }, [actionToRegister, onAction, register]);

  return (
    <div>
      <button
        data-testid="dispatch-button"
        onClick={() => actionToDispatch && dispatch(actionToDispatch)}
      >
        Dispatch
      </button>
    </div>
  );
};

// Component that registers multiple handlers for the same action
const MultiHandlerComponent: React.FC<{
  action: string;
  handlers: (() => void)[];
}> = ({ action, handlers }) => {
  const { dispatch, register } = useCommands();

  React.useEffect(() => {
    const unsubscribes = handlers.map((handler) => register(action, handler));
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [action, handlers, register]);

  return (
    <button data-testid="dispatch" onClick={() => dispatch(action)}>
      Dispatch
    </button>
  );
};

describe("ActionsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ActionsProvider", () => {
    it("should render children", () => {
      render(
        <ActionsProvider>
          <div data-testid="child">Child</div>
        </ActionsProvider>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("useCommands hook", () => {
    it("should throw error when used outside ActionsProvider", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useCommands must be used within ActionsProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("dispatch", () => {
    it("should call registered handler when dispatching action", () => {
      const handler = vi.fn();

      render(
        <ActionsProvider>
          <TestComponent
            actionToDispatch="test-action"
            actionToRegister="test-action"
            onAction={handler}
          />
        </ActionsProvider>,
      );

      fireEvent.click(screen.getByTestId("dispatch-button"));

      expect(handler).toHaveBeenCalledOnce();
    });

    it("should not throw when dispatching unregistered action", () => {
      render(
        <ActionsProvider>
          <TestComponent actionToDispatch="unregistered-action" />
        </ActionsProvider>,
      );

      expect(() => {
        fireEvent.click(screen.getByTestId("dispatch-button"));
      }).not.toThrow();
    });

    it("should call all handlers registered for the same action", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      render(
        <ActionsProvider>
          <MultiHandlerComponent
            action="multi-handler-action"
            handlers={[handler1, handler2, handler3]}
          />
        </ActionsProvider>,
      );

      fireEvent.click(screen.getByTestId("dispatch"));

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
      expect(handler3).toHaveBeenCalledOnce();
    });
  });

  describe("register", () => {
    it("should return unsubscribe function", () => {
      const handler = vi.fn();
      let unsubscribe: (() => void) | undefined;

      const ComponentWithUnsubscribe: React.FC = () => {
        const { dispatch, register } = useCommands();

        React.useEffect(() => {
          unsubscribe = register("test-action", handler);
        }, [register]);

        return (
          <button
            data-testid="dispatch"
            onClick={() => dispatch("test-action")}
          >
            Dispatch
          </button>
        );
      };

      render(
        <ActionsProvider>
          <ComponentWithUnsubscribe />
        </ActionsProvider>,
      );

      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe("function");
    });

    it("should unsubscribe handler when unsubscribe function is called", () => {
      const handler = vi.fn();

      const ComponentWithUnsubscribe: React.FC = () => {
        const { dispatch, register } = useCommands();
        const unsubscribeRef = React.useRef<(() => void) | null>(null);

        React.useEffect(() => {
          unsubscribeRef.current = register("test-action", handler);
        }, [register]);

        return (
          <div>
            <button
              data-testid="dispatch"
              onClick={() => dispatch("test-action")}
            >
              Dispatch
            </button>
            <button
              data-testid="unsubscribe"
              onClick={() => unsubscribeRef.current?.()}
            >
              Unsubscribe
            </button>
          </div>
        );
      };

      render(
        <ActionsProvider>
          <ComponentWithUnsubscribe />
        </ActionsProvider>,
      );

      // First dispatch should call handler
      fireEvent.click(screen.getByTestId("dispatch"));
      expect(handler).toHaveBeenCalledTimes(1);

      // Unsubscribe
      fireEvent.click(screen.getByTestId("unsubscribe"));

      // Second dispatch should not call handler
      fireEvent.click(screen.getByTestId("dispatch"));
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it("should allow registering same handler to multiple actions", () => {
      const handler = vi.fn();

      const ComponentWithMultipleActions: React.FC = () => {
        const { dispatch, register } = useCommands();

        React.useEffect(() => {
          const unsub1 = register("action-1", handler);
          const unsub2 = register("action-2", handler);
          return () => {
            unsub1();
            unsub2();
          };
        }, [register]);

        return (
          <div>
            <button
              data-testid="dispatch-1"
              onClick={() => dispatch("action-1")}
            >
              Dispatch 1
            </button>
            <button
              data-testid="dispatch-2"
              onClick={() => dispatch("action-2")}
            >
              Dispatch 2
            </button>
          </div>
        );
      };

      render(
        <ActionsProvider>
          <ComponentWithMultipleActions />
        </ActionsProvider>,
      );

      fireEvent.click(screen.getByTestId("dispatch-1"));
      expect(handler).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId("dispatch-2"));
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("common command patterns", () => {
    it("should support save command pattern", () => {
      const saveHandler = vi.fn();

      render(
        <ActionsProvider>
          <TestComponent
            actionToDispatch="save"
            actionToRegister="save"
            onAction={saveHandler}
          />
        </ActionsProvider>,
      );

      fireEvent.click(screen.getByTestId("dispatch-button"));
      expect(saveHandler).toHaveBeenCalledOnce();
    });

    it("should support toggle-ghost command pattern", () => {
      const toggleHandler = vi.fn();

      render(
        <ActionsProvider>
          <TestComponent
            actionToDispatch="toggle-ghost"
            actionToRegister="toggle-ghost"
            onAction={toggleHandler}
          />
        </ActionsProvider>,
      );

      fireEvent.click(screen.getByTestId("dispatch-button"));
      expect(toggleHandler).toHaveBeenCalledOnce();
    });
  });
});
