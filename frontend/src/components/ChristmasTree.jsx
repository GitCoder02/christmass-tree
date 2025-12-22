const ChristmasTree = ({ size = 'medium' }) => {
  const sizeConfig = {
    small: { width: 300, height: 450 },
    medium: { width: 450, height: 650 },
    large: { width: 600, height: 850 }
  };
  
  const { width, height } = sizeConfig[size];
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Glowing star */}
      <div className="relative mb-4 animate-twinkle z-10">
        <div className="absolute inset-0 blur-2xl bg-yellow-400 opacity-70"></div>
        <svg width="80" height="80" viewBox="0 0 24 24" className="relative">
          <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFA500" />
              <stop offset="100%" stopColor="#FF8C00" />
            </linearGradient>
            <filter id="starGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="url(#starGradient)"
            filter="url(#starGlow)"
            stroke="#FFD700"
            strokeWidth="0.5"
          />
        </svg>
      </div>
      
      {/* Tree Image */}
      <img
        src="/assets/images/christmas-tree.png"
        alt="Christmas Tree"
        style={{
          width: width,
          height: height,
          objectFit: 'contain',
          filter: 'drop-shadow(0 20px 50px rgba(0, 0, 0, 0.7)) brightness(1.4) contrast(1.2) saturate(1.4)',
        }}
        className="relative z-0"
      />
      
      {/* Subtle glow effect under tree */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 blur-3xl opacity-30"
        style={{
          width: width * 0.8,
          height: 100,
          background: 'radial-gradient(circle, rgba(34, 139, 34, 0.6) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};

export default ChristmasTree;
