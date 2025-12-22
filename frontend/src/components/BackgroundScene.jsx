const BackgroundScene = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10">
      {/* Background Image - FIXED: contain instead of cover */}
      <div
        className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/assets/backgrounds/christmas-room.jpg)',
          filter: 'brightness(0.9)'
        }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      
      {/* Twinkling lights at top */}
      <div className="absolute top-4 left-0 right-0 flex justify-around px-8 z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full animate-twinkle"
            style={{
              backgroundColor: ['#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FFD700'][i % 5],
              animationDelay: `${i * 0.2}s`,
              boxShadow: `0 0 10px ${['#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FFD700'][i % 5]}`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default BackgroundScene;
