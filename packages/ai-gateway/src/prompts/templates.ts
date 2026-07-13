import type { PromptTemplate } from "./index";
import { templates } from "./index";

function createTemplate(
  name: string,
  system: string,
  template: string,
): PromptTemplate {
  const allText = system + template;
  const matches = allText.match(/\{\{(\w+)\}\}/g);
  const variables = [
    ...new Set(
      (matches ?? []).map((m) => m.slice(2, -2)),
    ),
  ];

  return {
    name,
    version: "1.0.0",
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
      const renderText = (text: string): string =>
        text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
      return {
        system: renderText(this.system),
        prompt: renderText(this.template),
      };
    },
  };
}

const summarize = createTemplate(
  "summarize",
  "You are a precise summarization assistant. Produce concise, accurate summaries that capture the key points without adding information not present in the source.",
  "Summarize the following text concisely, preserving the key points and main ideas:\n\n{{text}}",
);

const rewrite = createTemplate(
  "rewrite",
  "You are a skilled writing assistant. Rewrite text while preserving its core meaning but changing the style and tone as requested.",
  "Rewrite the following text in a {{style}} tone:\n\n{{text}}",
);

const classify = createTemplate(
  "classify",
  "You are a text classification assistant. Classify the given text into exactly one of the provided categories. Respond with only the category name.",
  "Classify the following text into one of these categories: {{categories}}\n\nText: {{text}}\n\nCategory:",
);

const extract = createTemplate(
  "extract",
  "You are a structured data extraction assistant. Extract information from the text that matches the given JSON schema. Return only valid JSON.",
  "Extract structured data from the following text matching this JSON schema:\n\nSchema: {{schema}}\n\nText: {{text}}\n\nJSON:",
);

const translate = createTemplate(
  "translate",
  "You are a professional translator. Translate text accurately while preserving meaning, tone, and formatting.",
  "Translate the following text to {{language}}:\n\n{{text}}",
);

const grammar = createTemplate(
  "grammar",
  "You are a grammar and spelling correction assistant. Fix all grammatical errors, spelling mistakes, and punctuation issues while preserving the original meaning and style.",
  "Fix the grammar and spelling in the following text. Return only the corrected text without explanations:\n\n{{text}}",
);

const expand = createTemplate(
  "expand",
  "You are a skilled writer. Expand outlines and brief notes into full, well-structured text while maintaining the original intent.",
  "Expand the following outline into full, well-structured text:\n\n{{text}}",
);

const shorten = createTemplate(
  "shorten",
  "You are a concise editing assistant. Shorten text while preserving all key information and meaning.",
  "Shorten the following text while preserving all key information. Target length: approximately {{targetLength}}:\n\n{{text}}",
);

const bulletize = createTemplate(
  "bulletize",
  "You are a text organization assistant. Convert prose into clear, concise bullet points.",
  "Convert the following text into clear, concise bullet points:\n\n{{text}}",
);

const codeReview = createTemplate(
  "codeReview",
  "You are an expert code reviewer. Review code for bugs, security issues, performance problems, and style improvements. Be specific about line numbers and provide concrete suggestions.",
  "Review the following {{language}} code for issues, bugs, security concerns, and improvements:\n\n```{{language}}\n{{code}}\n```\n\nProvide a detailed review covering:\n1. Bugs and logical errors\n2. Security vulnerabilities\n3. Performance issues\n4. Code style and readability\n5. Suggestions for improvement",
);

const generateQuestions = createTemplate(
  "generateQuestions",
  "You are a question generation assistant. Generate thoughtful, relevant questions based on the given text. Questions should test comprehension, encourage critical thinking, and cover key topics.",
  "Generate {{count}} thoughtful questions based on the following text:\n\n{{text}}\n\nQuestions:",
);

const builtInTemplates: PromptTemplate[] = [
  summarize,
  rewrite,
  classify,
  extract,
  translate,
  grammar,
  expand,
  shorten,
  bulletize,
  codeReview,
  generateQuestions,
];

for (const template of builtInTemplates) {
  templates.register(template);
}

export {
  summarize,
  rewrite,
  classify,
  extract,
  translate,
  grammar,
  expand,
  shorten,
  bulletize,
  codeReview,
  generateQuestions,
};
