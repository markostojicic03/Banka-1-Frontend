import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

/**
 * Mapa permisija po rolama zaposlenih.
 * Koristi se kao fallback ukoliko backend ne vrati permisije direktno.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Basic: [
    'BANKING_BASIC',
    'CLIENT_MANAGE'
  ],
  Agent: [
    'BANKING_BASIC',
    'CLIENT_MANAGE',
    'SECURITIES_TRADE_LIMITED'
  ],
  Supervisor: [
    'BANKING_BASIC',
    'CLIENT_MANAGE',
    'SECURITIES_TRADE_LIMITED',
    'SECURITIES_TRADE_UNLIMITED',
    'TRADE_UNLIMITED',
    'OTC_TRADE',
    'FUND_AGENT_MANAGE'
  ],
  Admin: [
    'BANKING_BASIC',
    'CLIENT_MANAGE',
    'SECURITIES_TRADE_LIMITED',
    'SECURITIES_TRADE_UNLIMITED',
    'TRADE_UNLIMITED',
    'OTC_TRADE',
    'FUND_AGENT_MANAGE',
    'EMPLOYEE_MANAGE_ALL'
  ]
};

/**
 * Guard koji proverava da li ulogovani korisnik ima potrebnu permisiju za pristup ruti.
 * Permisije se čitaju direktno iz localStorage, ili se određuju na osnovu role korisnika.
 * Ukoliko korisnik nema odgovarajuću permisiju, preusmerava ga na /403 stranicu.
 * @param route - Aktivna ruta koja sadrži podatak o potrebnoj permisiji (data.permission)
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const user = localStorage.getItem('loggedUser');

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const parsedUser: { email: string; role: string; permissions: string[] } = JSON.parse(user);
  const requiredPermission: string = route.data['permission'];

  // Ako ruta nema definisanu permisiju, propusti
  if (!requiredPermission) return true;

  // Koristimo permisije iz tokena, a ako su prazne ili nedostaju, uzimamo permisije po roli
  const userPermissions = (parsedUser.permissions && parsedUser.permissions.length > 0) ?
    parsedUser.permissions :
    ROLE_PERMISSIONS[parsedUser.role] ?? [];

  if (!userPermissions.includes(requiredPermission)) {
    router.navigate(['/403']);
    return false;
  }

  return true;
};
