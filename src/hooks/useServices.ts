import { services } from '../services/api-client';
import type { ServiceRegistry } from '../services/types';

/**
 * Hook for accessing the service layer from components.
 * Provides a consistent access point that can be extended
 * with error handling, caching, or other middleware in the future.
 */
export function useServices(): ServiceRegistry {
  return services;
}
