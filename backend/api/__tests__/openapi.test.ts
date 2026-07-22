import { generateOpenAPISpec, zodToSchema } from "../src/openapi";
import { z } from "zod";

describe("openapi", () => {
  it("generates base spec", () => {
    const spec = generateOpenAPISpec();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info.title).toBe("BerojgarDegreeWala API");
    expect(spec.components.securitySchemes.BearerAuth).toBeDefined();
  });

  it("converts zod string schema", () => {
    const schema = zodToSchema(z.string().min(1).max(100));
    expect(schema.type).toBe("string");
  });

  it("converts zod object schema", () => {
    const schema = zodToSchema(
      z.object({
        name: z.string(),
        age: z.number().int().min(0),
        active: z.boolean().default(true),
      })
    );
    expect(schema.type).toBe("object");
    expect(schema.properties?.name?.type).toBe("string");
    expect(schema.properties?.age?.type).toBe("number");
    expect(schema.properties?.active?.type).toBe("boolean");
    expect(schema.required).toContain("name");
    expect(schema.required).toContain("age");
  });
});