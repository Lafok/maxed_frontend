/**
 * This file centralizes all TypeScript type definitions for the application.
 * These types are designed to perfectly match the DTOs sent by the backend API.
 */

// Represents a user's summary, used within other data structures.
// Matches: UserSummaryResponse.java
export interface UserSummary {
  id: number;
  username: string;
}

// Represents a single chat message.
// Matches: MessageResponse.java
export interface Message {
  id: number;
  content: string;
  timestamp: string; // ISO 8601 date string
  author: UserSummary; // A message author is always represented as a summary.
}

// Represents the detailed structure of a chat.
// Matches: ChatResponse.java
export interface Chat {
  id: number;
  name: string | null;
  type: 'DIRECT' | 'GROUP';
  participants: UserSummary[];
  latestMessage?: Message; // This field is crucial for the UI and is provided by an optimized backend query.
}
