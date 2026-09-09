const API_URL =
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
