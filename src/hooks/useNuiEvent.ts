import { useRef, useEffect } from 'react';
import { isEnvBrowser } from '../utils/misc';

// Define a minimal type for NUI events (just requires an 'action' field)
export type NuiEventData<T = unknown> = { action: string } & T;

/**
 * A hook to handle NUI messages from the game client
 * Uses useRef to avoid re-renders and properly handles cleanup
 * 
 * @param action - The action name to listen for
 * @param handler - The callback function to execute when the action is received
 */
export const useNuiEvent = <T extends NuiEventData>(
  action: string,
  handler: (data: T) => void | Promise<void>
) => {
  // Store the handler in a ref to avoid re-renders and dependency issues
  const savedHandler = useRef<(data: T) => void | Promise<void>>(() => {});

  // Update the ref whenever the handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  // Set up the event listener and handle cleanup
  useEffect(() => {
    const eventListener = (event: MessageEvent<T>) => {
      if (event.data.action === action) {
        // Handle errors without breaking the app
        Promise.resolve(savedHandler.current(event.data)).catch((error) => {
          if (isEnvBrowser()) {
            console.groupCollapsed(`❌ Error in NUI handler for '${action}'`);
            console.error(error);
            console.groupEnd();
          } else {
            console.error(`Error in NUI handler for '${action}':`, error);
          }
        });
      }
    };

    window.addEventListener('message', eventListener);
    
    // Proper cleanup on unmount - critical for preventing memory leaks
    return () => window.removeEventListener('message', eventListener);
  }, [action]); // Only re-run if action changes
};
