/**
 * Enum tipova notifikacija
 */
export enum NotificationType {
  PAYMENT = 'PAYMENT',                    // Izvršeno plaćanje
  TRANSFER = 'TRANSFER',                  // Izvršen transfer
  LIMIT_CHANGE = 'LIMIT_CHANGE',         // Promena limita
  CARD_BLOCKED = 'CARD_BLOCKED',         // Blokiranje kartice
  LOAN_CREATED = 'LOAN_CREATED',         // Kreiranje kredita
  LOAN_APPROVED = 'LOAN_APPROVED',       // Odobravanje kredita
  LOAN_REJECTED = 'LOAN_REJECTED',       // Odbijanje kredita
}

/**
 * Enum statusa notifikacija
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Model notifikacije
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  timestamp: Date;
  data?: any;
  actionUrl?: string;
}

/**
 * DTO za dodavanje notifikacije
 */
export interface AddNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
}

/**
 * Response objekat za notifikacije
 */
export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}
