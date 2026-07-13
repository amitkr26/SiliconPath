export function hashPrompt(prompt: string): string {
  let hash = 5381;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) + hash + prompt.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}
