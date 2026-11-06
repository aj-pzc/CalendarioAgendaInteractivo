import Image from 'next/image';
import logo from '@/app/Logotipo_CCR_h.jpg';

interface CCRLogoProps {
  size?: number;
  className?: string;
}

export default function CCRLogo({ size = 44, className = '' }: CCRLogoProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={logo}
        alt="CCR Business Center"
        width={1280}
        height={640}
        priority
        className="absolute max-w-none"
        style={{
          width: (size * 1280) / 506,
          height: 'auto',
          left: -(size * 49) / 506,
          top: -(size * 73) / 506,
        }}
      />
    </div>
  );
}
