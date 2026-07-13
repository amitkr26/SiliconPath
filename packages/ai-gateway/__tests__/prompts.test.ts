import { TemplateEngine, type PromptTemplate } from "../src/prompts";

describe("TemplateEngine", () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  const sampleTemplate: PromptTemplate = {
    name: "greeting",
    version: "1.0.0",
    system: "You are a {{role}} assistant.",
    template: "Hello {{name}}!",
    variables: ["role", "name"],
    validate(vars: Record<string, string>) {
      return !!vars.role && !!vars.name;
    },
    render(vars: Record<string, string>) {
      return {
        system: this.system.replace("{{role}}", vars.role ?? ""),
        prompt: this.template.replace("{{name}}", vars.name ?? ""),
      };
    },
  };

  describe("register / get / has", () => {
    it("registers and retrieves a template", () => {
      engine.register(sampleTemplate);
      expect(engine.has("greeting")).toBe(true);
      const retrieved = engine.get("greeting");
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("greeting");
    });

    it("returns null for unknown template", () => {
      expect(engine.get("nonexistent")).toBeNull();
    });

    it("lists registered templates", () => {
      engine.register(sampleTemplate);
      expect(engine.list()).toContain("greeting");
    });
  });

  describe("render", () => {
    it("renders a template with variables", () => {
      engine.register(sampleTemplate);
      const result = engine.render("greeting", { role: "friendly", name: "World" });
      expect(result.system).toBe("You are a friendly assistant.");
      expect(result.prompt).toBe("Hello World!");
    });

    it("throws for missing required variables", () => {
      engine.register(sampleTemplate);
      expect(() => engine.render("greeting", { role: "friendly" })).toThrow();
    });

    it("throws for unknown template", () => {
      expect(() => engine.render("unknown", {})).toThrow();
    });
  });
});

describe("built-in templates", () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  it("has 11 built-in templates", () => {
    expect(engine.list().length).toBe(0);
  });
});
