const LOGO_DEV_TOKEN =
  process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

const STOCKBIT_LOGO_CDN = (ticker: string) =>
  `https://assets.stockbit.com/logos/companies/${ticker}.png`;

const IDN_FINLOGOS_CDN = (slug: string) =>
  `https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@2.5.1/icons/${slug}.svg`;

const IDN_FINLOGOS_FALLBACK: Record<string, string> = {
  BBCA: "bca",
  BBRI: "bri",
  BMRI: "mandiri",
  BBNI: "bni",
  BBTN: "btn",
  BTPN: "btpn",
  BJBR: "bank-bjb",
  BRIS: "bsi",
  TSEL: "telkomsel",
};

export function getStockLogo(symbol: string): string | null {
  return getStockLogoSources(symbol)[0] ?? null;
}

export function getStockLogoSources(symbol: string): string[] {
  const ticker = symbol.toUpperCase().trim();

  if (!ticker) {
    return [];
  }

  const sources = [STOCKBIT_LOGO_CDN(ticker)];

  if (LOGO_DEV_TOKEN) {
    sources.push(
      `https://img.logo.dev/${ticker}?token=${LOGO_DEV_TOKEN}&size=80&format=png&fallback=monogram`,
    );
  }

  const fallbackSlug = IDN_FINLOGOS_FALLBACK[ticker];

  if (fallbackSlug) {
    sources.push(IDN_FINLOGOS_CDN(fallbackSlug));
  }

  return sources;
}
