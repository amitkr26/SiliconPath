const SCRIPT_RANGES: Array<{ min: number; max: number; code: string }> = [
  { min: 0x0041, max: 0x005a, code: "en" },
  { min: 0x0061, max: 0x007a, code: "en" },
  { min: 0x0900, max: 0x097f, code: "hi" },
  { min: 0x0980, max: 0x09ff, code: "bn" },
  { min: 0x0a00, max: 0x0a7f, code: "pa" },
  { min: 0x0a80, max: 0x0aff, code: "gu" },
  { min: 0x0b00, max: 0x0b7f, code: "or" },
  { min: 0x0b80, max: 0x0bff, code: "ta" },
  { min: 0x0c00, max: 0x0c7f, code: "te" },
  { min: 0x0c80, max: 0x0cff, code: "kn" },
  { min: 0x0d00, max: 0x0d7f, code: "ml" },
  { min: 0x0e00, max: 0x0e7f, code: "th" },
  { min: 0x0e80, max: 0x0eff, code: "lo" },
  { min: 0x1000, max: 0x109f, code: "my" },
  { min: 0x1100, max: 0x11ff, code: "ko" },
  { min: 0x3040, max: 0x309f, code: "ja" },
  { min: 0x30a0, max: 0x30ff, code: "ja" },
  { min: 0x3400, max: 0x4dbf, code: "zh" },
  { min: 0x4e00, max: 0x9fff, code: "zh" },
  { min: 0xf900, max: 0xfaff, code: "zh" },
  { min: 0x0600, max: 0x06ff, code: "ar" },
  { min: 0x0750, max: 0x077f, code: "ar" },
  { min: 0x0400, max: 0x04ff, code: "ru" },
  { min: 0x0370, max: 0x03ff, code: "el" },
  { min: 0x0590, max: 0x05ff, code: "he" },
  { min: 0x10a0, max: 0x10ff, code: "ka" },
  { min: 0x0100, max: 0x017f, code: "pl" },
  { min: 0x0180, max: 0x024f, code: "tr" },
  { min: 0x1100, max: 0x11ff, code: "ko" },
  { min: 0x0e01, max: 0x0e3a, code: "th" },
];

const LANG_KEYWORDS: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /\b(the|and|or|is|are|was|were|have|has|been|will|would|could|should|may|might|must|can|this|that|with|from|for|not|but)\b/gi, code: "en" },
  { pattern: /\b(की|का|के|है|हैं|में|से|को|पर|और|या|अगर|तो|भी|नहीं)\b/g, code: "hi" },
  { pattern: /\b(der|die|das|und|ist|ein|eine|für|mit|von|auf|nicht|aber|auch|als|noch|wie|nur|bei)\b/g, code: "de" },
  { pattern: /\b(le|la|les|des|est|sont|avec|pour|dans|pas|mais|que|qui|sur|une|une|nous|vous|ils|elles)\b/g, code: "fr" },
  { pattern: /\b(el|la|los|las|es|son|con|por|para|del|una|que|este|esta|más|pero|como|todo|hay|ser|tiene)\b/g, code: "es" },
  { pattern: /\b(il|la|le|di|che|non|per|con|una|sono|del|della|degli|delle|questo|questa|anche|più|come|molto|dove)\b/g, code: "it" },
  { pattern: /\b(de|het|een|van|en|is|dat|op|te|zich|ook|niet|maar|wel|kan|zal|nog|bij|dan|naar|uit)\b/g, code: "nl" },
  { pattern: /\b(を|に|は|が|の|で|と|も|から|まで|より|ため|こと|もの|それ|これ|その|この|ため|よう|ない|ある|いる|なる)\b/g, code: "ja" },
  { pattern: /\b(의|에|는|가|을|를|이|와|로|으로|도|에서|만|에게|한|하는|있는|없는|되는)\b/g, code: "ko" },
  { pattern: /\b(是|的|了|在|不|有|和|就|人|都|一|上|也|很|到|说|要|去|你|会|着|没有|看|好|自己|这)\b/g, code: "zh" },
];

export class LanguageDetector {
  detect(text: string): string {
    if (!text) return "en";

    const scriptCounts = new Map<string, number>();
    let nonAsciiCount = 0;

    for (const char of text) {
      const code = char.codePointAt(0);
      if (code === undefined) continue;

      if (code < 0x80) continue;
      nonAsciiCount++;

      for (const range of SCRIPT_RANGES) {
        if (code >= range.min && code <= range.max) {
          scriptCounts.set(
            range.code,
            (scriptCounts.get(range.code) ?? 0) + 1,
          );
          break;
        }
      }
    }

    if (nonAsciiCount === 0) return "en";

    if (scriptCounts.size > 0) {
      let bestScript = "";
      let bestCount = 0;
      for (const [code, count] of scriptCounts) {
        if (count > bestCount) {
          bestCount = count;
          bestScript = code;
        }
      }
      if (bestScript) return bestScript;
    }

    const lowerText = text.toLowerCase();
    let bestLang = "en";
    let bestScore = 0;

    for (const { pattern, code } of LANG_KEYWORDS) {
      const matches = lowerText.match(pattern);
      const score = matches?.length ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestLang = code;
      }
    }

    return bestScore > 0 ? bestLang : "en";
  }
}
