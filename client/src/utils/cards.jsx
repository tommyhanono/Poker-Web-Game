const SUIT_SYMBOLS = { h: '♥', d: '♦', c: '♣', s: '♠' };
const SUIT_COLORS = { h: 'red', d: 'red', c: 'black', s: 'black' };

export function parseCard(code) {
  if (!code || code === 'back') return null;
  const rank = code.slice(0, -1);
  const suit = code.slice(-1);
  return {
    rank: rank === 'T' ? '10' : rank,
    suit: SUIT_SYMBOLS[suit] || suit,
    color: SUIT_COLORS[suit] || 'black',
    raw: code,
  };
}

export function CardDisplay({ code, size = 'md', faceDown = false }) {
  if (faceDown || code === 'back') {
    const sizes = { sm: 'w-8 h-12 text-xs', md: 'w-12 h-16 text-sm', lg: 'w-16 h-22 text-base' };
    return (
      <div className={`card card-back ${sizes[size]}`} />
    );
  }

  const card = parseCard(code);
  if (!card) return null;

  const sizes = { sm: 'w-8 h-12 text-xs', md: 'w-12 h-16 text-sm', lg: 'w-14 h-20 text-base' };
  const colorClass = card.color === 'red' ? 'card-red' : 'card-black';

  return (
    <div className={`card card-face ${sizes[size]} ${colorClass} flex-col gap-0`} style={{ padding: '2px' }}>
      <span className="leading-none font-bold" style={{ fontSize: size === 'lg' ? '1rem' : '0.8rem' }}>{card.rank}</span>
      <span className="leading-none" style={{ fontSize: size === 'lg' ? '1.1rem' : '0.9rem' }}>{card.suit}</span>
    </div>
  );
}
