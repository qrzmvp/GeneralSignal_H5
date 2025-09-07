// Mapping of trader names to external avatar URLs (from user's list)
// If a name is not found, fall back to pravatar seeded by the name.

export const TRADER_AVATAR_MAP: Record<string, string> = {
  'WWG-Woods': 'https://i.pravatar.cc/150?u=wwg-woods',
  'WWG-Jonh': 'https://i.pravatar.cc/150?u=jonh',
  'WWG-Hbj': 'https://i.pravatar.cc/150?u=hbj',
  '量化大师': 'https://i.pravatar.cc/150?u=quant',
  '趋势猎人': 'https://i.pravatar.cc/150?u=hunter',
  '波段之王': 'https://i.pravatar.cc/150?u=swing',
  '合约常胜军': 'https://i.pravatar.cc/150?u=futures',
  'BTC信仰者': 'https://i.pravatar.cc/150?u=btc',
  '短线快枪手': 'https://i.pravatar.cc/150?u=quick',
  'ETH布道者': 'https://i.pravatar.cc/150?u=eth',
  'Alpha Seeker': 'https://i.pravatar.cc/150?u=alpha',
  '狙击涨停板': 'https://i.pravatar.cc/150?u=limit-up',
  '抄底王': 'https://i.pravatar.cc/150?u=dip',
  '币圈巴菲特': 'https://i.pravatar.cc/150?u=buffett',
}

export function getTraderAvatar(name: string) {
  return TRADER_AVATAR_MAP[name] || `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`
}
