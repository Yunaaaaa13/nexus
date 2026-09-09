from abc import ABC, abstractmethod


class MarketDataProvider(ABC):

    @abstractmethod
    def get_stock(self, symbol: str):
        pass

    @abstractmethod
    def get_stock_history(self, symbol: str):
        pass

    @abstractmethod
    def get_index(self, symbol: str):
        pass

    @abstractmethod
    def get_index_intraday(self, symbol: str, interval: str = "5m"):
        pass

    @abstractmethod
    def get_index_overview(self, symbol: str):
        pass


    @abstractmethod
    def get_top_gainers(self):
        pass

    @abstractmethod
    def get_top_losers(self):
        pass
