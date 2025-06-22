#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { z, ZodType } from "zod";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const apiKey = process.env.API_KEY ??  "";
const authType = process.env.AUTH_TYPE ?? "";

const server = new FastMCP({
  name: "BridgeRestish",
  version: "1.0.0"
});

function jsonToZod(schema: any): ZodType {

  if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
    const allStrings = schema.enum.every((val: any) => typeof val === 'string');
    if (allStrings) {
      let enumSchema = z.enum(schema.enum as [string, ...string[]]);
      return schema.description ? enumSchema.describe(schema.description) : enumSchema;
    }
    
    const allNumbers = schema.enum.every((val: any) => typeof val === 'number');
    if (allNumbers) {
      const literals = schema.enum.map((val: any) => z.literal(val));
      let unionSchema = z.union(literals as [ZodType, ZodType, ...ZodType[]]);
      return schema.description ? unionSchema.describe(schema.description) : unionSchema;
    }
    
    const literals = schema.enum.map((val: any) => z.literal(val));
    let unionSchema = z.union(literals as [ZodType, ZodType, ...ZodType[]]);
    return schema.description ? unionSchema.describe(schema.description) : unionSchema;
  }

  switch (schema.type) {
    case "object": {
      const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
      const shape: Record<string, ZodType> = {};
      for (const [key, propSchema] of Object.entries(schema.properties || {})) {
        const propSchemaAny = propSchema as any;
        let propZod = jsonToZod(propSchemaAny);
        if (propSchemaAny.description) {
          propZod = propZod.describe(propSchemaAny.description);
        }
        shape[key] = requiredKeys.includes(key) ? propZod : propZod.optional();
      }
      return z.object(shape);
    }
    case "string": {
      let zodSchema = z.string();
      return schema.description ? zodSchema.describe(schema.description) : zodSchema;
    }
    case "number": {
      let zodSchema = z.number();
      return schema.description ? zodSchema.describe(schema.description) : zodSchema;
    }
    case "boolean": {
      let zodSchema = z.boolean();
      return schema.description ? zodSchema.describe(schema.description) : zodSchema;
    }
    default: return z.any();
  }
}

type ToolDef = { name: string; description?: string; schema: any; endpoint: string; method: "get" | "post" | "put" | "patch" | "delete" };

async function setupTools() {
  let toolDefs: ToolDef[];
  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers.Authorization = authType ? `${authType} ${apiKey}` : apiKey;
    }

    const res = await fetch(
      `${baseUrl}/tools`,
      { headers }
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
    server.addTool({
      name: def.name,
      description: def.description,
      parameters: jsonToZod(def.schema),
      execute: async (args: any) => {
        let res: Response;
        try {
          const headers: Record<string, string> = {};
          if (apiKey) {
            headers.Authorization = authType ? `${authType} ${apiKey}` : apiKey;
          }

          if (def.method === "get") {
            const params = new URLSearchParams();
            Object.entries(args).forEach(([k, v]) => params.append(k, String(v)));
            const url = `${baseUrl}${def.endpoint}?${params.toString()}`;
            res = await fetch(
              url,
              { method: "GET", headers }
            );
          } else {
            res = await fetch(
              `${baseUrl}${def.endpoint}`,
              {
                method: def.method.toUpperCase(),
                headers: {
                  "Content-Type": "application/json",
                  ...headers
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
}

setupTools().then(() => {
  server.start();
});
