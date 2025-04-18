declare global {
  interface Window {
    GetParentResourceName?: () => string;
  }
}

/**
 * Simple wrapper around fetch API tailored for CEF/NUI use. This abstraction
 * can be extended to include AbortController if needed or if the response isn't
 * JSON. Tailor it to your needs.
 *
 * @param eventName - The endpoint eventname to target
 * @param data - Data you wish to send in the NUI Callback
 *
 * @return returnData - A promise for the data sent back by the NuiCallbacks CB argument
 */
import { isEnvBrowser } from './misc';

// Mock responses for browser development environment
const mockResponses: Record<string, unknown> = {
  uiOpened: { status: 'success', message: 'UI opened successfully' },
  testEvent: { status: 'success', message: 'Test event received' },
  saveCharacter: { status: 'success', message: 'Character saved successfully' },
  saveSettings: { status: 'success', message: 'Settings saved successfully' },
  cancelPurchase: { status: 'success', message: 'Purchase cancelled' },
  confirmPurchase: { status: 'success', message: 'Purchase confirmed', success: true },
  // Add more mock responses as needed
};

export async function fetchNui<T>(
  eventName: string,
  data?: unknown
): Promise<T> {
  // If we're in a browser environment, return a mock response after a slight delay
  if (isEnvBrowser()) {
    // Use collapsed console groups for cleaner output
    console.groupCollapsed(`📡 NUI Call: ${eventName}`);
    console.log('Request Data:', data);
    
    // Return a promise that resolves with mock data after a small delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = mockResponses[eventName] || { status: 'success', message: 'Operation completed' };
        console.log('Response:', response);
        console.groupEnd();
        resolve(response as T);
      }, 500); // Simulate network delay
    });
  }
  
  // In FiveM environment, perform the actual fetch
  const actualData = data || {};
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(actualData),
  };

  const resourceName = window.GetParentResourceName
    ? window.GetParentResourceName()
    : 'nui-frame-app';

  try {
    const resp = await fetch(`https://${resourceName}/${eventName}`, options);
    return await resp.json();
  } catch (error) {
    console.error(`Error in fetchNui for event ${eventName}:`, error);
    throw error;
  }
}
