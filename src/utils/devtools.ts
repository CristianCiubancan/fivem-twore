import { isEnvBrowser } from './misc';

/**
 * Helper for simulating NUI message events in browser development
 * This function should only be used in browser environments for development
 * 
 * @param action - The action to dispatch
 * @param data - The data to send with the action
 */
export const simulateNuiEvent = <T extends Record<string, unknown>>(
  action: string,
  data: T = {} as T
): void => {
  if (!isEnvBrowser()) return; // Only run in browser
  
  try {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          action,
          ...data,
        },
      })
    );
    
    // Use a collapsed group for cleaner output
    console.groupCollapsed(`🔄 NUI Event: ${action}`);
    console.log('Data:', data);
    console.log('Time:', new Date().toLocaleTimeString());
    console.groupEnd();
  } catch (error) {
    console.error('Error simulating NUI event:', error);
  }
};

/**
 * Add a development toolbar with buttons to trigger common NUI events for testing.
 * Only appears in browser environment.
 */
export const setupDevTools = (): void => {
  if (!isEnvBrowser()) return;
  
  // Create toolbar element
  const toolbar = document.createElement('div');
  toolbar.id = 'nui-dev-toolbar';
  toolbar.style.position = 'fixed';
  toolbar.style.bottom = '10px';
  toolbar.style.left = '10px';
  toolbar.style.zIndex = '9999';
  toolbar.style.display = 'flex';
  toolbar.style.flexDirection = 'column';
  toolbar.style.gap = '5px';
  toolbar.style.background = 'rgba(0,0,0,0.7)';
  toolbar.style.padding = '8px';
  toolbar.style.borderRadius = '5px';
  
  // Add section title
  const createSectionTitle = (text: string) => {
    const title = document.createElement('div');
    title.textContent = text;
    title.style.color = '#aaa';
    title.style.fontSize = '10px';
    title.style.textTransform = 'uppercase';
    title.style.marginTop = '5px';
    title.style.marginBottom = '2px';
    title.style.borderBottom = '1px solid #555';
    toolbar.appendChild(title);
  };
  
  // Create buttons for common events
  const createButton = (text: string, action: string, data?: Record<string, unknown>) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '5px 10px';
    button.style.background = '#333';
    button.style.color = 'white';
    button.style.border = '1px solid #666';
    button.style.borderRadius = '3px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '12px';
    button.style.margin = '2px 0';
    
    button.addEventListener('click', () => {
      simulateNuiEvent(action, data);
    });
    
    toolbar.appendChild(button);
    return button;
  };
  
  createSectionTitle('NUI Events');
  createButton('Show UI', 'ui');
  createButton('Hide UI', 'closeUI');
  createButton('Test Event', 'testEvent');
  
  createSectionTitle('Scenario Events');
  createButton('Character Saved', 'characterSaved', { name: 'John Doe' });
  createButton('Purchase Success', 'purchaseSuccess', { item: 'vehicle', model: 'sultanrs' });
  createButton('Error Message', 'errorMessage', { message: 'Insufficient funds' });
  
  // Add to body
  document.body.appendChild(toolbar);
};