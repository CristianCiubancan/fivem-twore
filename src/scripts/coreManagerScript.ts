/**
 * CoreManagerScript - Client interface for the Resource Management API
 *
 * This module provides a clean interface to interact with the resource management API,
 * allowing you to list, restart specific resources, or restart all resources on the server.
 */
import 'dotenv/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for API responses
interface ResourceListResponse {
  success: boolean;
  resources: string[];
  count: number;
}

interface RestartResourceResponse {
  success: boolean;
  resource: string;
  message: string;
}

interface RestartAllResourcesResponse {
  success: boolean;
  message: string;
  results: Record<string, boolean>;
}

class CoreManager {
  private client: AxiosInstance;
  private baseUrl: string;

  /**
   * Initialize a new CoreManager instance
   * @param baseUrl - The base URL of the resource management API
   * @param apiKey - The API key for authentication (defaults to the one in environment variables)
   */
  constructor(
    baseUrl: string = 'http://localhost:3414',
    apiKey: string = process.env.API_KEY || 'your-api-key'
  ) {
    if (!apiKey) {
      throw new Error(
        'API_KEY is not defined. Set it in your .env file or pass it to the constructor.'
      );
    }

    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get a list of all available resources
   * @returns Promise resolving to an array of resource names
   */
  async getResources(): Promise<string[]> {
    try {
      const response: AxiosResponse<ResourceListResponse> =
        await this.client.get('/resources');

      if (!response.data.success) {
        throw new Error('Failed to fetch resources');
      }

      return response.data.resources;
    } catch (error) {
      this.handleError('Error fetching resources', error);
      return [];
    }
  }

  /**
   * Restart a specific resource
   * @param resourceName - The name of the resource to restart
   * @returns Promise resolving to a success status and message
   */
  async restartResource(
    resourceName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response: AxiosResponse<RestartResourceResponse> =
        await this.client.post(
          `/restart?resource=${encodeURIComponent(resourceName)}`
        );

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      this.handleError(`Error restarting resource "${resourceName}"`, error);
      return {
        success: false,
        message: `Failed to restart resource "${resourceName}"`,
      };
    }
  }

  /**
   * Restart all resources except the resource manager itself
   * @returns Promise resolving to a success status, message, and detailed results
   */
  async restartAllResources(): Promise<{
    success: boolean;
    message: string;
    results?: Record<string, boolean>;
  }> {
    try {
      const response: AxiosResponse<RestartAllResourcesResponse> =
        await this.client.post('/restart');

      return {
        success: response.data.success,
        message: response.data.message,
        results: response.data.results,
      };
    } catch (error) {
      this.handleError('Error restarting all resources', error);
      return {
        success: false,
        message: 'Failed to restart all resources',
      };
    }
  }

  /**
   * Utility method to check if a specific resource exists
   * @param resourceName - The name of the resource to check
   * @returns Promise resolving to a boolean indicating if the resource exists
   */
  async resourceExists(resourceName: string): Promise<boolean> {
    try {
      const resources = await this.getResources();
      return resources.includes(resourceName);
    } catch (error) {
      this.handleError(
        `Error checking if resource "${resourceName}" exists`,
        error
      );
      return false;
    }
  }

  /**
   * Handle errors from API requests
   * @param message - A context message for the error
   * @param error - The error object
   */
  private handleError(message: string, error: any): void {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          `${message}: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error(`${message}: No response received from server`);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`${message}: ${error.message}`);
      }
    } else {
      // Something else happened
      console.error(`${message}: ${error}`);
    }
  }
}

export default CoreManager;

// Example usage:
/*
async function main() {
  try {
    const manager = new CoreManager();
    
    // Get all resources
    const resources = await manager.getResources();
    console.log(`Available resources (${resources.length}):`, resources);
    
    // Restart a specific resource
    const resourceToRestart = 'my-resource';
    const restartResult = await manager.restartResource(resourceToRestart);
    console.log(`Restart result for ${resourceToRestart}:`, restartResult);
    
    // Restart all resources
    const restartAllResult = await manager.restartAllResources();
    console.log('Restart all resources result:', restartAllResult);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();
*/
