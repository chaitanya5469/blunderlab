import { useId, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/cn';
import type { Coach, CoachId, Mood } from './types';

/*
 * Hand-drawn cartoon portraits (head and shoulders) built from shared parts: each coach supplies
 * skin, face shape, hair, facial hair, clothes and props; eyes, brows and mouth are shared and
 * change with the mood. Animation: idle blink and breathing (CSS, off under reduced motion), and
 * brows / eyes / mouth that ease between expressions.
 */

const CSS = `.ca-breathe{animation:ca-b 4.2s ease-in-out infinite}
@keyframes ca-b{50%{transform:translateY(.7px) rotate(.6deg)}}
.ca-blink{transform-box:fill-box;transform-origin:center;animation:ca-k var(--blink,4.6s) infinite}
@keyframes ca-k{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(.1)}}
.ca-part{transform-box:fill-box;transform-origin:center;transition:transform .35s cubic-bezier(.3,1.5,.5,1)}
.ca-smoke{animation:ca-s 3.2s ease-out infinite}
@keyframes ca-s{0%{opacity:0;transform:translate(0,0)}35%{opacity:.7}100%{opacity:0;transform:translate(1.5px,-6px)}}
@media (prefers-reduced-motion:reduce){.ca-breathe,.ca-blink,.ca-smoke{animation:none}.ca-part{transition:none}}`;

interface Look {
  skin: string;
  shade: string;
  /** Face half-width and chin half-width (smaller is sharper). */
  w: number;
  chin: number;
  brow: string;
  browW?: number;
  /** Resting brow tilt in degrees (positive: inner ends lower, an intense look). */
  tilt?: number;
  /** Mouth centre y and half-width. */
  mouthY?: number;
  mouthW?: number;
  /** Larger dark irises. */
  bigEyes?: boolean;
  blink: string;
  back?: ReactNode;
  hair: ReactNode;
  /** Drawn over the face after the eyes (glasses, moustache). */
  over?: ReactNode;
  /** Drawn over the mouth (moustache, cigar). */
  top?: ReactNode;
  body: ReactNode;
}

const NECK = (skin: string) => <path d="M27.5 37 L36.5 37 L36.2 48 L27.8 48Z" fill={skin} />;

function Suit({ coat, shirt = '#f4f1ea', tie, open }: { coat: string; shirt?: string; tie?: string; open?: boolean }) {
  return (
    <g>
      <path d="M3 64 C5 52 17 46.5 32 46.5 C47 46.5 59 52 61 64Z" fill={coat} />
      <path d="M25.5 46.8 L32 58 L38.5 46.8 C36 45.8 28 45.8 25.5 46.8Z" fill={shirt} />
      {open ? (
        <path d="M27 46.5 L32 53 L37 46.5 L35.5 51 L32 53 L28.5 51Z" fill="#000" opacity=".12" />
      ) : (
        <path d="M27.5 46.5 L32 50 L36.5 46.5 L37.5 49 L32 51 L26.5 49Z" fill="#fff" opacity=".85" />
      )}
      {tie && <path d="M31 50.5 L33 50.5 L34.2 59.5 L32 63 L29.8 59.5Z" fill={tie} />}
      <path d="M25.5 46.8 L30.5 64 M38.5 46.8 L33.5 64" stroke="#000" strokeOpacity=".28" strokeWidth="1" fill="none" />
    </g>
  );
}

const LOOKS: Record<CoachId, Look> = {
  // Young, clean-shaven, neat dark side-parted hair, 1850s high collar and black cravat.
  morphy: {
    skin: '#ebbf98',
    shade: '#d49f78',
    w: 10.6,
    chin: 4.5,
    brow: '#2a1d17',
    blink: '4.3s',
    hair: (
      <g>
        <path d="M20.6 28 C19 17 24 11.2 32 11.2 C40 11.2 45 17 43.4 28 C42.6 23 41.6 20 39 18.3 C34 20.2 29 19.6 26 17.2 C24 20 22 23 20.6 28Z" fill="#2a1d17" />
        <path d="M26 17.2 C26.8 15 27.8 13.4 29.2 12.2" stroke="#5a463a" strokeWidth=".8" fill="none" strokeLinecap="round" />
        <path d="M31 14 C35 12.8 39 14 41 16.5" stroke="#4a3a30" strokeWidth=".7" fill="none" strokeLinecap="round" />
      </g>
    ),
    body: (
      <g>
        <path d="M3 64 C5 52 17 46.5 32 46.5 C47 46.5 59 52 61 64Z" fill="#2b2a33" />
        <path d="M26 46.5 L32 60 L38 46.5Z" fill="#f4f1ea" />
        <path d="M26.6 41.5 L28.5 47.5 L32 46 L35.5 47.5 L37.4 41.5 L36.6 45.5 L32 44.6 L27.4 45.5Z" fill="#fbf8f2" stroke="#d8d2c6" strokeWidth=".4" />
        <path d="M32 49.4 L26.8 46.6 L27.2 52.2Z M32 49.4 L37.2 46.6 L36.8 52.2Z" fill="#141418" />
        <circle cx="32" cy="49.4" r="1.5" fill="#26262c" />
        <path d="M26 46.5 L31 64 M38 46.5 L33 64" stroke="#000" strokeOpacity=".35" strokeWidth="1" fill="none" />
      </g>
    ),
  },
  // Stocky and broad, balding, with a big full reddish beard.
  steinitz: {
    skin: '#eec09d',
    shade: '#d6a07c',
    w: 12.4,
    chin: 7,
    brow: '#7d4321',
    browW: 1.9,
    mouthY: 38.4,
    mouthW: 2.6,
    blink: '5.1s',
    hair: (
      <g fill="#93552c">
        <path d="M19.8 31 C18.6 24 19.6 20 23 17.8 C22.2 22 22 25.5 22.6 29Z" />
        <path d="M44.2 31 C45.4 24 44.4 20 41 17.8 C41.8 22 42 25.5 41.4 29Z" />
        <path d="M27 15.5 C30 14.3 35 14.5 37.5 15.6" stroke="#fff" strokeOpacity=".45" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
    ),
    over: (
      <path d="M19.8 29 C19 43 24.5 54.5 32 55.5 C39.5 54.5 45 43 44.2 29 C43 34 40.5 36.4 37.5 36.6 C35.5 35.3 28.5 35.3 26.5 36.6 C23.5 36.4 21 34 19.8 29Z" fill="#a5602f" />
    ),
    top: (
      <g>
        <path d="M26.4 37.2 C28.6 35 31 35.3 32 36.2 C33 35.3 35.4 35 37.6 37.2 C35.4 38 33.4 37.6 32 37.2 C30.6 37.6 28.6 38 26.4 37.2Z" fill="#7d4321" />
      </g>
    ),
    body: <Suit coat="#33302e" tie="#141414" />,
  },
  // Receding hair, bushy moustache, cigar.
  lasker: {
    skin: '#edc2a0',
    shade: '#d4a17e',
    w: 11,
    chin: 5.5,
    brow: '#4d3f33',
    browW: 1.7,
    mouthY: 38.2,
    mouthW: 2.6,
    blink: '4.8s',
    hair: (
      <g fill="#6f5d4c">
        <path d="M20.4 30 C19.2 22 20.6 17 25 15 C23.6 19 23 23.5 23.2 28Z" />
        <path d="M43.6 30 C44.8 22 43.4 17 39 15 C40.4 19 41 23.5 40.8 28Z" />
        <path d="M29 14.4 C30.5 13.6 33.5 13.6 35 14.4" stroke="#6f5d4c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
    ),
    top: (
      <g>
        <path d="M25.4 37.4 C27 34.4 30.6 34.2 32 35.4 C33.4 34.2 37 34.4 38.6 37.4 C36.6 38.2 34.4 37.8 32 37.3 C29.6 37.8 27.4 38.2 25.4 37.4Z" fill="#4d3f33" />
        <path d="M34.6 38.4 L43.4 40 L43 41.8 L34.2 40.2Z" fill="#7a4a2a" />
        <path d="M42.4 39.8 L43.4 40 L43 41.8 L42 41.6Z" fill="#e05a2a" />
        <path className="ca-smoke" d="M44 39 C45.5 37.5 43.5 36 45 34.5" stroke="#cfcac2" strokeWidth=".9" fill="none" strokeLinecap="round" />
      </g>
    ),
    body: <Suit coat="#3f4a3c" tie="#6a2c2c" />,
  },
  // Slicked-back glossy black hair with a side parting; suit and tie; calm.
  capablanca: {
    skin: '#e2b18a',
    shade: '#c99470',
    w: 10.8,
    chin: 4.8,
    brow: '#16161a',
    blink: '4.6s',
    hair: (
      <g>
        <path d="M20.6 28 C19.6 17 25 12 32.5 12 C40 12 44.6 17 43.4 28 C42.8 22.5 41 19.4 36 19 C30.5 18.6 25.5 19.6 23.4 21.8 C22 23.4 21 25.6 20.6 28Z" fill="#141519" />
        <path d="M27 15.6 C31 14 36 14.2 40 16.4" stroke="#5d6b84" strokeWidth=".6" fill="none" strokeLinecap="round" opacity=".7" />
        <path d="M26.6 13.4 C25.6 15.4 24.6 18 23.8 21" stroke="#3a4250" strokeWidth=".6" fill="none" />
      </g>
    ),
    body: <Suit coat="#1f2c44" tie="#8a2f3a" />,
  },
  // Tall forehead, light swept-back hair, sharp features, 1920s suit, and his cat.
  alekhine: {
    skin: '#f0c7a6',
    shade: '#d8a785',
    w: 10.2,
    chin: 2.6,
    brow: '#a8834f',
    blink: '4.1s',
    hair: (
      <g>
        <path d="M21 24.5 C20 15.5 25 11 32 11 C39 11 44 15.5 43 24.5 C42 20.5 40.5 18 38 17 C34 16 29.5 16 26 17 C23.5 18 22 20.5 21 24.5Z" fill="#d2b07a" />
        <path d="M24.5 16.2 C29 13.4 35 13.2 40.5 15.6 M23.5 19 C27.5 16 34 15.2 41.6 18.4" stroke="#a8834f" strokeWidth=".7" fill="none" strokeLinecap="round" />
      </g>
    ),
    body: (
      <g>
        <Suit coat="#59606e" tie="#7a3b5a" />
        <g transform="translate(9 49)">
          <path d="M1 14 C0 8 2 5 3 1 L6.5 5 C8 4.5 10 4.5 11.5 5 L15 1 C16 5 18 8 17 14Z" fill="#232227" />
          <ellipse cx="6.3" cy="8.6" rx="1.4" ry="1.1" fill="#c8d65a" />
          <ellipse cx="11.7" cy="8.6" rx="1.4" ry="1.1" fill="#c8d65a" />
          <path d="M6.3 8 V9.2 M11.7 8 V9.2" stroke="#111" strokeWidth=".6" />
          <path d="M8.3 10.6 L9.7 10.6 L9 11.4Z" fill="#d88c9a" />
        </g>
      </g>
    ),
  },
  // Thin face, round glasses, dark hair, intense brows.
  nimzowitsch: {
    skin: '#ecc3a2',
    shade: '#d3a17f',
    w: 9.4,
    chin: 3.8,
    brow: '#221c18',
    browW: 1.9,
    tilt: 9,
    blink: '3.8s',
    hair: (
      <path d="M21.6 27 C20.2 14.6 26 10 32 10 C38.6 10 43.8 14.6 42.4 27 C41.8 22 40.4 19 37.2 18.4 C35.4 20 33.4 19.2 31.6 17.9 C29.6 19.6 27 19.6 25 18.8 C23.4 21 22.2 24 21.6 27Z" fill="#2b2420" />
    ),
    over: (
      <g fill="none" stroke="#1e1e22" strokeWidth=".9">
        <circle cx="27.8" cy="28" r="3.3" fill="#fff" fillOpacity=".12" />
        <circle cx="36.2" cy="28" r="3.3" fill="#fff" fillOpacity=".12" />
        <path d="M31.1 27.6 Q32 26.8 32.9 27.6 M24.5 27.6 L22.8 27 M39.5 27.6 L41.2 27" />
      </g>
    ),
    body: <Suit coat="#2a2533" tie="#3c3550" />,
  },
  // Dark curly hair, piercing dark eyes, a slight smile, open-collar 1960s shirt.
  tal: {
    skin: '#efc39e',
    shade: '#d6a27d',
    w: 10.4,
    chin: 4.6,
    brow: '#1c1715',
    bigEyes: true,
    blink: '5.4s',
    hair: (
      <g fill="#1f1a18">
        <path d="M21 27 C19.6 16 25 11.5 32 11.5 C39 11.5 44.4 16 43 27 C42 22 40 19.5 36 19 C31 18 26 18.6 23.4 21 C22.2 22.6 21.4 24.6 21 27Z" />
        {[
          [21.4, 22.6, 2.8],
          [22.6, 18, 3],
          [26, 14.6, 3.2],
          [30.6, 12.6, 3.2],
          [35.4, 12.8, 3.2],
          [39.6, 15.2, 3],
          [42.4, 19.4, 2.8],
          [42.6, 24, 2.4],
          [28.2, 17.2, 2.4],
          [33.4, 16.6, 2.4],
          [38, 18.4, 2.2],
        ].map(([x, y, r]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={r} />
        ))}
        <path d="M25 14.6 a2 2 0 0 1 3 -1 M30 12 a2 2 0 0 1 3 0 M35 12.4 a2 2 0 0 1 3 1" stroke="#4a3f3a" strokeWidth=".6" fill="none" />
      </g>
    ),
    body: <Suit coat="#34393f" shirt="#cfe0ea" open />,
  },
};

function mouthPath(mood: Mood, y: number, hw: number, smile: boolean): string {
  const l = 32 - hw;
  const r = 32 + hw;
  switch (mood) {
    case 'pleased':
      return `M${l - 0.5} ${y - 0.4} Q32 ${y + 1} ${r + 0.5} ${y - 0.4} Q32 ${y + 4} ${l - 0.5} ${y - 0.4}Z`;
    case 'concerned':
      return `M${l} ${y + 1} Q32 ${y - 1.3} ${r} ${y + 1} Q32 ${y - 0.4} ${l} ${y + 1}Z`;
    case 'surprised':
      return `M30.2 ${y + 0.4} Q32 ${y - 2} 33.8 ${y + 0.4} Q32 ${y + 3.6} 30.2 ${y + 0.4}Z`;
    default:
      return smile ? `M${l} ${y - 0.3} Q32 ${y + 1.6} ${r} ${y - 0.3} Q32 ${y + 2.6} ${l} ${y - 0.3}Z` : `M${l} ${y} Q32 ${y + 1} ${r} ${y} Q32 ${y + 1.7} ${l} ${y}Z`;
  }
}

interface CoachAvatarProps {
  coach: Coach;
  mood?: Mood;
  className?: string;
}

/** An illustrated, gently animated cartoon of the coach; the expression follows `mood`. */
export function CoachAvatar({ coach, mood = 'neutral', className }: CoachAvatarProps) {
  const id = useId();
  const reduced = useReducedMotion();
  const L = LOOKS[coach.id];
  const { from, to } = coach.avatar;
  const { w, chin, skin, shade } = L;
  const ey = 28;
  const dx = coach.id === 'nimzowitsch' ? 4.2 : 4.6;
  const tilt = (L.tilt ?? 0) + (mood === 'concerned' ? -13 : 0);
  const lift = mood === 'surprised' ? -2.4 : mood === 'pleased' ? -1.2 : 0;
  const eyeScale = mood === 'surprised' ? 'scale(1.25)' : mood === 'pleased' ? 'scaleY(.72)' : 'none';
  const face = `M${32 - w} 27 C${32 - w} 16 ${32 - w * 0.55} 13.5 32 13.5 C${32 + w * 0.55} 13.5 ${32 + w} 16 ${32 + w} 27 C${32 + w} 35 ${32 + chin} 42 32 42 C${32 - chin} 42 ${32 - w} 35 ${32 - w} 27Z`;
  const d = mouthPath(mood, L.mouthY ?? 36.4, L.mouthW ?? 3.4, coach.id === 'tal' || coach.id === 'capablanca');
  return (
    <svg viewBox="0 0 64 64" className={cn('size-10 shrink-0 rounded-full', className)} aria-hidden style={{ ['--blink' as string]: L.blink }}>
      <style>{CSS}</style>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <radialGradient id={`${id}s`} cx=".4" cy=".35" r=".75">
          <stop offset=".55" stopColor={skin} />
          <stop offset="1" stopColor={shade} />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="64" height="64" fill={`url(#${id}g)`} />
        <circle cx="20" cy="16" r="20" fill="#fff" opacity=".08" />
        {NECK(shade)}
        {L.body}
        <g className="ca-breathe" style={{ transformOrigin: '32px 46px' }}>
          {L.back}
          <ellipse cx={32 - w} cy="29.5" rx="2" ry="3" fill={shade} />
          <ellipse cx={32 + w} cy="29.5" rx="2" ry="3" fill={shade} />
          <path d={face} fill={`url(#${id}s)`} />
          {L.hair}
          {mood === 'pleased' && (
            <g fill="#e0796a" opacity=".3">
              <ellipse cx={32 - dx - 1.2} cy="33" rx="2.2" ry="1.3" />
              <ellipse cx={32 + dx + 1.2} cy="33" rx="2.2" ry="1.3" />
            </g>
          )}
          {[-1, 1].map((s) => (
            <g key={s} className="ca-part" style={{ transform: eyeScale }}>
              <g className="ca-blink">
                {mood === 'surprised' && <ellipse cx={32 + s * dx} cy={ey} rx="2" ry="2.3" fill="#fff" />}
                <ellipse cx={32 + s * dx} cy={ey} rx={L.bigEyes ? 1.6 : 1.3} ry={L.bigEyes ? 1.85 : 1.6} fill="#1c1614" />
                <circle cx={32 + s * dx + 0.45} cy={ey - 0.6} r=".45" fill="#fff" />
              </g>
            </g>
          ))}
          <path d="M32 29.6 Q30.4 33 32.4 33.5" stroke={shade} strokeWidth="1" fill="none" strokeLinecap="round" />
          {L.over}
          <motion.path
            initial={false}
            animate={{ d }}
            transition={{ duration: reduced ? 0 : 0.3, ease: 'easeOut' }}
            fill="#7a2e2a"
            stroke="#7a2e2a"
            strokeWidth=".6"
            strokeLinejoin="round"
          />
          {L.top}
          {[-1, 1].map((s) => (
            <path
              key={s}
              className="ca-part"
              style={{ transform: `translateY(${lift}px) rotate(${s * -tilt}deg)` }}
              d={s < 0 ? `M${32 - dx - 3} 24.6 Q${32 - dx} 22.9 ${32 - dx + 2.6} 24` : `M${32 + dx - 2.6} 24 Q${32 + dx} 22.9 ${32 + dx + 3} 24.6`}
              stroke={L.brow}
              strokeWidth={L.browW ?? 1.4}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
