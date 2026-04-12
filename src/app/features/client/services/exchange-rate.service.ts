import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ExchangeRate {
  currency: string;
  name: string;
  flag: string;
  buyRate: number;
  sellRate: number;
  middleRate: number;
}

export interface ExchangeRatesResult {
  rates: ExchangeRate[];
  lastUpdated: Date;
}

// TODO: uskladiti tačnu vrednost sa backend timom
const SELL_COMMISSION = 0.01;
const BUY_COMMISSION  = 0.01;

const CURRENCY_META: Record<string, { name: string; flag: string }> = {
  EUR: { name: 'Euro',               flag: '🇪🇺' },
  CHF: { name: 'Švajcarski franak',  flag: '🇨🇭' },
  USD: { name: 'Američki dolar',     flag: '🇺🇸' },
  GBP: { name: 'Funta sterlinga',    flag: '🇬🇧' },
  JPY: { name: 'Japanski jen',       flag: '🇯🇵' },
  CAD: { name: 'Kanadski dolar',     flag: '🇨🇦' },
  AUD: { name: 'Australijski dolar', flag: '🇦🇺' },
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_META);

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {

  private readonly API_URL = `${environment.apiUrl}/exchange/rates`;

  /** Keširani rezultat da se ne pravi dupli API poziv */
  private cache$: Observable<ExchangeRatesResult> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Dohvata kurseve sa eksternog API servisa.
   * Rezultat se kešira tokom sesije (shareReplay).
   */
  getRates(): Observable<ExchangeRatesResult> {
    if (!this.cache$) {
      this.cache$ = this.http.get<any>(this.API_URL).pipe(
        map(res => this.mapResponse(res)),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  /**
   * Mapira API odgovor u interni model.
   * Backend vraća kurseve direktno ili u obliku relevantnih vrednosti.
   */
  private mapResponse(res: any): ExchangeRatesResult {
    console.log('Exchange rates response from backend:', res);
    
    // Direktan niz sa novim backend formatom (currencyCode, buyingRate, sellingRate)
    if (Array.isArray(res)) {
      const rates: ExchangeRate[] = res
        .filter((rate: any) => 
          rate.currencyCode && rate.buyingRate !== undefined && rate.sellingRate !== undefined
        )
        .map((rate: any) => ({
          currency: rate.currencyCode,
          name: CURRENCY_META[rate.currencyCode]?.name || rate.currencyCode,
          flag: CURRENCY_META[rate.currencyCode]?.flag || '',
          buyRate: rate.buyingRate,
          sellRate: rate.sellingRate,
          middleRate: (rate.buyingRate + rate.sellingRate) / 2,
        }));
      
      if (rates.length === 0) {
        throw new Error('Nema validnih kurseva u API odgovoru');
      }

      return {
        rates,
        lastUpdated: res[0]?.createdAt ? new Date(res[0].createdAt) : new Date(),
      };
    }

    // Ako backend vraća nizom u očekivanom formatu sa starijom strukturom
    if (res.rates && Array.isArray(res.rates)) {
      const rates = res.rates.filter((rate: any) => 
        rate.currency && rate.buyRate !== undefined && rate.sellRate !== undefined
      );
      
      if (rates.length === 0) {
        throw new Error('Nema validnih kurseva u API odgovoru');
      }

      return {
        rates,
        lastUpdated: res.lastUpdated ? new Date(res.lastUpdated) : new Date(),
      };
    }

    // Ako backend vraća kurseve kao objekt (kao external API)
    if (res.rates && typeof res.rates === 'object' && !Array.isArray(res.rates)) {
      const ratesInRSD: Record<string, number> = res.rates;

      const rates: ExchangeRate[] = SUPPORTED_CURRENCIES
        .filter(code => code in ratesInRSD && ratesInRSD[code] > 0)
        .map(code => {
          const middleRate = 1 / ratesInRSD[code];
          const sellRate   = middleRate * (1 + SELL_COMMISSION);
          const buyRate    = middleRate * (1 - BUY_COMMISSION);
          return {
            currency: code,
            name:     CURRENCY_META[code].name,
            flag:     CURRENCY_META[code].flag,
            buyRate,
            sellRate,
            middleRate,
          };
        });

      if (rates.length === 0) {
        throw new Error('Nema validnih kurseva u API odgovoru');
      }

      return {
        rates,
        lastUpdated: new Date(res.time_last_update_utc ?? Date.now()),
      };
    }

    throw new Error('Nevaljani format API odgovora');
  }

  /**
   * Pronalazi kurs za datu valutu.
   * Baca grešku ako valuta nije podržana.
   */
  private findRate(code: string, rates: ExchangeRate[]): ExchangeRate {
    const rate = rates.find(r => r.currency === code);
    if (!rate) {
      throw new Error(`Valuta ${code} nije podržana`);
    }
    return rate;
  }

  /**
   * Konvertuje iznos iz jedne valute u drugu.
   * Banka uvek koristi prodajni kurs za toCurrency.
   * Konverzija između dve strane valute ide kroz RSD:
   *   strana → RSD (kupovni kurs) → strana (prodajni kurs)
   */
  convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: ExchangeRate[]
  ): { result: number; usedRate: number } {
    if (fromCurrency === toCurrency) return { result: amount, usedRate: 1 };

    if (fromCurrency === 'RSD') {
      const to = this.findRate(toCurrency, rates);
      return { result: amount / to.sellRate, usedRate: to.sellRate };
    }

    if (toCurrency === 'RSD') {
      const from = this.findRate(fromCurrency, rates);
      return { result: amount * from.buyRate, usedRate: from.buyRate };
    }

    // Strana → Strana: kroz RSD
    const from  = this.findRate(fromCurrency, rates);
    const to    = this.findRate(toCurrency, rates);
    const inRSD = amount * from.buyRate;
    return { result: inRSD / to.sellRate, usedRate: to.sellRate };
  }
}
