import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Security,
  Stock,
  Future,
  Forex,
  SecuritiesFilters,
  SecuritiesPage,
  PriceHistory,
  PricePoint,
  OptionChain,
  StockOption,
  SortConfig,
} from '../models/security.model';

@Injectable({ providedIn: 'root' })
export class SecuritiesService {
  private readonly stocksUrl = `${environment.apiUrl}/stock/api/listings/stocks`;
  private readonly refreshAllUrl = `${environment.apiUrl}/stock/admin/stocks/refresh-all`;

  constructor(private readonly http: HttpClient) {}

  refreshAllStocks(): Observable<any> {
    return this.http.post(`${this.refreshAllUrl}`, {});
  }

  private mapStockItem(item: any): Stock {
    return {
      id: item.listingId,
      ticker: item.ticker ?? '',
      name: item.name ?? '',
      exchange: item.exchangeMICCode ?? '',
      price: item.price ?? 0,
      currency: 'USD',
      change: item.change ?? 0,
      changePercent: item.price > 0 ? ((item.change ?? 0) / item.price) * 100 : 0,
      volume: item.volume ?? 0,
      maintenanceMargin: 0,
      initialMarginCost: item.initialMarginCost ?? 0,
      type: 'STOCK' as const,
      lastUpdated: new Date().toISOString(),
      high: item.price ?? 0,
      low: item.price ?? 0,
      open: item.price ?? 0,
      previousClose: item.price ?? 0,
      bid: item.price ?? 0,
      ask: item.price ?? 0,
    };
  }

  private mapStocksPage(response: any, filters: SecuritiesFilters, page: number, size: number, sort?: SortConfig): SecuritiesPage<Stock> {
    let mapped: Stock[] = (response.content || []).map((item: any) => this.mapStockItem(item));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      mapped = mapped.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
      );
    }

    if (sort) {
      mapped = this.sortArray(mapped, sort);
    }

    return {
      content: mapped,
      totalElements: response.totalElements ?? mapped.length,
      totalPages: response.totalPages ?? Math.ceil(mapped.length / size),
      number: response.number ?? page,
      size: response.size ?? size,
    } as SecuritiesPage<Stock>;
  }

  private buildStockParams(filters: SecuritiesFilters, page: number, size: number): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.exchange)                params = params.set('exchange', filters.exchange);
    if (filters.priceMin !== undefined)  params = params.set('minPrice', filters.priceMin.toString());
    if (filters.priceMax !== undefined)  params = params.set('maxPrice', filters.priceMax.toString());
    if (filters.volumeMin !== undefined) params = params.set('minVolume', filters.volumeMin.toString());
    if (filters.volumeMax !== undefined) params = params.set('maxVolume', filters.volumeMax.toString());
    if (filters.marginMin !== undefined) params = params.set('minMargin', filters.marginMin.toString());
    if (filters.marginMax !== undefined) params = params.set('maxMargin', filters.marginMax.toString());
    if (filters.bidMin !== undefined)    params = params.set('minBid', filters.bidMin.toString());
    if (filters.bidMax !== undefined)    params = params.set('maxBid', filters.bidMax.toString());
    if (filters.askMin !== undefined)    params = params.set('minAsk', filters.askMin.toString());
    if (filters.askMax !== undefined)    params = params.set('maxAsk', filters.askMax.toString());

    return params;
  }

  getStocks(
    filters: SecuritiesFilters = {},
    page = 0,
    size = 10,
    sort?: SortConfig
  ): Observable<SecuritiesPage<Stock>> {
    const params = this.buildStockParams(filters, page, size);
    return this.http.get<any>(`${this.stocksUrl}`, { params }).pipe(
      map(response => this.mapStocksPage(response, filters, page, size, sort))
    );
  }

  getClientStocks(
    filters: SecuritiesFilters = {},
    page = 0,
    size = 10,
    sort?: SortConfig
  ): Observable<SecuritiesPage<Stock>> {
    const params = this.buildStockParams(filters, page, size);
    return this.http.get<any>(`${this.stocksUrl}`, { params }).pipe(
      map(response => this.mapStocksPage(response, filters, page, size, sort))
    );
  }

  /**
   * Helper method to sort array of stocks
   */
  private sortArray(stocks: Stock[], sort: SortConfig): Stock[] {
    return [...stocks].sort((a, b) => {
      const field = sort.field as keyof Stock;
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal === undefined || bVal === undefined) return 0;
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }


  /**
   * Get list of futures with filters and pagination
   */
  getFutures(
    filters: SecuritiesFilters = {},
    page = 0,
    size = 10,
    sort?: SortConfig
  ): Observable<SecuritiesPage<Future>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sort?.field || 'ticker')
      .set('sortDirection', sort?.direction || 'asc');

    // Apply search filter if provided
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    // Apply date filters
    if (filters.settlementDateFrom) {
      params = params.set('settlementDateFrom', filters.settlementDateFrom);
    }
    if (filters.settlementDateTo) {
      params = params.set('settlementDateTo', filters.settlementDateTo);
    }

    // Apply price filters
    if (filters.priceMin !== undefined) {
      params = params.set('priceMin', filters.priceMin.toString());
    }
    if (filters.priceMax !== undefined) {
      params = params.set('priceMax', filters.priceMax.toString());
    }

    // Apply margin filters
    if (filters.marginMin !== undefined) {
      params = params.set('marginMin', filters.marginMin.toString());
    }
    if (filters.marginMax !== undefined) {
      params = params.set('marginMax', filters.marginMax.toString());
    }

    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/futures`, { params }).pipe(
      map(response => ({
        ...response,
        content: response.content.map((item: any) => {
          // Handle zero/null prices
          const price = item.price || 1.0;
          const change = item.change || 0;
          const changePercent = price > 0 ? (change / price) * 100 : 0;
          
          return {
            id: item.listingId,
            ticker: item.ticker,
            name: item.name,
            exchange: item.exchangeMICCode,
            price: price,
            currency: 'USD',
            change: change,
            changePercent: changePercent,
            volume: item.volume || 0,
            maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
            initialMarginCost: item.initialMarginCost || 0,
            type: 'FUTURE' as const,
            lastUpdated: new Date().toISOString(),
            settlementDate: item.settlementDate,
            contractSize: 1,
            openInterest: 0,
            high: price * 1.02,
            low: price * 0.98,
            open: price,
            previousClose: price - change,
            bid: price > 0 ? price - 0.01 : 0.99,
            ask: price > 0 ? price + 0.01 : 1.01,
          } as Future;
        })
      }))
    );
  }

  /**
   * Get list of forex pairs with filters and pagination
   */
  getForex(
    filters: SecuritiesFilters = {},
    page = 0,
    size = 10,
    sort?: SortConfig
  ): Observable<SecuritiesPage<Forex>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sort?.field || 'ticker')
      .set('sortDirection', sort?.direction || 'asc');

    // Apply search filter if provided
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    // Apply price filters
    if (filters.priceMin !== undefined) {
      params = params.set('priceMin', filters.priceMin.toString());
    }
    if (filters.priceMax !== undefined) {
      params = params.set('priceMax', filters.priceMax.toString());
    }

    // Apply bid/ask filters
    if (filters.bidMin !== undefined) {
      params = params.set('bidMin', filters.bidMin.toString());
    }
    if (filters.bidMax !== undefined) {
      params = params.set('bidMax', filters.bidMax.toString());
    }
    if (filters.askMin !== undefined) {
      params = params.set('askMin', filters.askMin.toString());
    }
    if (filters.askMax !== undefined) {
      params = params.set('askMax', filters.askMax.toString());
    }

    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/forex`, { params }).pipe(
      map(response => ({
        ...response,
        content: response.content.map((item: any) => {
          // Handle zero/null prices
          const price = item.price || 1.0;
          const change = item.change || 0;
          const changePercent = price > 0 ? (change / price) * 100 : 0;
          
          return {
            id: item.listingId,
            ticker: item.ticker,
            name: item.name,
            exchange: item.exchangeMICCode,
            price: price,
            currency: 'USD',
            change: change,
            changePercent: changePercent,
            volume: item.volume || 0,
            maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
            initialMarginCost: item.initialMarginCost || 0,
            type: 'FOREX' as const,
            lastUpdated: new Date().toISOString(),
            baseCurrency: item.ticker.split('/')[0] || 'USD',
            quoteCurrency: item.ticker.split('/')[1] || 'USD',
            bid: price > 0 ? price - 0.0001 : 0.9999,
            ask: price > 0 ? price + 0.0001 : 1.0001,
            spread: 0.0002,
            high: price * 1.01,
            low: price * 0.99,
            open: price,
            previousClose: price - change,
          } as Forex;
        })
      }))
    );
  }

  getStockById(id: number, period: string = 'DAY'): Observable<Stock> {
    const params = new HttpParams().set('period', period.toUpperCase());
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${id}`, { params }).pipe(
      map((item: any) => ({
        id: item.listingId,
        ticker: item.ticker ?? '',
        name: item.name ?? '',
        exchange: item.exchangeMICCode ?? '',
        price: item.price ?? 0,
        currency: 'USD',
        change: item.change ?? 0,
        changePercent: item.changePercent ?? 0,
        volume: item.volume ?? 0,
        maintenanceMargin: 0,
        initialMarginCost: item.initialMarginCost ?? 0,
        type: 'STOCK' as const,
        lastUpdated: item.lastRefresh ?? new Date().toISOString(),
        high: item.price ?? 0,
        low: item.price ?? 0,
        open: item.price ?? 0,
        previousClose: item.price ?? 0,
        bid: item.bid ?? 0,
        ask: item.ask ?? 0,
        dividendYield: item.stockDetails?.dividendYield ?? undefined,
        dollarVolume: item.dollarVolume ?? undefined,
        outstandingShares: item.stockDetails?.outstandingShares ?? undefined,
        contractSize: item.stockDetails?.contractSize ?? undefined,
        priceHistory: (item.priceHistory ?? []).map((p: any) => ({
          date: p.date,
          price: p.price,
          volume: p.volume,
          change: p.change,
          changePercent: p.changePercent,
          dollarVolume: p.dollarVolume,
        })),
      } as Stock))
    );
  }

  /**
   * Get future by id (listingId)
   */
  getFutureById(id: number): Observable<Future> {
    const params = new HttpParams().set('period', 'MONTH');
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${id}`, { params }).pipe(
      map((item: any) => {
        // Handle zero/null prices
        const price = item.price || 1.0;
        const change = item.change || 0;
        const changePercent = price > 0 ? (change / price) * 100 : 0;
        
        return {
          id: item.listingId,
          ticker: item.ticker,
          name: item.name,
          exchange: item.exchangeMICCode,
          price: price,
          currency: 'USD',
          change: change,
          changePercent: changePercent,
          volume: item.volume || 0,
          maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
          initialMarginCost: item.initialMarginCost || 0,
          type: 'FUTURE' as const,
          lastUpdated: new Date().toISOString(),
          settlementDate: item.settlementDate,
          contractSize: 1,
          openInterest: 0,
          high: price * 1.02,
          low: price * 0.98,
          open: price,
          previousClose: price - change,
          bid: price > 0 ? price - 0.01 : 0.99,
          ask: price > 0 ? price + 0.01 : 1.01,
        } as Future;
      })
    );
  }

  /**
   * Get forex by id (listingId)
   */
  getForexById(id: number): Observable<Forex> {
    const params = new HttpParams().set('period', 'MONTH');
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${id}`, { params }).pipe(
      map((item: any) => {
        // Handle zero/null prices
        const price = item.price || 1.0;
        const change = item.change || 0;
        const changePercent = price > 0 ? (change / price) * 100 : 0;
        
        return {
          id: item.listingId,
          ticker: item.ticker,
          name: item.name,
          exchange: item.exchangeMICCode,
          price: price,
          currency: 'USD',
          change: change,
          changePercent: changePercent,
          volume: item.volume || 0,
          maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
          initialMarginCost: item.initialMarginCost || 0,
          type: 'FOREX' as const,
          lastUpdated: new Date().toISOString(),
          baseCurrency: item.ticker.split('/')[0],
          quoteCurrency: item.ticker.split('/')[1],
          bid: price > 0 ? price - 0.0001 : 0.9999,
          ask: price > 0 ? price + 0.0001 : 1.0001,
          spread: 0.0002,
          high: price * 1.01,
          low: price * 0.99,
          open: price,
          previousClose: price - change,
        } as Forex;
      })
    );
  }

  /**
   * Get price history for a security
   */
  getPriceHistory(ticker: string, period: string): Observable<PriceHistory> {
    // Map period from component format to API format
    const periodMap: Record<string, string> = {
      'day': 'DAY',
      'week': 'WEEK',
      'month': 'MONTH',
      'year': 'YEAR',
      '5year': 'FIVE_YEARS',
      'all': 'ALL'
    };

    const apiPeriod = periodMap[period] || 'MONTH';

    // Extract listing id from ticker (ticker contains the id in this context)
    const listingId = ticker;

    const params = new HttpParams().set('period', apiPeriod);

    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${listingId}`, { params }).pipe(
      map((response: any) => {
        // Map the response to PriceHistory format
        const priceData = response.priceHistory ? response.priceHistory.map((point: any) => ({
          date: point.date,
          price: point.price,
          volume: point.volume || 0
        })) : [];
        return {
          ticker: response.ticker || ticker,
          period: period,
          data: priceData
        } as PriceHistory;
      })
    );
  }

  /**
   * Get option chain for a stock from backend optionGroups
   * Note: ticker parameter is expected to be the stock id
   */
  getOptionChain(ticker: string, settlementDate: string): Observable<OptionChain> {
    const params = new HttpParams().set('period', 'DAY');
    
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${ticker}`, { params }).pipe(
      map((response: any) => {
        // Extract optionGroups and find matching settlement date
        const optionGroups = response.optionGroups || [];
        const matching = optionGroups.find((og: any) => og.settlementDate === settlementDate);

        if (!matching) {
          return {
            settlementDate,
            daysToExpiry: 0,
            calls: [],
            puts: [],
            strikes: []
          } as OptionChain;
        }

        const expiry = new Date(settlementDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const mapOption = (opt: any, type: 'CALL' | 'PUT'): StockOption => ({
          strike: opt.strikePrice ?? opt.strike ?? 0,
          type,
          last: opt.last ?? 0,
          theta: opt.theta ?? 0,
          bid: opt.bid ?? 0,
          ask: opt.ask ?? 0,
          volume: opt.volume ?? 0,
          openInterest: opt.openInterest ?? 0,
          inTheMoney: opt.inTheMoney ?? false,
        });

        const calls = (matching.calls ?? []).map((opt: any) => mapOption(opt, 'CALL'));
        const puts = (matching.puts ?? []).map((opt: any) => mapOption(opt, 'PUT'));
        const allStrikes = [...new Set([
          ...calls.map((c: StockOption) => c.strike),
          ...puts.map((p: StockOption) => p.strike),
        ])].sort((a: any, b: any) => a - b);

        return {
          settlementDate: matching.settlementDate,
          daysToExpiry,
          calls,
          puts,
          strikes: allStrikes,
        } as OptionChain;
      })
    );
  }

  /**
   * Get available settlement dates for options from backend optionGroups
   * Note: ticker parameter is expected to be the stock id
   */
  getOptionSettlementDates(ticker: string): Observable<string[]> {
    const params = new HttpParams().set('period', 'DAY');
    
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${ticker}`, { params }).pipe(
      map((response: any) => {
        const optionGroups = response.optionGroups || [];
        const dates = optionGroups
          .map((og: any) => og.settlementDate)
          .filter((date: string | null) => date !== null && date !== undefined)
          .sort();
        return dates;
      })
    );
  }
}
