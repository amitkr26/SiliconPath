interface BrokenHtmlResult {
  broken: boolean;
  issues: string[];
}

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const SELF_CLOSING = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export class BrokenHtmlDetector {
  check(html: string | null | undefined): BrokenHtmlResult {
    if (!html) return { broken: false, issues: [] };

    const issues: string[] = [];

    if (this.hasEncodingIssues(html)) {
      issues.push("Detected encoding issues or invalid characters");
    }

    const tagStack: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (VOID_ELEMENTS.has(tagName)) continue;

      if (fullTag.startsWith("</")) {
        if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
          tagStack.pop();
        } else {
          const expected = tagStack.length > 0 ? tagStack[tagStack.length - 1] : "none";
          issues.push(
            `Mismatched closing tag </${tagName}> expected </${expected}> at position ${match.index}`,
          );
        }
      } else if (!fullTag.endsWith("/>")) {
        tagStack.push(tagName);
      }
    }

    if (tagStack.length > 0) {
      issues.push(
        `Unclosed tags: ${tagStack.slice(0, 5).join(", ")}${tagStack.length > 5 ? ` and ${tagStack.length - 5} more` : ""}`,
      );
    }

    const scriptOpen = (html.match(/<script/gi) ?? []).length;
    const scriptClose = (html.match(/<\/script>/gi) ?? []).length;
    if (scriptOpen !== scriptClose) {
      issues.push(`Mismatched script tags: ${scriptOpen} open, ${scriptClose} close`);
    }

    const styleOpen = (html.match(/<style/gi) ?? []).length;
    const styleClose = (html.match(/<\/style>/gi) ?? []).length;
    if (styleOpen !== styleClose) {
      issues.push(`Mismatched style tags: ${styleOpen} open, ${styleClose} close`);
    }

    return {
      broken: issues.length > 0,
      issues,
    };
  }

  private hasEncodingIssues(html: string): boolean {
    for (let i = 0; i < Math.min(html.length, 10_000); i++) {
      const code = html.charCodeAt(i);
      if (
        (code >= 0x00 && code <= 0x08) ||
        code === 0x0b ||
        code === 0x0c ||
        (code >= 0x0e && code <= 0x1f)
      ) {
        return true;
      }
    }

    const replacementCharCount = (html.match(/\uFFFD/g) ?? []).length;
    if (replacementCharCount > 3) return true;

    return false;
  }
}
