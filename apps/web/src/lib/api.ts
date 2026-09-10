export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


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

export async function getIndexIntraday(symbol: string = "IHSG") {
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
