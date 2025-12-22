import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const OrnamentItem = ({ 
  ornament, 
  isPlaced = false, 
  onDelete,
  onResize,
  onRemove
}) => {
  const [showControls, setShowControls] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ornament.id,
    data: ornament,
    disabled: false // Allow dragging even when placed
  });
  
  const style = {
    transform: transform 
      ? CSS.Translate.toString(transform)
      : isPlaced 
        ? undefined
        : undefined,
    opacity: isDragging ? 0.7 : 1,
    cursor: isDragging ? 'grabbing' : (isPlaced ? 'grab' : 'grab'),
    zIndex: isDragging ? 1000 : (showControls ? 100 : 1),
    transition: isDragging ? 'none' : 'all 0.2s ease'
  };
  
  const baseSize = 50;
  const scale = ornament.scale || 1;
  const currentSize = baseSize * scale;
  
  const handleIncreaseSize = (e) => {
    e.stopPropagation();
    onResize?.(ornament.id, Math.min((ornament.scale || 1) + 0.2, 2));
  };
  
  const handleDecreaseSize = (e) => {
    e.stopPropagation();
    onResize?.(ornament.id, Math.max((ornament.scale || 1) - 0.2, 0.5));
  };
  
  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.(ornament.id);
    setShowControls(false);
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => isPlaced && setShowControls(!showControls)}
      className="relative cursor-grab active:cursor-grabbing select-none group"
    >
      <div 
        style={{
          width: currentSize,
          height: currentSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {/* Ornament - Image or Emoji */}
        {ornament.image ? (
          <img
            src={ornament.image}
            alt={ornament.name}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: isDragging 
                ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' 
                : 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
              transform: `rotate(${ornament.rotation || 0}deg)`,
              transition: isDragging ? 'none' : 'filter 0.2s ease',
              pointerEvents: 'none'
            }}
            className={`select-none ${isPlaced ? 'ornament-placed' : ''}`}
          />
        ) : (
          <div
            style={{
              fontSize: currentSize,
              filter: isDragging 
                ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' 
                : 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
              transform: `rotate(${ornament.rotation || 0}deg)`,
              transition: isDragging ? 'none' : 'filter 0.2s ease'
            }}
            className="select-none"
          >
            {ornament.emoji}
          </div>
        )}
        
        {/* Control Buttons - Only visible when placed and clicked */}
        {isPlaced && showControls && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20 whitespace-nowrap">
            {/* Remove Button */}
            <button
              onClick={handleRemove}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-all hover:scale-105"
              title="Remove ornament"
            >
              🗑️ Remove
            </button>
            
            {/* Increase Size */}
            <button
              onClick={handleIncreaseSize}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-all hover:scale-105"
              title="Increase size"
            >
              ➕ Bigger
            </button>
            
            {/* Decrease Size */}
            <button
              onClick={handleDecreaseSize}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-all hover:scale-105"
              title="Decrease size"
            >
              ➖ Smaller
            </button>
          </div>
        )}
        
        {/* Hover indicator for placed ornaments */}
        {isPlaced && !showControls && (
          <div className="absolute inset-0 rounded-full border-2 border-yellow-400/0 group-hover:border-yellow-400/50 transition-all duration-200"></div>
        )}
      </div>
    </div>
  );
};

export default OrnamentItem;
