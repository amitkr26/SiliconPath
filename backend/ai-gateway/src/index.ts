// AI Gateway - centralized AI interface for BerojgarDegreeWala

// Core types
export type { GatewayRequest, GatewayResponse } from "./types/gateway";

// Gateway provider types
export type { AIProvider, AILogEntry } from "./gateway";

// Core singleton
export { gateway, AIGateway } from "./gateway";

// BDW AI Provider
export { loadBDWConfig, isBDWConfigValid, healthCheck as bdwHealthCheck } from "./providers/bdw";
export type { BDWProviderConfig } from "./providers/bdw";
