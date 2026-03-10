import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

type LoginResponse = { token: string; permissions: string[] };
type RefreshResponse = { token: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'loggedUser';

  constructor(private router: Router, private http: HttpClient) {}

  /**
   * Prijavljuje korisnika sa email-om i lozinkom.
   * Nakon uspešnog logina, JWT token i podaci o korisniku se čuvaju u localStorage.
   * @param email - Email adresa korisnika
   * @param password - Lozinka korisnika
   * @returns Observable sa JWT tokenom i listom permisija
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify({ email, permissions: res.permissions }));
        }),
        catchError(err => throwError(() => err))
      );
  }

  /**
   * Odjavljuje korisnika tako što briše JWT token i podatke o korisniku iz localStorage,
   * a zatim preusmerava na login stranicu.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Osvežava JWT token slanjem zahteva na refresh endpoint.
   * Novi token se automatski čuva u localStorage.
   * U slučaju greške, korisnik se odjavljuje.
   * @returns Observable sa novim JWT tokenom
   */
  refreshToken(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, {})
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
        }),
        catchError(err => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /**
   * Proverava da li je korisnik trenutno autentifikovan
   * na osnovu prisustva JWT tokena u localStorage.
   * @returns true ako token postoji, false inače
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Vraća podatke o ulogovanom korisniku iz localStorage.
   * @returns Objekat sa email-om i permisijama, ili null ako korisnik nije ulogovan
   */
  getLoggedUser(): { email: string; permissions: string[] } | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Proverava da li ulogovani korisnik ima određenu permisiju.
   * @param permission - Naziv permisije koja se proverava
   * @returns true ako korisnik ima permisiju, false inače
   */
  hasPermission(permission: string): boolean {
    const user = this.getLoggedUser();
    return !!user?.permissions?.includes(permission);
  }
}
