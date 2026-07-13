export interface PromptTemplate {
  name: string;
  version: string;
  system: string;
  template: string;
  variables: string[];
  validate(vars: Record<string, string>): boolean;
  render(vars: Record<string, string>): { system: string; prompt: string };
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  const vars = new Set<string>();
  for (const match of matches) {
    const name = match.slice(2, -2);
    vars.add(name);
  }
  return [...vars];
}

function substitutePlaceholders(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (key in vars) return vars[key]!;
    return `{{${key}}}`;
  });
}

function createTemplate(
  name: string,
  version: string,
  system: string,
  template: string,
): PromptTemplate {
  const variables = [
    ...new Set([...extractVariables(system), ...extractVariables(template)]),
  ];

  return {
    name,
    version,
    system,
    template,
    variables,
    validate(vars: Record<string, string>): boolean {
      for (const v of this.variables) {
        if (!(v in vars) || typeof vars[v] !== "string" || vars[v].length === 0) {
          return false;
        }
      }
      return true;
    },
    render(vars: Record<string, string>): { system: string; prompt: string } {
      return {
        system: substitutePlaceholders(this.system, vars),
        prompt: substitutePlaceholders(this.template, vars),
      };
    },
  };
}

class TemplateEngine {
  private registry = new Map<string, PromptTemplate>();

  register(template: PromptTemplate): void {
    this.registry.set(template.name, template);
  }

  get(name: string): PromptTemplate | null {
    return this.registry.get(name) ?? null;
  }

  render(name: string, vars: Record<string, string>): { system: string; prompt: string } {
    const template = this.registry.get(name);
    if (!template) {
      throw new Error(`Template "${name}" not found`);
    }
    if (!template.validate(vars)) {
      const missing = template.variables.filter((v) => !(v in vars) || !vars[v]);
      throw new Error(
        `Template "${name}" validation failed. Missing or empty variables: ${missing.join(", ")}`,
      );
    }
    return template.render(vars);
  }

  list(): string[] {
    return [...this.registry.keys()];
  }

  has(name: string): boolean {
    return this.registry.has(name);
  }
}

export const templates = new TemplateEngine();
export { TemplateEngine };
