import { 
  Home, 
  Car, 
  Gamepad2, 
  Briefcase, 
  HelpCircle, 
  ShoppingBag, 
  Utensils, 
  HeartPulse, 
  GraduationCap, 
  Wrench,
  TrendingUp,
  Receipt,
  Wallet,
  Landmark,
  Coins
} from 'lucide-react-native';

/**
 * Strips emoji prefixes or suffixes from category or account names.
 */
export function stripEmoji(name: string): string {
  if (!name) return '';
  // Match common emoji ranges and clean up double spaces
  return name
    .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps a category name to a Lucide icon.
 */
export function getCategoryIcon(name: string) {
  const cleanName = stripEmoji(name).toLowerCase();
  
  if (cleanName.includes('living') || cleanName.includes('rent') || cleanName.includes('home') || cleanName.includes('house') || cleanName.includes('stay')) {
    return Home;
  }
  if (cleanName.includes('transport') || cleanName.includes('car') || cleanName.includes('uber') || cleanName.includes('fuel') || cleanName.includes('ride') || cleanName.includes('taxi')) {
    return Car;
  }
  if (cleanName.includes('entertainment') || cleanName.includes('game') || cleanName.includes('movie') || cleanName.includes('fun') || cleanName.includes('play') || cleanName.includes('netflix')) {
    return Gamepad2;
  }
  if (cleanName.includes('salary') || cleanName.includes('income') || cleanName.includes('pay') || cleanName.includes('deposit')) {
    return TrendingUp;
  }
  if (cleanName.includes('food') || cleanName.includes('grocery') || cleanName.includes('groceries') || cleanName.includes('restaurant') || cleanName.includes('dining') || cleanName.includes('eat')) {
    return Utensils;
  }
  if (cleanName.includes('health') || cleanName.includes('medical') || cleanName.includes('gym') || cleanName.includes('doctor') || cleanName.includes('medicine')) {
    return HeartPulse;
  }
  if (cleanName.includes('education') || cleanName.includes('school') || cleanName.includes('book') || cleanName.includes('class')) {
    return GraduationCap;
  }
  if (cleanName.includes('utilities') || cleanName.includes('electricity') || cleanName.includes('water') || cleanName.includes('token') || cleanName.includes('bill') || cleanName.includes('kplc')) {
    return Receipt;
  }
  if (cleanName.includes('shopping') || cleanName.includes('cloth') || cleanName.includes('store')) {
    return ShoppingBag;
  }
  if (cleanName.includes('maintenance') || cleanName.includes('repair') || cleanName.includes('fix')) {
    return Wrench;
  }
  return HelpCircle;
}

/**
 * Maps an account name to a Lucide icon.
 */
export function getAccountIcon(name: string) {
  const cleanName = stripEmoji(name).toLowerCase();
  
  if (cleanName.includes('mpesa') || cleanName.includes('m-pesa') || cleanName.includes('mobile') || cleanName.includes('wallet')) {
    return Wallet;
  }
  if (cleanName.includes('bank') || cleanName.includes('equity') || cleanName.includes('kcb') || cleanName.includes('coop') || cleanName.includes('standard')) {
    return Landmark;
  }
  if (cleanName.includes('cash')) {
    return Coins;
  }
  return Wallet;
}
