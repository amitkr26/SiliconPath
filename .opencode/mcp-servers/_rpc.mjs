// Minimal MCP (Model Context Protocol) stdio server framework.
// Handles the JSON-RPC plumbing; servers only supply tool definitions.
// Protocol: newline-delimited JSON-RPC 2.0 over stdin/stdout.

import { createRequire } from "node:module";

export function startMcpServer({ name, version, tools }) {
  const require = createRequire(import.meta.url);
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

  const handle = async (msg) => {
    if (msg.method === "initialize") {
      send({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name, version },
        },
      });
      return;
    }
    if (msg.method === "notifications/initialized" || msg.method === "ping") return;
    if (msg.method === "tools/list") {
      send({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          tools: [...toolMap.values()].map(({ name, description, inputSchema }) => ({
            name,
            description,
            inputSchema,
          })),
        },
      });
      return;
    }
    if (msg.method === "tools/call") {
      const tool = toolMap.get(msg.params?.name);
      if (!tool) {
        send({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `Unknown tool: ${msg.params?.name}` } });
        return;
      }
      try {
        const result = await tool.handler(msg.params?.arguments || {}, { require });
        send({
          jsonrpc: "2.0",
          id: msg.id,
          result: { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }] },
        });
      } catch (err) {
        send({
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            content: [{ type: "text", text: `Error: ${err?.message || err}` }],
            isError: true,
          },
        });
      }
      return;
    }
    send({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } });
  };

  let buffer = "";
  let inflight = 0;
  let stdinEnded = false;
  const maybeExit = () => {
    if (stdinEnded && inflight === 0) process.exit(0);
  };
  process.stdin.on("data", (chunk) => {
    buffer += chunk.toString();
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      inflight++;
      handle(msg)
        .catch((err) => send({ jsonrpc: "2.0", id: msg.id, error: { code: -32603, message: String(err?.message || err) } }))
        .finally(() => {
          inflight--;
          maybeExit();
        });
    }
  });
  process.stdin.on("end", () => {
    stdinEnded = true;
    maybeExit();
  });
}
