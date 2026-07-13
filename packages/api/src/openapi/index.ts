import { z } from "zod";

export interface OpenAPISpec {
  openapi: "3.1.0";
  info: { title: string; version: string; description: string };
  servers: { url: string; description: string }[];
  paths: Record<string, PathItem>;
  components: {
    schemas: Record<string, SchemaObject>;
    securitySchemes: Record<string, SecuritySchemeObject>;
  };
  security: SecurityRequirement[];
  tags: TagObject[];
}

export interface PathItem {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  patch?: OperationObject;
  delete?: OperationObject;
  parameters?: ParameterObject[];
}

export interface OperationObject {
  summary: string;
  description?: string;
  operationId: string;
  tags: string[];
  security?: SecurityRequirement[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
}

export interface ParameterObject {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description?: string;
  required?: boolean;
  schema: SchemaObject;
}

export interface RequestBodyObject {
  description?: string;
  required: boolean;
  content: Record<string, MediaTypeObject>;
}

export interface MediaTypeObject {
  schema: SchemaObject;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, MediaTypeObject>;
  headers?: Record<string, HeaderObject>;
}

export interface HeaderObject {
  description?: string;
  schema: SchemaObject;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  enum?: unknown[];
  items?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  additionalProperties?: boolean | SchemaObject;
  nullable?: boolean;
  default?: unknown;
  anyOf?: SchemaObject[];
}

export interface SecuritySchemeObject {
  type: "http" | "apiKey" | "oauth2" | "openIdConnect";
  scheme?: string;
  bearerFormat?: string;
  name?: string;
  in?: string;
}

export type SecurityRequirement = Record<string, string[]>;

export interface TagObject {
  name: string;
  description?: string;
}

export function zodToSchema(zodSchema: z.ZodTypeAny): SchemaObject {
  const schema: any = zodSchema;
  const typeName = schema.constructor.name;

  switch (typeName) {
    case "ZodString":
      return { type: "string" };
    case "ZodNumber":
      return { type: "number" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodArray":
      return { type: "array", items: zodToSchema(schema.element) };
    case "ZodObject": {
      const shape = schema.shape;
      const properties: Record<string, SchemaObject> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToSchema(value as z.ZodTypeAny);
        const inner = (value as any)._def?.innerType || value;
        if (!inner?.isOptional?.()) required.push(key);
      }
      return { type: "object", properties, required };
    }
    case "ZodOptional":
      return zodToSchema(schema.unwrap());
    case "ZodNullable": {
      const s = zodToSchema(schema.unwrap());
      return { ...s, nullable: true };
    }
    case "ZodDefault": {
      const s = zodToSchema(schema.unwrap());
      return { ...s, default: schema._def?.defaultValue?.() };
    }
    case "ZodEnum":
      return { type: "string", enum: schema.options };
    case "ZodUnion":
      return { anyOf: schema.options.map(zodToSchema) };
    default:
      return { type: "object" };
  }
}

export function generateOpenAPISpec(): OpenAPISpec {
  return {
    openapi: "3.1.0",
    info: {
      title: "SiliconPath API",
      version: "1.0.0",
      description: "SiliconPath - VLSI/Embedded Career Platform API",
    },
    servers: [
      { url: "https://siliconpath.vercel.app", description: "Production" },
      { url: "http://localhost:3000", description: "Development" },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        AdminAuth: { type: "http", scheme: "bearer", bearerFormat: "Custom" },
        CronAuth: { type: "http", scheme: "bearer", bearerFormat: "API Key" },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: "opportunities", description: "Opportunity listings and management" },
      { name: "organizations", description: "Organization profiles" },
      { name: "academy", description: "Academy learning tracks" },
      { name: "news", description: "News articles" },
      { name: "resources", description: "Resources and guides" },
      { name: "search", description: "Search functionality" },
      { name: "subscribe", description: "Email subscriptions" },
      { name: "bookmarks", description: "User bookmarks" },
      { name: "feed", description: "Social feed" },
      { name: "network", description: "Professional network" },
      { name: "messages", description: "Direct messaging" },
      { name: "notifications", description: "Notifications" },
      { name: "profile", description: "User profile" },
      { name: "companies", description: "Company pages" },
      { name: "resume", description: "Resume management" },
      { name: "admin", description: "Admin operations" },
      { name: "cron", description: "Scheduled jobs" },
      { name: "ai", description: "AI Gateway endpoints" },
      { name: "internal", description: "Internal utilities" },
    ],
  };
}