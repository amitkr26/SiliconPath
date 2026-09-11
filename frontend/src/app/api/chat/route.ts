/**
 * /api/chat proxy alias -> /api/ai/chat
 * Seamless backward compatibility for legacy clients and test suites.
 */
export { POST } from "@/app/api/ai/chat/route";
