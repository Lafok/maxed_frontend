/**
 * This file centralizes all TypeScript type definitions for the application.
 * These types are designed to perfectly match the DTOs sent by the backend API.
 */

export interface UserSummary {
  id: number;
  username: string;
  isOnline: boolean;
}

export interface Message {
  id: number;
  content: string;
  timestamp: string;
  author: UserSummary;
}


export interface Chat {
  id: number;
  name: string | null;
  type: 'DIRECT' | 'GROUP';
  participants: UserSummary[];
  latestMessage?: Message;
}

export interface StatusUpdateMessage {
    userId: number;
    isOnline: boolean;
}
