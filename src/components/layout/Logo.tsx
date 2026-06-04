'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 40 : 32
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      {/* Icon: waveform inside rounded square with gradient */}
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
          background: 'linear-gradient(135deg, #c8973a 0%, #e8b84b 50%, #d4a853 100%)',
          boxShadow: '0 2px 8px rgba(212, 168, 83, 0.4)',
        }}
      >
        {/* Audio waveform SVG */}
        <svg
          width={iconSize * 0.62}
          height={iconSize * 0.62}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Waveform bars — centered, varying heights */}
          <rect x="1"  y="7"  width="2.2" height="6"  rx="1.1" fill="white" opacity="0.9" />
          <rect x="4.5" y="4" width="2.2" height="12" rx="1.1" fill="white" />
          <rect x="8"  y="6"  width="2.2" height="8"  rx="1.1" fill="white" opacity="0.95" />
          <rect x="11.5" y="2" width="2.2" height="16" rx="1.1" fill="white" />
          <rect x="15" y="5" width="2.2" height="10" rx="1.1" fill="white" opacity="0.9" />
          <rect x="18.5" y="8" width="1.5" height="4"  rx="0.75" fill="white" opacity="0.7" />
        </svg>
      </div>

      {/* Wordmark: "Lingua" dark + "Flow" gold */}
      <span className={`font-display font-semibold ${textSize} hidden sm:block tracking-tight`}>
        <span className="text-[#2c2416] dark:text-[#f0e8d8]">Lingua</span>
        <span style={{ color: '#d4a853' }}>Flow</span>
      </span>
    </div>
  )
}
