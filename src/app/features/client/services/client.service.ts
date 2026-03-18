import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { of, delay } from 'rxjs'; 

export interface ClientDto {
  id: string | number;
  ime?: string;
  prezime?: string;
  datumRodjenja?: number;
  pol?: string;
  email?: string;
  brojTelefona?: string;
  adresa?: string;
}

export interface ClientFilters {
  ime?: string;
  prezime?: string;
  email?: string;
}

export interface ClientPageResponse {
  content: ClientDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly base = `${environment.clientApiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<ClientDto[]> {
    const page = 0;
    const size = 1000;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ClientPageResponse | ClientDto[]>(this.base, { params })
      .pipe(map((response) => this.normalizePageResponse(response, page, size).content));
  }

  getClients(filters: ClientFilters = {}, page = 0, size = 10): Observable<ClientPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.ime?.trim()) {
      params = params.set('ime', filters.ime.trim());
    }

    if (filters.prezime?.trim()) {
      params = params.set('prezime', filters.prezime.trim());
    }

    if (filters.email?.trim()) {
      params = params.set('email', filters.email.trim());
    }

    return this.http
      .get<ClientPageResponse>(this.base, { params })
      .pipe(map((response) => this.normalizePageResponse(response, page, size)));
      
  }

  getClientById(id: string): Observable<any> {
    return of({ success: true }).pipe(delay(500));
  }

  updateClient(id: string, data: any): Observable<any> {
    return of({ success: true }).pipe(delay(500));
  }

  searchClients(query: string, page = 0, size = 10): Observable<ClientPageResponse> {
    const params = new HttpParams()
      .set('query', query.trim())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ClientPageResponse | ClientDto[]>(`${this.base}/search`, { params })
      .pipe(map((response) => this.normalizePageResponse(response, page, size)));
  }

  private normalizePageResponse(
    response: ClientPageResponse | ClientDto[],
    page: number,
    size: number
  ): ClientPageResponse {
    const content = Array.isArray(response) ? response : response.content ?? [];
    const totalElements = Array.isArray(response) ? content.length : response.totalElements ?? content.length;
    const resolvedSize = Array.isArray(response) ? size : response.size ?? size;
    const totalPages = Array.isArray(response)
      ? (totalElements === 0 ? 0 : Math.ceil(totalElements / resolvedSize))
      : response.totalPages ?? (totalElements === 0 ? 0 : Math.ceil(totalElements / resolvedSize));

    return {
      content,
      totalElements,
      totalPages,
      number: Array.isArray(response) ? page : response.number ?? page,
      size: resolvedSize
    };
  }
}
