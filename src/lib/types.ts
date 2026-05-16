export interface User {
  id: string;
  username: string;
  created_at: string;
  total_clicks: number;
  xp_balance: number;
  status: 'active' | 'banned';
}

export interface ClickSession {
  id: string;
  user_id: string;
  clicks: number;
  timestamp: string;
}

export interface GameSetting {
  key: string;
  value: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  clicks_spent: number;
  xp_received: number;
  timestamp: string;
}

export interface ClickResponse {
  success: boolean;
  clicks?: number;
  message: string;
  points?: number;
}

export interface SwapResponse {
  success: boolean;
  xpGained?: number;
  remainingClicks?: number;
  message: string;
}

export interface GameSettings {
  points_per_click: string;
  daily_click_limit: string;
  click_cooldown_ms: string;
  click_to_xp_rate: string;
  maintenance_mode: string;
}

export interface DailyProgress {
  clicksToday: number;
  dailyLimit: number;
  points: number;
}