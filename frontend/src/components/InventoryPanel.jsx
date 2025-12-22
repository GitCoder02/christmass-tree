import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ornamentTypes } from '../utils/ornamentData';

const DraggableOrnament = ({ ornament }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ornament.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-20 h-20 bg-gradient-to-br from-green-700/30 to-green-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:from-green-600/40 hover:to-green-800/40 transition-all duration-200 border border-green-500/20 hover:border-green-400/40 hover:scale-110 group"
      title={ornament.name}
    >
      <span className="text-4xl group-hover:scale-125 transition-transform duration-200">
        {ornament.emoji}
      </span>
    </div>
  );
};

const InventoryPanel = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: '🎄', color: 'yellow' },
    { id: 'ornament', name: 'Ornaments', icon: '🔴', color: 'red' },
    { id: 'decoration', name: 'Decor', icon: '🎁', color: 'green' },
    { id: 'room-decoration', name: 'Room', icon: '✨', color: 'blue' },
  ];

  const filteredOrnaments =
    selectedCategory === 'all'
      ? ornamentTypes
      : ornamentTypes.filter((o) => o.category === selectedCategory);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 w-8 h-8 bg-green-600 hover:bg-green-500 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 border-2 border-white/20"
      >
        <span className="text-white text-lg">
          {isCollapsed ? '→' : '←'}
        </span>
      </button>

      <div
        className={`bg-gradient-to-b from-green-900/80 to-green-950/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-green-500/30 transition-all duration-300 ${
          isCollapsed ? 'w-0 p-0 opacity-0' : 'w-[340px]'
        }`}
      >
        {!isCollapsed && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-green-500/30">
              <span className="text-3xl">🎄</span>
              <h2 className="text-xl font-bold text-white">Decorations</h2>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-green-600 text-white shadow-lg scale-105'
                      : 'bg-green-800/40 text-green-100 hover:bg-green-700/60'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-sm">{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Ornaments Grid - FIXED: Use unique index-based key */}
            <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-900/20">
              {filteredOrnaments.map((ornament, index) => (
                <DraggableOrnament 
                  key={`${ornament.id}-${index}`} 
                  ornament={ornament} 
                />
              ))}
            </div>

            {/* Quick Guide */}
            <div className="mt-4 pt-3 border-t border-green-500/30">
              <p className="text-xs text-green-200 flex items-center gap-2">
                <span>✨</span>
                <span className="italic">Quick Guide</span>
              </p>
              <p className="text-xs text-green-300/80 mt-1">
                Drag decorations to the tree or room
              </p>
              <p className="text-xs text-green-300/80">
                Hover & click ❌ to remove
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;
