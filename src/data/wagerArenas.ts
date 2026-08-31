export interface WagerTier {
  id: 'rookie' | 'pro' | 'champion' | 'legend';
  name: string;
  entryFee: number;
  prizePot: number;
  bonusCoins?: number;
  bonusBadge?: string;
  bonusDescription?: string;
  badge: string;
  themeColor: string;
  cardColor: string;
  accentGradient: string;
  buttonGradient: string;
  icon: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export const WAGER_TIERS: WagerTier[] = [
  {
    id: 'rookie',
    name: 'Rookie Arena',
    entryFee: 25,
    prizePot: 50,
    bonusCoins: 0,
    badge: 'STARTER STAKES',
    themeColor: '#f59e0b',
    cardColor: 'bg-amber-50',
    accentGradient: 'from-amber-400 to-orange-400',
    buttonGradient: 'from-amber-400 to-orange-400',
    icon: 'bronze',
  },
  {
    id: 'pro',
    name: 'Pro Arena',
    entryFee: 100,
    prizePot: 200,
    bonusCoins: 0,
    badge: 'COMPETITIVE',
    themeColor: '#3b82f6',
    cardColor: 'bg-sky-50',
    accentGradient: 'from-sky-400 to-blue-500',
    buttonGradient: 'from-sky-400 to-blue-500',
    icon: 'silver',
  },
  {
    id: 'champion',
    name: 'Champion Arena',
    entryFee: 500,
    prizePot: 1000,
    bonusCoins: 250,
    bonusBadge: '+250 WIN BONUS',
    bonusDescription: 'Special Stage Reward: Winner takes 1,000 pot + 250 bonus coins!',
    badge: 'HIGH ROLLER + BONUS',
    themeColor: '#a855f7',
    cardColor: 'bg-purple-50',
    accentGradient: 'from-purple-400 to-fuchsia-500',
    buttonGradient: 'from-purple-400 to-fuchsia-500',
    icon: 'gold',
  },
  {
    id: 'legend',
    name: 'Legend Arena',
    entryFee: 2500,
    prizePot: 5000,
    bonusCoins: 1500,
    bonusBadge: '+1,500 MEGA BONUS',
    bonusDescription: 'Apex Stage Reward: Winner takes 5,000 pot + 1,500 mega bonus coins!',
    badge: 'APEX MEGA BONUS',
    themeColor: '#eab308',
    cardColor: 'bg-yellow-50',
    accentGradient: 'from-amber-300 via-yellow-400 to-amber-500',
    buttonGradient: 'from-amber-300 via-yellow-400 to-amber-500',
    icon: 'diamond',
  },
];
