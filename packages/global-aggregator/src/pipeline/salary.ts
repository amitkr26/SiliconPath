const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "₩": "KRW",
  "₽": "RUB",
  "A$": "AUD",
  "C$": "CAD",
  "CHF": "CHF",
  "R$": "BRL",
  "kr": "SEK",
  "zł": "PLN",
  "₺": "TRY",
  "R": "ZAR",
};

const CURRENCY_KEYWORDS: Record<string, string> = {
  usd: "USD",
  dollar: "USD",
  dollars: "USD",
  eur: "EUR",
  euro: "EUR",
  euros: "EUR",
  gbp: "GBP",
  pound: "GBP",
  pounds: "GBP",
  sterling: "GBP",
  inr: "INR",
  rupee: "INR",
  rupees: "INR",
  lpa: "INR",
  jpy: "JPY",
  yen: "JPY",
  krw: "KRW",
  won: "KRW",
  cny: "CNY",
  rmb: "CNY",
  yuan: "CNY",
  aud: "AUD",
  cad: "CAD",
  chf: "CHF",
  brl: "BRL",
  real: "BRL",
  sekel: "SEK",
  sek: "SEK",
  pln: "PLN",
  zloty: "PLN",
  try: "TRY",
  lira: "TRY",
  zar: "ZAR",
  rand: "ZAR",
};

export class SalaryParser {
  parse(
    salary: string | null,
  ): { min: number | null; max: number | null; currency: string } {
    if (!salary) return { min: null, max: null, currency: "" };

    const text = salary.trim();
    if (!text) return { min: null, max: null, currency: "" };

    const lower = text.toLowerCase();
    if (
      lower.includes("competitive") ||
      lower.includes("negotiable") ||
      lower.includes("doe") ||
      lower.includes("not disclosed")
    ) {
      const currency = this.detectCurrency(text);
      return { min: null, max: null, currency };
    }

    const currency = this.detectCurrency(text);
    const numbers = this.extractNumbers(text);

    if (numbers.length === 0) {
      return { min: null, max: null, currency };
    }

    const multiplier = this.getMultiplier(text);
    const adjusted = numbers.map((n) => n * multiplier);

    if (adjusted.length === 1) {
      return { min: adjusted[0], max: adjusted[0], currency };
    }

    const min = Math.min(...adjusted);
    const max = Math.max(...adjusted);
    return { min, max, currency };
  }

  private detectCurrency(text: string): string {
    const upper = text.toUpperCase();

    for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
      if (text.includes(symbol)) return code;
    }

    const lower = text.toLowerCase();
    for (const [keyword, code] of Object.entries(CURRENCY_KEYWORDS)) {
      if (lower.includes(keyword)) return code;
    }

    if (upper.includes("USD") || upper.includes("$")) return "USD";
    if (upper.includes("EUR")) return "EUR";
    if (upper.includes("GBP")) return "GBP";
    if (upper.includes("INR")) return "INR";

    return "";
  }

  private extractNumbers(text: string): number[] {
    const cleaned = text.replace(/[a-zA-Z₹€£¥₩\s]/g, " ");
    const matches = cleaned.match(
      /[\d,]+(?:\.\d+)?/g,
    );
    if (!matches) return [];

    return matches
      .map((m) => parseFloat(m.replace(/,/g, "")))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }

  private getMultiplier(text: string): number {
    const lower = text.toLowerCase();

    if (lower.includes("lakh") || lower.includes("lac")) return 100_000;
    if (lower.includes("lpa")) return 100_000;
    if (lower.includes("cr") || lower.includes("crore")) return 10_000_000;
    if (lower.includes("m ") || lower.includes("million")) return 1_000_000;
    if (lower.includes("k") && !lower.includes("km")) return 1_000;

    return 1;
  }
}
