import { useEffect, useState } from 'react';

const SnowEffect = () => {
  const [snowflakes, setSnowflakes] = useState([]);
  
  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 3 + 7,
      animationDelay: Math.random() * 5,
      fontSize: Math.random() * 10 + 10,
      opacity: Math.random() * 0.6 + 0.4
    }));
    
    setSnowflakes(flakes);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute text-white animate-snow-fall"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.fontSize}px`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            opacity: flake.opacity
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export default SnowEffect;
