// AI Gateway - centralized AI interface for SiliconPath

// Core types
export type { GatewayRequest, GatewayResponse } from "./types/gateway";

// Gateway provider types
export type { AIProvider } from "./gateway";

// Core singleton
export { gateway, AIGateway } from "./gateway";
