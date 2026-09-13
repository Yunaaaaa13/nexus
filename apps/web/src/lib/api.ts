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

export async function getScreener(params: {
  search?: string;
  sector?: string;
  min_price?: number;
  max_price?: number;
  min_change?: number;
  max_change?: number;
  min_volume?: number;
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