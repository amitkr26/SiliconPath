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
  $ref?: string;
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
      const dv = (schema as any)._def?.defaultValue;
      return { ...s, default: typeof dv === "function" ? dv() : dv };
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
      title: "BerojgarDegreeWala API",
      version: "1.0.0",
      description: "BerojgarDegreeWala - VLSI/Embedded Career Platform API",
    },
    servers: [
      { url: "https://electrobridge-api.onrender.com/api/v1", description: "Backend (Render)" },
      { url: "https://berojgardegreewala.vercel.app/api", description: "Frontend (Vercel)" },
      { url: "http://localhost:8080/api/v1", description: "Local backend" },
    ],
    paths: {
      "/api/v1/opportunities": {
        get: {
          summary: "List opportunities",
          description: "Paginated list of opportunities with filtering, search, and sorting",
          operationId: "listOpportunities",
          tags: ["opportunities"],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "eligibility", in: "query", schema: { type: "string" } },
            { name: "location", in: "query", schema: { type: "string" } },
            { name: "deadline", in: "query", schema: { type: "string", enum: ["All", "This Week", "This Month", "Later"] } },
            { name: "verified", in: "query", schema: { type: "string", enum: ["all", "true"], default: "true" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Paginated opportunity list", content: { "application/json": { schema: { $ref: "#/components/schemas/OpportunityListResponse" } } } },
            "500": { description: "Server error" },
          },
        },
        post: {
          summary: "Create opportunity",
          description: "Create a new opportunity (admin only)",
          operationId: "createOpportunity",
          tags: ["opportunities"],
          security: [{ AdminAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateOpportunityRequest" } } } },
          responses: {
            "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/OpportunityResponse" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/v1/opportunities/{id}": {
        get: {
          summary: "Get opportunity by ID",
          operationId: "getOpportunityById",
          tags: ["opportunities"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Opportunity details", content: { "application/json": { schema: { $ref: "#/components/schemas/OpportunityResponse" } } } },
            "404": { description: "Not found" },
          },
        },
      },
      "/api/v1/opportunities/by-slug/{slug}": {
        get: {
          summary: "Get opportunity by slug",
          operationId: "getOpportunityBySlug",
          tags: ["opportunities"],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Opportunity details", content: { "application/json": { schema: { $ref: "#/components/schemas/OpportunityResponse" } } } },
            "404": { description: "Not found" },
          },
        },
      },
      "/api/v1/opportunities/featured": {
        get: {
          summary: "List featured opportunities",
          operationId: "listFeaturedOpportunities",
          tags: ["opportunities"],
          responses: {
            "200": { description: "Featured opportunities list" },
          },
        },
      },
      "/api/v1/opportunities/stats": {
        get: {
          summary: "Opportunity statistics",
          operationId: "getOpportunityStats",
          tags: ["opportunities"],
          responses: {
            "200": { description: "Aggregate statistics" },
          },
        },
      },
      "/api/v1/opportunities-feed": {
        get: {
          summary: "RSS-like JSON feed",
          operationId: "getOpportunitiesFeed",
          tags: ["opportunities"],
          responses: {
            "200": { description: "Public JSON feed of opportunities" },
          },
        },
      },
      "/api/v1/similar/{id}": {
        get: {
          summary: "Get similar opportunities",
          operationId: "getSimilarOpportunities",
          tags: ["opportunities"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Similar opportunities list" },
          },
        },
      },
      "/api/v1/organizations": {
        get: {
          summary: "List organizations",
          operationId: "listOrganizations",
          tags: ["organizations"],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Paginated organization list" },
          },
        },
      },
      "/api/v1/organizations/{slug}": {
        get: {
          summary: "Get organization by slug",
          operationId: "getOrganization",
          tags: ["organizations"],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Organization details" },
            "404": { description: "Not found" },
          },
        },
      },
      "/api/v1/search/opportunities": {
        get: {
          summary: "Search opportunities",
          operationId: "searchOpportunities",
          tags: ["search"],
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          ],
          responses: {
            "200": { description: "Search results" },
          },
        },
      },
      "/api/v1/companies": {
        get: {
          summary: "List companies",
          operationId: "listCompanies",
          tags: ["companies"],
          responses: {
            "200": { description: "Company list" },
          },
        },
      },
      "/api/v1/companies/{id}": {
        get: {
          summary: "Get company",
          operationId: "getCompany",
          tags: ["companies"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Company details" },
          },
        },
      },
      "/api/v1/news": {
        get: {
          summary: "List news articles",
          operationId: "listNews",
          tags: ["news"],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            "200": { description: "Paginated news list" },
          },
        },
      },
      "/api/v1/news/{slug}": {
        get: {
          summary: "Get news article",
          operationId: "getNews",
          tags: ["news"],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "News article details" },
            "404": { description: "Not found" },
          },
        },
      },
      "/api/v1/subscribe": {
        post: {
          summary: "Subscribe to newsletter",
          operationId: "subscribe",
          tags: ["subscribe"],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { email: { type: "string", format: "email" } }, required: ["email"] } } } },
          responses: {
            "200": { description: "Subscribed" },
          },
        },
      },
      "/api/v1/bookmarks": {
        get: {
          summary: "List bookmarks",
          operationId: "listBookmarks",
          tags: ["bookmarks"],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Bookmarked opportunities" },
          },
        },
        post: {
          summary: "Add bookmark",
          operationId: "addBookmark",
          tags: ["bookmarks"],
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { opportunity_id: { type: "string", format: "uuid" } }, required: ["opportunity_id"] } } } },
          responses: {
            "201": { description: "Bookmarked" },
          },
        },
      },
      "/api/v1/profile/me": {
        get: {
          summary: "Get own profile",
          operationId: "getMyProfile",
          tags: ["profile"],
          responses: {
            "200": { description: "Profile data" },
          },
        },
        patch: {
          summary: "Update own profile",
          operationId: "updateMyProfile",
          tags: ["profile"],
          responses: {
            "200": { description: "Profile updated" },
          },
        },
      },
      "/api/v1/resume": {
        post: {
          summary: "Upload resume",
          operationId: "uploadResume",
          tags: ["resume"],
          requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
          responses: {
            "201": { description: "Resume uploaded" },
          },
        },
      },
      "/api/v1/applications": {
        get: {
          summary: "List applications",
          operationId: "listApplications",
          tags: ["opportunities"],
          responses: {
            "200": { description: "Application list" },
          },
        },
        post: {
          summary: "Submit application",
          operationId: "submitApplication",
          tags: ["opportunities"],
          responses: {
            "201": { description: "Application submitted" },
          },
        },
      },
      "/api/v1/academy/tracks": {
        get: {
          summary: "List academy tracks",
          operationId: "listTracks",
          tags: ["academy"],
          responses: {
            "200": { description: "Track list" },
          },
        },
      },
      "/api/v1/academy/tracks/{id}": {
        get: {
          summary: "Get track details",
          operationId: "getTrack",
          tags: ["academy"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Track details" },
          },
        },
      },
      "/api/v1/resources": {
        get: {
          summary: "List resources",
          operationId: "listResources",
          tags: ["resources"],
          responses: {
            "200": { description: "Resource list" },
          },
        },
      },
      "/api/v1/resources/{slug}": {
        get: {
          summary: "Get resource",
          operationId: "getResource",
          tags: ["resources"],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Resource details" },
          },
        },
      },
      "/api/v1/ai/chat": {
        post: {
          summary: "AI chat assistant",
          operationId: "aiChat",
          tags: ["ai"],
          responses: {
            "200": { description: "AI response" },
          },
        },
      },
      "/api/v1/ai/search": {
        post: {
          summary: "AI-powered search",
          operationId: "aiSearch",
          tags: ["ai"],
          responses: {
            "200": { description: "AI search results" },
          },
        },
      },
      "/api/v1/ai/match": {
        post: {
          summary: "Match opportunities to profile",
          operationId: "aiMatch",
          tags: ["ai"],
          responses: {
            "200": { description: "Matching results" },
          },
        },
      },
      "/api/v1/admin/opportunities": {
        get: {
          summary: "Admin list opportunities",
          operationId: "adminListOpportunities",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "status", in: "query", schema: { type: "string", enum: ["pending", "verified", "rejected"] } },
          ],
          responses: {
            "200": { description: "Admin opportunity list" },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          summary: "Admin create opportunity",
          operationId: "adminCreateOpportunity",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "201": { description: "Created" },
          },
        },
      },
      "/api/v1/admin/opportunities/{id}": {
        get: {
          summary: "Admin get opportunity",
          operationId: "adminGetOpportunity",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Opportunity details" },
          },
        },
        patch: {
          summary: "Admin update opportunity",
          operationId: "adminUpdateOpportunity",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "200": { description: "Updated" },
          },
        },
        delete: {
          summary: "Admin delete opportunity",
          operationId: "adminDeleteOpportunity",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "200": { description: "Deleted" },
          },
        },
      },
      "/api/v1/admin/opportunities/{id}/verify": {
        patch: {
          summary: "Verify opportunity",
          operationId: "adminVerifyOpportunity",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Verified" },
          },
        },
      },
      "/api/v1/admin/opportunities/{id}/reject": {
        patch: {
          summary: "Reject opportunity",
          operationId: "adminRejectOpportunity",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "Rejected" },
          },
        },
      },
      "/api/v1/admin/organizations": {
        get: {
          summary: "Admin list organizations",
          operationId: "adminListOrganizations",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "200": { description: "Organization list" },
          },
        },
        post: {
          summary: "Admin create organization",
          operationId: "adminCreateOrganization",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "201": { description: "Created" },
          },
        },
      },
      "/api/v1/admin/scrape/status": {
        get: {
          summary: "Scrape job status",
          operationId: "getScrapeStatus",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "200": { description: "Scrape source statuses" },
          },
        },
      },
      "/api/v1/admin/analytics": {
        get: {
          summary: "Admin analytics",
          operationId: "getAdminAnalytics",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "200": { description: "Analytics data" },
          },
        },
      },
      "/api/v1/admin/subscribers": {
        get: {
          summary: "Admin list subscribers",
          operationId: "adminListSubscribers",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "200": { description: "Subscriber list" },
          },
        },
      },
      "/api/v1/admin/scrape-health": {
        get: {
          summary: "Scrape health check",
          operationId: "getScrapeHealth",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "200": { description: "Health status" },
          },
        },
      },
      "/api/v1/admin/ai/test": {
        post: {
          summary: "Test AI endpoint",
          operationId: "adminTestAi",
          tags: ["admin"],
          security: [{ AdminAuth: [] }],
          responses: {
            "200": { description: "AI test result" },
          },
        },
      },
      "/api/v1/cron/scrape-india": {
        get: {
          summary: "Cron: scrape India opportunities",
          operationId: "cronScrapeIndia",
          tags: ["cron"],
          security: [{ CronAuth: [] }],
          responses: {
            "200": { description: "Scrape result" },
          },
        },
      },
      "/api/v1/cron/scrape-global": {
        get: {
          summary: "Cron: scrape global opportunities",
          operationId: "cronScrapeGlobal",
          tags: ["cron"],
          security: [{ CronAuth: [] }],
          responses: {
            "200": { description: "Scrape result" },
          },
        },
      },
      "/api/v1/cron/scrape-news": {
        get: {
          summary: "Cron: scrape news",
          operationId: "cronScrapeNews",
          tags: ["cron"],
          security: [{ CronAuth: [] }],
          responses: {
            "200": { description: "Scrape result" },
          },
        },
      },
      "/api/v1/cron/check-links": {
        get: {
          summary: "Cron: check dead links",
          operationId: "cronCheckLinks",
          tags: ["cron"],
          security: [{ CronAuth: [] }],
          responses: {
            "200": { description: "Check result" },
          },
        },
      },
      "/api/v1/cron/cleanup": {
        get: {
          summary: "Cron: expire stale opportunities",
          operationId: "cronCleanup",
          tags: ["cron"],
          security: [{ CronAuth: [] }],
          responses: {
            "200": { description: "Cleanup result" },
          },
        },
      },
      "/api/v1/cron/digest": {
        get: {
          summary: "Cron: send email digest",
          operationId: "cronDigest",
          tags: ["cron"],
          security: [{ CronAuth: [] }],
          responses: {
            "200": { description: "Digest sent" },
          },
        },
      },
      "/api/v1/people/search": {
        get: {
          summary: "Search people",
          operationId: "searchPeople",
          tags: ["network"],
          parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "People results" },
          },
        },
      },
      "/api/v1/feed": {
        get: {
          summary: "List social feed",
          operationId: "listFeed",
          tags: ["feed"],
          responses: {
            "200": { description: "Feed posts" },
          },
        },
      },
      "/api/v1/notifications": {
        get: {
          summary: "List notifications",
          operationId: "listNotifications",
          tags: ["notifications"],
          responses: {
            "200": { description: "Notification list" },
          },
        },
      },
      "/api/v1/notifications/count": {
        get: {
          summary: "Unread notification count",
          operationId: "getNotificationCount",
          tags: ["notifications"],
          responses: {
            "200": { description: "Count" },
          },
        },
      },
      "/api/v1/messages": {
        get: {
          summary: "List conversations",
          operationId: "listConversations",
          tags: ["messages"],
          responses: {
            "200": { description: "Conversation list" },
          },
        },
        post: {
          summary: "Send message",
          operationId: "sendMessage",
          tags: ["messages"],
          responses: {
            "201": { description: "Message sent" },
          },
        },
      },
      "/api/v1/track-click": {
        post: {
          summary: "Track outbound click",
          operationId: "trackClick",
          tags: ["internal"],
          responses: {
            "200": { description: "Tracked" },
          },
        },
      },
      "/api/v1/calendar-export/{id}": {
        get: {
          summary: "Export calendar event",
          operationId: "exportCalendar",
          tags: ["internal"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": { description: "ICS file", content: { "text/calendar": { schema: { type: "string" } } } },
          },
        },
      },
      "/api/v1/auth/signout": {
        post: {
          summary: "Sign out",
          operationId: "signOut",
          tags: ["internal"],
          responses: {
            "200": { description: "Signed out" },
          },
        },
      },
      "/api/v1/scrape": {
        get: {
          summary: "Trigger scrape (admin/cron)",
          operationId: "triggerScrape",
          tags: ["cron", "admin"],
          security: [{ AdminAuth: [] }, { CronAuth: [] }],
          parameters: [{ name: "mode", in: "query", schema: { type: "string", enum: ["all", "news", "opportunities"], default: "all" } }],
          responses: {
            "200": { description: "Scrape result" },
          },
        },
      },
    },
    components: {
      schemas: {
        Opportunity: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            slug: { type: "string" },
            category: { type: "string" },
            location: { type: "string" },
            salary_range: { type: "string" },
            deadline: { type: "string", format: "date" },
            eligibility: { type: "string" },
            description: { type: "string" },
            apply_url: { type: "string", format: "uri" },
            source_url: { type: "string", format: "uri" },
            tags: { type: "array", items: { type: "string" } },
            verification_status: { type: "string", enum: ["pending", "verified", "rejected"] },
            is_active: { type: "boolean" },
            source_type: { type: "string", enum: ["scraped", "employer_posted", "admin"] },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            organization: { $ref: "#/components/schemas/Organization" },
          },
        },
        Organization: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
            type: { type: "string", enum: ["government", "academic", "private"] },
            logo_url: { type: "string", format: "uri" },
            website: { type: "string", format: "uri" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        OpportunityListResponse: {
          type: "object",
          properties: {
            opportunities: { type: "array", items: { $ref: "#/components/schemas/Opportunity" } },
            count: { type: "integer" },
            total_count: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            total_pages: { type: "integer" },
          },
        },
        OpportunityResponse: {
          type: "object",
          properties: {
            opportunity: { $ref: "#/components/schemas/Opportunity" },
          },
        },
        CreateOpportunityRequest: {
          type: "object",
          required: ["title", "category"],
          properties: {
            title: { type: "string" },
            category: { type: "string" },
            location: { type: "string" },
            salary_range: { type: "string" },
            deadline: { type: "string", format: "date" },
            eligibility: { type: "string" },
            description: { type: "string" },
            apply_url: { type: "string", format: "uri" },
            source_url: { type: "string", format: "uri" },
            tags: { type: "array", items: { type: "string" } },
            organization_id: { type: "string", format: "uuid" },
            source_type: { type: "string", enum: ["scraped", "employer_posted", "admin"] },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            error: { type: "string" },
            code: { type: "string" },
            details: {},
          },
        },
      },
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