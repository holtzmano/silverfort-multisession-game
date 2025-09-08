import type { Shape, Color } from '../types';

const COLOR_MAP: Record<Color, string> = {
  Red: 'red',
  Green: 'green',
  Blue: 'blue',
  Yellow: 'gold',
};

export function ShapeIcon({ shape, color }: { shape: Shape; color: Color }) {
  const fill = COLOR_MAP[color];
  const stroke = '#222';

  switch (shape) {
    case 'Square':
      return (
        <svg width="56" height="56" viewBox="0 0 100 100" aria-label="square">
          <rect x="20" y="20" width="60" height="60" fill={fill} stroke={stroke} strokeWidth="3" />
        </svg>
      );
    case 'Circle':
      return (
        <svg width="56" height="56" viewBox="0 0 100 100" aria-label="circle">
          <circle cx="50" cy="50" r="30" fill={fill} stroke={stroke} strokeWidth="3" />
        </svg>
      );
    case 'Triangle':
      return (
        <svg width="56" height="56" viewBox="0 0 100 100" aria-label="triangle">
          <polygon points="50,20 80,80 20,80" fill={fill} stroke={stroke} strokeWidth="3" />
        </svg>
      );
    case 'Diamond':
      return (
        <svg width="56" height="56" viewBox="0 0 100 100" aria-label="diamond">
          <polygon points="50,15 85,50 50,85 15,50" fill={fill} stroke={stroke} strokeWidth="3" />
        </svg>
      );
    default:
      return null;
  }
}
