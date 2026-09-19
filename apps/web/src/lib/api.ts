export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";


export async function getStockHistory(symbol: string) {
  const response = await fetch(
    `${API_URL}/api/market/stocks/${symbol}/history`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock history: ${response.status}`
    );
  }

  return response.json();
}


export async function getStockIndicatorHistory(
  symbol: string
) {
  const response = await fetch(
    `${API_URL}/api/market/stocks/${symbol}/indicators/history`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock indicator history: ${response.status}`
    );
  }

  return response.json();
}


export async function getStockIndicators(symbol: string) {
  const response = await fetch(
    `${API_URL}/api/market/stocks/${symbol}/indicators`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock indicators: ${response.status}`
    );
  }

  return response.json();
}


export async function getStock(symbol: string) {
  const response = await fetch(
    `${API_URL}/api/market/stocks/${symbol}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock: ${response.status}`
    );
  }

  return response.json();
}


export async function getStocks(
  limit = 50,
  offset = 0
) {
  const response = await fetch(
    `${API_URL}/api/market/stocks?limit=${limit}&offset=${offset}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stocks: ${response.status}`
    );
  }

  return response.json();
}


export async function getIndex(symbol: string = "IHSG") {
  const response = await fetch(
    `${API_URL}/api/market/indices`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch index: ${response.status}`
    );
  }

  return response.json();
}


export async function getIndexIntraday(
  symbol: string = "IHSG"
) {
  const response = await fetch(
    `${API_URL}/api/market/indices/${symbol}/intraday`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch index intraday data: ${response.status}`
    );
  }

  return response.json();
}


export async function getIndexHistory(
  symbol: string = "IHSG",
  period: string = "1D",
  interval: string = ""
) {
  const params = new URLSearchParams({ period });
  if (interval) params.set("interval", interval);

  const response = await fetch(
    `${API_URL}/api/market/indices/${symbol}/history?${params.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch index history data: ${response.status}`
    );
  }

  return response.json();
}


export async function getIndexOverview() {
  const response = await fetch(
    `${API_URL}/api/market/indices/overview`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch index overview: ${response.status}`
    );
  }

  return response.json();
}


export async function getMarketMovers(limit = 5) {
  const response = await fetch(
    `${API_URL}/api/market/movers?limit=${limit}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch market movers: ${response.status}`
    );
  }

  return response.json();
}


export async function getMarketBreadth() {
  const response = await fetch(
    `${API_URL}/api/market/breadth`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch market breadth: ${response.status}`
    );
  }

  return response.json();
}


export async function getSectorPerformance() {
  const response = await fetch(
    `${API_URL}/api/market/sectors`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sector performance: ${response.status}`
    );
  }

  return response.json();
}

export async function getSectorAnalytics() {
  const response = await fetch(
    `${API_URL}/api/sectors`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sector analytics: ${response.status}`
    );
  }

  return response.json();
}

export async function getSectorRotation() {
  const response = await fetch(
    `${API_URL}/api/sectors/rotation`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sector rotation: ${response.status}`
    );
  }

  return response.json();
}

export async function runBacktest(params: {
  symbol: string;
  strategy: string;
  initial_capital?: number;
  start_date?: string;
  end_date?: string;
  buy_fee_percent?: number;
  sell_fee_percent?: number;
  slippage_percent?: number;
}) {
  const query = new URLSearchParams();

  query.set("symbol", params.symbol);
  query.set("strategy", params.strategy);
  query.set(
    "initial_capital",
    String(params.initial_capital ?? 100_000_000)
  );

  if (params.start_date) {
    query.set("start_date", params.start_date);
  }

  if (params.end_date) {
    query.set("end_date", params.end_date);
  }

  if (typeof params.buy_fee_percent === "number") {
    query.set(
      "buy_fee_percent",
      String(params.buy_fee_percent)
    );
  }

  if (typeof params.sell_fee_percent === "number") {
    query.set(
      "sell_fee_percent",
      String(params.sell_fee_percent)
    );
  }

  if (typeof params.slippage_percent === "number") {
    query.set(
      "slippage_percent",
      String(params.slippage_percent)
    );
  }

  const response = await fetch(
    `${API_URL}/api/backtest?${query.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail ??
        `Failed to run backtest: ${response.status}`
    );
  }

  return response.json();
}

export async function getStockUniverse(params: {
  search?: string;
  sector?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.sector) {
    query.set("sector", params.sector);
  }

  query.set(
    "limit",
    String(params.limit ?? 200)
  );

  if (params.offset) {
    query.set("offset", String(params.offset));
  }

  const response = await fetch(
    `${API_URL}/api/stocks?${query.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock universe: ${response.status}`
    );
  }

  return response.json();
}

export async function getScreener(params: {
  search?: string;
  sector?: string;
  min_price?: number;
  max_price?: number;
  min_change?: number;
  max_change?: number;
  min_volume?: number;
  hide_no_trade?: boolean;
  trend?: string;
  rsi_min?: number;
  rsi_max?: number;
  macd_signal?: string;
  price_vs_sma20?: string;
  price_vs_sma50?: string;
  price_vs_sma200?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.sector && params.sector !== "ALL") {
    query.set("sector", params.sector);
  }

  if (params.min_price !== undefined) {
    query.set("min_price", String(params.min_price));
  }

  if (params.max_price !== undefined) {
    query.set("max_price", String(params.max_price));
  }

  if (params.min_change !== undefined) {
    query.set("min_change", String(params.min_change));
  }

  if (params.max_change !== undefined) {
    query.set("max_change", String(params.max_change));
  }

  if (params.min_volume !== undefined) {
    query.set("min_volume", String(params.min_volume));
  }

  if (params.hide_no_trade) {
    query.set("hide_no_trade", "true");
  }

  if (params.trend && params.trend !== "ALL") {
    query.set("trend", params.trend);
  }

  if (params.rsi_min !== undefined) {
    query.set("rsi_min", String(params.rsi_min));
  }

  if (params.rsi_max !== undefined) {
    query.set("rsi_max", String(params.rsi_max));
  }

  if (params.macd_signal && params.macd_signal !== "ALL") {
    query.set("macd_signal", params.macd_signal);
  }

  if (
    params.price_vs_sma20 &&
    params.price_vs_sma20 !== "ALL"
  ) {
    query.set(
      "price_vs_sma20",
      params.price_vs_sma20
    );
  }

  if (
    params.price_vs_sma50 &&
    params.price_vs_sma50 !== "ALL"
  ) {
    query.set(
      "price_vs_sma50",
      params.price_vs_sma50
    );
  }

  if (
    params.price_vs_sma200 &&
    params.price_vs_sma200 !== "ALL"
  ) {
    query.set(
      "price_vs_sma200",
      params.price_vs_sma200
    );
  }

  query.set("limit", String(params.limit ?? 50));
  query.set("offset", String(params.offset ?? 0));

  const response = await fetch(
    `${API_URL}/api/screener?${query.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch screener data: ${response.status}`);
  }

  return response.json();
}