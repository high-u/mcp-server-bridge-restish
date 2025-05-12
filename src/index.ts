#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { z, ZodTypeAny } from "zod";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const apiKey = process.argv[3] ?? "";

const server = new FastMCP({
  name: "BridgeRestish",
  version: "1.0.0"
});

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
  const res = await fetch(
    `${baseUrl}/tools`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  toolDefs = await res.json();
} catch (e) {
  server.addTool({
    name: "not_found",
    parameters: z.object({}),
    execute: async (_args: any) => ({
      content: [{ type: "text", text: "Tool definitions not available" }]
    })
  });
  toolDefs = [];
}
for (const def of toolDefs) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, propSchema] of Object.entries(def.schema.properties || {})) {
    shape[key] = jsonToZod(propSchema);
  }
  server.addTool({
    name: def.name,
    description: def.description,
    parameters: z.object(shape),
    execute: async (args: any) => {
      let res: Response;
      try {
        if (def.method === "get") {
          const params = new URLSearchParams();
          Object.entries(args).forEach(([k, v]) => params.append(k, String(v)));
          const url = `${baseUrl}${def.endpoint}?${params.toString()}`;
          res = await fetch(
            url,
            { method: "GET", headers: { Authorization: `Bearer ${apiKey}` } }
          );
        } else {
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
        const data = await res.json();
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (e) {
        throw e;
      }
    }
  });
}

server.addResourceTemplate({
  uriTemplate: "dummy://{dummy}",
  name: "dummy",
  arguments: [
    {
      name: "dummy",
      description: "Dummy argument",
      required: true,
    },
  ],
  async load({ dummy }: { dummy: string }) {
    return {
      text: `${dummy}`
    };
  }
});

server.start({ transportType: "stdio" });
