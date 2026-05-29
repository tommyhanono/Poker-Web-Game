const SUIT_SYMBOLS = { h: '♥', d: '♦', c: '♣', s: '♠' };
const SUIT_COLORS  = { h: 'red', d: 'red', c: 'black', s: 'black' };

export function parseCard(code) {
  if (!code || code === 'back') return null;
  const rank = code.slice(0, -1);
  const suit = code.slice(-1);
  return {
    rank:  rank === 'T' ? '10' : rank,
    suit:  SUIT_SYMBOLS[suit] || suit,
    color: SUIT_COLORS[suit]  || 'black',
    raw:   code,
  };
}

// sizes: sm=opponent cards, md=medium, lg=community cards, xl=my hole cards
const BACK_SIZES = {
  sm: 'w-9 h-13',
  md: 'w-12 h-17',
  lg: 'w-16 h-22',
  xl: 'w-20 h-28',
};
const FACE_SIZES = {
  sm: { cls: 'w-9 h-13',  rankFs: '0.78rem', suitFs: '0.88rem' },
  md: { cls: 'w-12 h-17', rankFs: '0.9rem',  suitFs: '1rem'    },
  lg: { cls: 'w-16 h-22', rankFs: '1.1rem',  suitFs: '1.2rem'  },
  xl: { cls: 'w-20 h-28', rankFs: '1.4rem',  suitFs: '1.5rem'  },
};

export function CardDisplay({ code, size = 'md', faceDown = false, animate = false }) {
  const animClass = animate ? 'card-deal' : '';

  if (faceDown || code === 'back') {
    return <div className={`card card-back ${BACK_SIZES[size] || BACK_SIZES.md} ${animClass}`} />;
  }

  const card = parseCard(code);
  if (!card) return null;

  const { cls, rankFs, suitFs } = FACE_SIZES[size] || FACE_SIZES.md;
  const colorClass = card.color === 'red' ? 'card-red' : 'card-black';

  return (
    <div
      className={`card card-face ${cls} ${colorClass} flex-col gap-0 ${animClass}`}
      style={{ padding: '3px' }}
    >
      <span className="leading-none font-bold" style={{ fontSize: rankFs }}>{card.rank}</span>
      <span className="leading-none"           style={{ fontSize: suitFs }}>{card.suit}</span>
    </div>
  );
}
