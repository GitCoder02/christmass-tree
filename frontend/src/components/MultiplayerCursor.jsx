const MultiplayerCursor = ({ cursor }) => {
  // BULLETPROOF VALIDATION
  if (!cursor) {
    console.warn('MultiplayerCursor: cursor is null/undefined');
    return null;
  }

  if (!('x' in cursor) || typeof cursor.x !== 'number') {
    console.warn('MultiplayerCursor: invalid x coordinate', cursor);
    return null;
  }

  if (!('y' in cursor) || typeof cursor.y !== 'number') {
    console.warn('MultiplayerCursor: invalid y coordinate', cursor);
    return null;
  }

  if (isNaN(cursor.x) || isNaN(cursor.y)) {
    console.warn('MultiplayerCursor: NaN coordinates', cursor);
    return null;
  }

  // Compute normalization once and convert to pixels if needed
  const normalized = Math.abs(cursor.x) <= 1 && Math.abs(cursor.y) <= 1;
  const pixelX = normalized ? (window.innerWidth * (0.5 + cursor.x)) : cursor.x;
  const pixelY = normalized ? (window.innerHeight * (0.5 + cursor.y)) : cursor.y;

  return (
    <div
      className="fixed pointer-events-none z-[100] transition-transform duration-100 ease-linear"
      style={{
        left: pixelX,
        top: pixelY,
        transform: 'translate(-12px, -12px)',
        willChange: 'transform, left, top'
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M5.65376 12.3673L8.47157 20.4723C8.74664 21.3087 9.94446 21.4562 10.4228 20.7033L12.3608 17.9778L15.415 20.7033C15.8934 21.4562 17.0912 21.3087 17.3663 20.4723L20.1841 12.3673C20.4591 11.5308 19.7717 10.6931 18.8747 10.9156L6.96688 13.8701C6.06988 14.0926 5.37873 15.2037 5.65376 12.3673Z"
          fill={cursor.color || '#FF6B6B'}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* Name Label */}
      <div
        className="absolute top-6 left-0 whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg"
        style={{
          backgroundColor: cursor.color || '#FF6B6B',
          border: '2px solid white'
        }}
      >
        {cursor.name || 'Guest'}
        {cursor.isDragging && <span className="ml-1 animate-pulse">✋</span>}
      </div>
    </div>
  );
};

export default MultiplayerCursor;
