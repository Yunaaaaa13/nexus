import httpx

from app.services.market_data.base import MarketDataProvider


class FreeMarketDataProvider(MarketDataProvider):
    # api.goapi.io is the active API gateway endpoint for GoAPI
    BASE_URL = "https://api.goapi.io"

    async def get_stock(self, symbol: str):
        url = f"{self.BASE_URL}/stock/idx/{symbol}"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()

    async def get_stock_history(self, symbol: str):
        url = f"{self.BASE_URL}/stock/idx/{symbol}/historical"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()

    async def get_index(self, symbol: str):
        url = f"{self.BASE_URL}/stock/idx/indices"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            return data

    async def get_top_gainers(self):
        url = f"{self.BASE_URL}/stock/idx/top_gainer"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()

    async def get_top_losers(self):
        url = f"{self.BASE_URL}/stock/idx/top_loser"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
