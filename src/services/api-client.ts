import type { ServiceRegistry } from './types';
import { mockServices } from './mock/mock-client';

// THE SINGLE SWAP POINT
// Change this import to './real/real-client' when backend is ready
export const services: ServiceRegistry = mockServices;
