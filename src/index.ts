import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, ZodTypeAny } from "zod";

// デバッグログ用関数
function debug(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = data 
    ? `[DEBUG ${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}` 
    : `[DEBUG ${timestamp}] ${message}`;
  console.error(logMessage); // stderrに出力してstdoutと混ざらないようにする
}

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const apiKey = process.argv[3] ?? "";

debug("Starting with parameters", { baseUrl, apiKey: apiKey ? "[PROVIDED]" : "[EMPTY]" });

debug("Initializing MCP server");
const server = new McpServer({
  name: "BridgeRestish",
  version: "1.0.0"
});
debug("MCP server initialized");

function jsonToZod(schema: any): ZodTypeAny {
  switch (schema.type) {
    case "object": {
      const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
      const shape: Record<string, ZodTypeAny> = {};
      for (const [key, propSchema] of Object.entries(schema.properties || {})) {
        const propZod = jsonToZod(propSchema);
        shape[key] = requiredKeys.includes(key) ? propZod : propZod.optional();
      }
      return z.object(shape);
    }
    case "string":  return z.string();
    case "number":  return z.number();
    case "boolean": return z.boolean();
    case "array":   return z.array(jsonToZod((schema as any).items));
    default:         return z.any();
  }
}

type ToolDef = { name: string; description?: string; schema: any; endpoint: string; method: "get" | "post" };
let toolDefs: ToolDef[];
try {
  debug(`Fetching tool definitions from ${baseUrl}/tools`);
  const res = await fetch(
    `${baseUrl}/tools`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  debug(`Fetch response status: ${res.status}`);
  toolDefs = await res.json();
  debug(`Received ${toolDefs.length} tool definitions`);
} catch (e) {
  debug("Error fetching tool definitions", { error: e instanceof Error ? e.message : String(e) });
  server.tool(
    "not_found",
    {},
    async (_args: any, _ctx: any) => ({
      content: [{ type: "text", text: "Tool definitions not available" }]
    })
  );
  toolDefs = [];
}
debug("Registering tools");
for (const def of toolDefs) {
  debug(`Registering tool: ${def.name}`);
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, propSchema] of Object.entries(def.schema.properties || {})) {
    shape[key] = jsonToZod(propSchema);
  }
  server.tool(
    def.name,
    shape,
    async (args: any, _ctx: any) => {
      debug(`Executing tool: ${def.name}`, { args });
      let res: Response;
      try {
        if (def.method === "get") {
          const params = new URLSearchParams();
          Object.entries(args).forEach(([k, v]) => params.append(k, String(v)));
          const url = `${baseUrl}${def.endpoint}?${params.toString()}`;
          debug(`Sending GET request to: ${url}`);
          res = await fetch(
            url,
            { method: "GET", headers: { Authorization: `Bearer ${apiKey}` } }
          );
        } else {
          debug(`Sending POST request to: ${baseUrl}${def.endpoint}`);
          res = await fetch(
            `${baseUrl}${def.endpoint}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
              },
              body: JSON.stringify(args),
            }
          );
        }
        debug(`Response status: ${res.status}`);
        const data = await res.json();
        debug(`Response data received`, { dataLength: JSON.stringify(data).length });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (e) {
        debug(`Error executing tool: ${def.name}`, { error: e instanceof Error ? e.message : String(e) });
        throw e; // エラーを再スローして上位でキャッチできるようにする
      }
    }
  );
}

debug("Registering dummy resource");
server.resource(
  "dummy",
  new ResourceTemplate("dummy://{dummy}", { list: undefined }),
  async (uri, { dummy }) => {
    debug("Accessing dummy resource", { uri: uri.href, dummy });
    return {
      contents: [{
        uri: uri.href,
        text: `${dummy}`
      }]
    };
  }
);

(async () => {
  try {
    debug("Starting server connection");
    const transport = new StdioServerTransport();
    debug("Transport initialized, connecting to server");
    await server.connect(transport);
    debug("Server connected and running");
  } catch (e) {
    debug("Fatal error in server connection", { error: e instanceof Error ? e.message : String(e) });
    process.exit(1); // エラーが発生した場合は明示的に終了
  }
})();
