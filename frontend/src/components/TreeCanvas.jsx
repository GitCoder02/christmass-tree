import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import ChristmasTree from './ChristmasTree';
import OrnamentItem from './OrnamentItem';
import { generateTreePositions, findNearestPosition } from '../utils/treePositions';
import { ornamentTypes } from '../utils/ornamentData';

const TreeCanvas = ({ socket, sessionState, sessionId }) => {
  const [ornaments, setOrnaments] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [treePositions, setTreePositions] = useState([]);
  
  // IMPROVED SENSORS for better drag detection [web:34][web:38]
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Reduced for better responsiveness
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  
  useEffect(() => {
    if (sessionState) {
      setOrnaments(sessionState.ornaments || []);
      const positions = generateTreePositions(sessionState.treeSize);
      setTreePositions(positions);
    }
  }, [sessionState]);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('ornament-added', ({ ornament }) => {
      setOrnaments(prev => [...prev, ornament]);
    });
    
    socket.on('ornament-moved', ({ ornamentId, position }) => {
      setOrnaments(prev =>
        prev.map(orn => (orn.id === ornamentId ? { ...orn, position } : orn))
      );
    });
    
    socket.on('ornament-deleted', ({ ornamentId }) => {
      setOrnaments(prev => prev.filter(orn => orn.id !== ornamentId));
    });
    
    socket.on('tree-size-changed', ({ ornaments: newOrnaments }) => {
      setOrnaments(newOrnaments);
    });
    
    return () => {
      socket.off('ornament-added');
      socket.off('ornament-moved');
      socket.off('ornament-deleted');
      socket.off('tree-size-changed');
    };
  }, [socket]);
  
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    
    // Check if dragging from inventory or existing ornament
    const existingOrnament = ornaments.find(o => o.id === event.active.id);
    if (existingOrnament) {
      setActiveDragItem(existingOrnament);
    } else {
      // Dragging from inventory
      const ornamentType = ornamentTypes.find(t => t.id === event.active.id);
      if (ornamentType) {
        setActiveDragItem({
          ...ornamentType,
          id: event.active.id
        });
      }
    }
  };
  
  const handleDragEnd = (event) => {
    const { active, delta } = event;
    setActiveId(null);
    setActiveDragItem(null);
    
    if (!socket) return;
    
    // Get canvas element to calculate relative positions
    const canvasElement = document.getElementById('decoration-canvas');
    if (!canvasElement) return;
    
    const canvasRect = canvasElement.getBoundingClientRect();
    
    // Calculate position relative to canvas center
    const relativeX = delta.x;
    const relativeY = delta.y;
    
    const existingOrnament = ornaments.find(o => o.id === active.id);
    
    if (existingOrnament) {
      // Moving existing ornament - allow free placement anywhere
      const newPosition = {
        x: existingOrnament.position.x + relativeX,
        y: existingOrnament.position.y + relativeY
      };
      
      socket.emit('move-ornament', {
        sessionId,
        ornamentId: active.id,
        position: newPosition
      });
      
      setOrnaments(prev =>
        prev.map(orn => (orn.id === active.id ? { ...orn, position: newPosition } : orn))
      );
    } else {
      // Adding new ornament from inventory
      const ornamentType = ornamentTypes.find(t => t.id === active.id);
      if (!ornamentType) return;
      
      // For tree ornaments, snap to tree positions
      // For room decorations, allow free placement
      let finalPosition;
      
      if (ornamentType.category === 'room-decoration') {
        // Free placement for room decorations
        finalPosition = { x: relativeX, y: relativeY };
      } else {
        // Snap to tree for tree ornaments
        const occupiedPositions = ornaments.map(o => o.position);
        finalPosition = findNearestPosition(
          { x: relativeX, y: relativeY },
          treePositions,
          occupiedPositions
        );
      }
      
      if (!finalPosition) {
        console.log('No valid position found');
        return;
      }
      
      const newOrnament = {
        id: uuidv4(),
        ...ornamentType,
        position: finalPosition,
        scale: 1,
        rotation: 0,
        addedBy: socket.id
      };
      
      socket.emit('add-ornament', {
        sessionId,
        ornament: newOrnament
      });
      
      setOrnaments(prev => [...prev, newOrnament]);
    }
  };
  
  const handleDeleteOrnament = (ornamentId) => {
    if (!socket) return;
    
    socket.emit('delete-ornament', {
      sessionId,
      ornamentId
    });
    
    setOrnaments(prev => prev.filter(o => o.id !== ornamentId));
  };
  
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        id="decoration-canvas"
        className="relative flex items-center justify-center w-full h-full"
      >
        {/* Christmas Tree */}
        <div className="relative">
          <ChristmasTree size={sessionState?.treeSize || 'medium'} />
          
          {/* Placed Ornaments */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
            {ornaments.map((ornament) => (
              <div
                key={ornament.id}
                className="pointer-events-auto"
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${ornament.position.x}px)`,
                  top: `${ornament.position.y + 100}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <OrnamentItem
                  ornament={ornament}
                  isPlaced={true}
                  onDelete={handleDeleteOrnament}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeId && activeDragItem && (
          <div className="cursor-grabbing opacity-80 transform scale-110">
            <span className="text-5xl drop-shadow-2xl">{activeDragItem.emoji}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default TreeCanvas;
