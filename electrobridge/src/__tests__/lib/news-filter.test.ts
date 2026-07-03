import { isElectronicsNews } from '@/lib/scrapers/news-filter';

describe('isElectronicsNews', () => {
  describe('articles that SHOULD pass (electronics-related)', () => {
    it('passes a VLSI article', () => {
      expect(isElectronicsNews(
        'TSMC announces 2nm VLSI process milestone',
        'The new process node delivers 30% faster transistors',
        1
      )).toBe(true);
    });

    it('passes a semiconductor article', () => {
      expect(isElectronicsNews(
        'Global semiconductor market to reach $1 trillion by 2030',
        'Driven by AI chip demand and wafer fab expansions',
        1
      )).toBe(true);
    });

    it('passes an embedded systems article', () => {
      expect(isElectronicsNews(
        'New microcontroller for embedded IoT applications',
        'Low-power ARM Cortex-M4 MCU with integrated radio',
        1
      )).toBe(true);
    });

    it('passes a chip design article', () => {
      expect(isElectronicsNews(
        'RISC-V architecture gains traction in SoC design',
        'Open-source ISA competing with ARM in chip design',
        1
      )).toBe(true);
    });

    it('passes an optoelectronics article', () => {
      expect(isElectronicsNews(
        'Breakthrough in silicon photonics for optical interconnects',
        'Researchers demonstrate efficient LED-on-silicon integration',
        1
      )).toBe(true);
    });
  });

  describe('articles that SHOULD be blocked (non-electronics)', () => {
    it('blocks a mango farming article', () => {
      expect(isElectronicsNews(
        'Mango production reaches record high this season',
        'Farmers report bumper crop of Alphonso mangoes',
        1
      )).toBe(false);
    });

    it('blocks a cricket article', () => {
      expect(isElectronicsNews(
        'India wins cricket World Cup in thrilling final',
        'Batting collapse leads to dramatic finish',
        1
      )).toBe(false);
    });

    it('blocks a Bollywood article', () => {
      expect(isElectronicsNews(
        'Bollywood blockbuster breaks box office records',
        'Star-studded cast draws millions to theaters',
        1
      )).toBe(false);
    });

    it('blocks a sports article', () => {
      expect(isElectronicsNews(
        'IPL 2026 auction sees record player bids',
        'Franchises spend big on international stars',
        1
      )).toBe(false);
    });

    it('blocks a fashion article', () => {
      expect(isElectronicsNews(
        'Top fashion trends for summer 2026',
        'Sustainable fabrics dominate the runway this season',
        1
      )).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('is case insensitive', () => {
      expect(isElectronicsNews(
        'SEMICONDUCTOR MARKET GROWING RAPIDLY',
        'VLSI CHIPS ARE IN HIGH DEMAND',
        1
      )).toBe(true);
    });

    it('handles partial keyword matches in summary', () => {
      expect(isElectronicsNews(
        'New architecture for AI workloads',
        'Advanced semiconductor packaging enables heterogeneous integration',
        1
      )).toBe(true);
    });

    it('handles null summary', () => {
      expect(isElectronicsNews(
        'Semiconductor breakthrough announced',
        null,
        1
      )).toBe(true);
    });

    it('rejects non-electronics with null summary', () => {
      expect(isElectronicsNews(
        'Cooking recipes for beginners',
        null,
        1
      )).toBe(false);
    });

    it('tier 2 requires title match (summary-only match fails)', () => {
      expect(isElectronicsNews(
        'Cooking recipes for beginners',
        'VLSI chip design trends in semiconductor industry',
        2
      )).toBe(false);
    });

    it('tier 2 passes when title matches', () => {
      expect(isElectronicsNews(
        'Semiconductor shortage impacts auto industry',
        'Car manufacturers face production delays',
        2
      )).toBe(true);
    });
  });
});
