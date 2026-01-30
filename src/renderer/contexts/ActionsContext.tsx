import React, { createContext, useContext, useRef } from "react";

type CommandCallback = () => void;

interface ActionsContextType {
  dispatch: (action: string) => void;
  register: (action: string, callback: CommandCallback) => () => void; // returns unsubscribe function
}

const ActionsContext = createContext<ActionsContextType | null>(null);

export const ActionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const listeners = useRef<Record<string, CommandCallback[]>>({});

  const dispatch = (action: string) => {
    // console.log(`[Command] Dispatching: ${action}`);
    const handlers = listeners.current[action];
    if (handlers) handlers.forEach((fn) => fn());
  };

  const register = (action: string, callback: CommandCallback) => {
    if (!listeners.current[action]) listeners.current[action] = [];
    listeners.current[action].push(callback);

    // Return a cleanup function to unsubscribe
    return () => {
      listeners.current[action] = listeners.current[action].filter(
        (fn) => fn !== callback,
      );
    };
  };

  return (
    <ActionsContext.Provider value={{ dispatch, register }}>
      {children}
    </ActionsContext.Provider>
  );
};

export const useCommands = () => {
  const context = useContext(ActionsContext);
  if (!context)
    throw new Error("useCommands must be used within ActionsProvider");
  return context;
};
