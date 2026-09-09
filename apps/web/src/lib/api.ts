const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
