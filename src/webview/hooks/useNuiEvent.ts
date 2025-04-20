import { useRef, useEffect } from "react";

// Define a minimal type for NUI events (just requires an 'action' field)
type NuiEventData = { action: string } & Record<string, any>;

// The reusable hook
export const useNuiEvent = <T extends NuiEventData>(
  action: string,
  handler: (data: T) => void | Promise<void>
) => {
  // Store the handler in a ref to avoid re-renders
  const savedHandler = useRef<(data: T) => void | Promise<void>>(() => {});

  // Update the ref whenever the handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  // Set up the event listener
  useEffect(() => {
    const eventListener = (event: MessageEvent<T>) => {
      if (event.data.action === action) {
        Promise.resolve(savedHandler.current(event.data)).catch((error) => {
          console.error("Error in handler:", error);
        });
      }
    };

    window.addEventListener("message", eventListener);
    return () => window.removeEventListener("message", eventListener);
  }, [action]);
};
