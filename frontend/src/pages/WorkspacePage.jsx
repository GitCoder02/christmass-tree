import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, PointerSensor } from '@dnd-kit/core';
import { useSocket } from '../hooks/useSocket';
import BackgroundScene from '../components/BackgroundScene';
import ChristmasTree from '../components/ChristmasTree';
import OrnamentItem from '../components/OrnamentItem';
import InventoryPanel from '../components/InventoryPanel';
import SnowEffect from '../components/SnowEffect';
import MusicPlayer from '../components/MusicPlayer';
import MultiplayerControls from '../components/MultiplayerControls';
import MultiplayerCursor from '../components/MultiplayerCursor';
import { generateTreePositions, findNearestPosition } from '../utils/treePositions';
import { ornamentTypes } from '../utils/ornamentData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WorkspacePage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [userId] = useState(() => uuidv4());
  const [userName] = useState(() => `User ${Math.floor(Math.random() * 1000)}`);
  const [sessionExists, setSessionExists] = useState(null);
  const [ornaments, setOrnaments] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [treePositions, setTreePositions] = useState([]);
  const [currentTreeSize, setCurrentTreeSize] = useState('medium');
  const [otherCursors, setOtherCursors] = useState(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const canvasRef = useRef(null);
  const treeContainerRef = useRef(null);
  
  const { socket, isConnected, sessionState, activeUsers } = useSocket(sessionId, userId);
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
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
  
  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Track mouse movement for cursor sharing
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleMouseMove = (e) => {
      socket.emit('cursor-move', {
        sessionId,
        userId,
        x: e.clientX,
        y: e.clientY
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [socket, isConnected, sessionId, userId]);
  
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/session/${sessionId}`);
        const data = await response.json();
        setSessionExists(data.success);
      } catch (error) {
        console.error('Error verifying session:', error);
        setSessionExists(false);
      }
    };
    
    verifySession();
  }, [sessionId]);
  
  useEffect(() => {
    if (sessionState?.treeSize) {
      setCurrentTreeSize(sessionState.treeSize);
      const positions = generateTreePositions(sessionState.treeSize);
      setTreePositions(positions);
    }
  }, [sessionState?.treeSize]);
  
  useEffect(() => {
    if (sessionState?.ornaments) {
      setOrnaments(sessionState.ornaments);
    }
  }, [sessionState?.ornaments]);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.emit('join-session', { sessionId, userId, userName });
    
    socket.on('all-cursors', (cursors) => {
      const cursorMap = new Map();
      cursors.forEach(cursor => {
        cursorMap.set(cursor.userId, { ...cursor });
      });
      setOtherCursors(cursorMap);
    });
    
    socket.on('user-joined', ({ userId: newUserId, cursor }) => {
      setOtherCursors(prev => {
        const newMap = new Map(prev);
        newMap.set(newUserId, { ...cursor });
        return newMap;
      });
    });
    
    socket.on('cursor-update', ({ userId: cursorUserId, x, y }) => {
      setOtherCursors(prev => {
        const newMap = new Map(prev);
        const cursor = newMap.get(cursorUserId);
        if (cursor) {
          newMap.set(cursorUserId, { ...cursor, x, y });
        }
        return newMap;
      });
    });
    
    socket.on('user-dragging', ({ userId: dragUserId, ornament }) => {
      setOtherCursors(prev => {
        const newMap = new Map(prev);
        const cursor = newMap.get(dragUserId);
        if (cursor) {
          newMap.set(dragUserId, { ...cursor, isDragging: true, draggingItem: ornament });
        }
        return newMap;
      });
    });
    
    socket.on('user-stopped-dragging', ({ userId: dragUserId }) => {
      setOtherCursors(prev => {
        const newMap = new Map(prev);
        const cursor = newMap.get(dragUserId);
        if (cursor) {
          newMap.set(dragUserId, { ...cursor, isDragging: false, draggingItem: null });
        }
        return newMap;
      });
    });
    
    socket.on('user-left', ({ userId: leftUserId }) => {
      setOtherCursors(prev => {
        const newMap = new Map(prev);
        newMap.delete(leftUserId);
        return newMap;
      });
    });
    
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
    
    socket.on('ornament-resized', ({ ornamentId, scale }) => {
      setOrnaments(prev =>
        prev.map(orn => (orn.id === ornamentId ? { ...orn, scale } : orn))
      );
    });
    
    socket.on('tree-size-changed', ({ treeSize, ornaments: newOrnaments }) => {
      console.log('🎄 Tree size changed to:', treeSize);
      setCurrentTreeSize(treeSize);
      setOrnaments(newOrnaments);
      const positions = generateTreePositions(treeSize);
      setTreePositions(positions);
    });
    
    return () => {
      socket.off('all-cursors');
      socket.off('user-joined');
      socket.off('cursor-update');
      socket.off('user-dragging');
      socket.off('user-stopped-dragging');
      socket.off('user-left');
      socket.off('ornament-added');
      socket.off('ornament-moved');
      socket.off('ornament-deleted');
      socket.off('ornament-resized');
      socket.off('tree-size-changed');
    };
  }, [socket, sessionId, userId, userName]);
  
  const handleDragStart = (event) => {
    console.log('🎯 Drag started:', event.active.id);
    setActiveId(event.active.id);
    
    const existingOrnament = ornaments.find(o => o.id === event.active.id);
    if (existingOrnament) {
      setActiveDragItem(existingOrnament);
    } else {
      const ornamentType = ornamentTypes.find(t => t.id === event.active.id);
      if (ornamentType) {
        setActiveDragItem(ornamentType);
        if (socket) {
          socket.emit('drag-start', {
            sessionId,
            userId,
            ornament: ornamentType
          });
        }
      }
    }
  };
  
  const handleDragEnd = (event) => {
    console.log('🎯 Drag ended:', event.active.id);
    const { active, delta } = event;
    
    setActiveId(null);
    setActiveDragItem(null);
    
    if (socket) {
      socket.emit('drag-end', { sessionId, userId });
    }
    
    if (!socket || !canvasRef.current) return;
    
    // Get canvas dimensions and position
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    
    const existingOrnament = ornaments.find(o => o.id === active.id);
    
    if (existingOrnament) {
      // Moving existing ornament - free placement anywhere on canvas
      const newPosition = {
        x: existingOrnament.position.x + delta.x,
        y: existingOrnament.position.y + delta.y
      };
      
      // Clamp to canvas bounds (with padding)
      const clampedPosition = {
        x: Math.max(-canvasCenterX + 50, Math.min(canvasCenterX - 50, newPosition.x)),
        y: Math.max(-canvasCenterY + 50, Math.min(canvasCenterY - 50, newPosition.y))
      };
      
      socket.emit('move-ornament', {
        sessionId,
        ornamentId: active.id,
        position: clampedPosition
      });
      
      setOrnaments(prev =>
        prev.map(orn => (orn.id === active.id ? { ...orn, position: clampedPosition } : orn))
      );
    } else {
      // Adding new ornament from inventory
      const ornamentType = ornamentTypes.find(t => t.id === active.id);
      if (!ornamentType) return;
      
      // Calculate final position relative to canvas center
      const newPosition = {
        x: delta.x,
        y: delta.y
      };
      
      // Clamp to canvas bounds
      const finalPosition = {
        x: Math.max(-canvasCenterX + 50, Math.min(canvasCenterX - 50, newPosition.x)),
        y: Math.max(-canvasCenterY + 50, Math.min(canvasCenterY - 50, newPosition.y))
      };
      
      console.log('📍 Final drop position:', finalPosition);
      
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
  
  const handleResizeOrnament = (ornamentId, newScale) => {
    if (!socket) return;
    
    socket.emit('resize-ornament', {
      sessionId,
      ornamentId,
      scale: newScale
    });
    
    setOrnaments(prev =>
      prev.map(orn => (orn.id === ornamentId ? { ...orn, scale: newScale } : orn))
    );
  };
  
  if (sessionExists === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a] to-[#2a1810] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">😞 Session Not Found</h2>
          <p className="text-gray-300 mb-6">This decoration session doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-christmas-red hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all"
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!sessionState || sessionExists === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a] to-[#2a1810] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎄</div>
          <h2 className="text-2xl font-bold text-white">Loading Christmas Magic...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <BackgroundScene />
      <SnowEffect />
      
      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-6 left-6 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 transition-all duration-300 hover:scale-110"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        <span className="text-2xl">
          {isFullscreen ? '⛶' : '⛶'}
        </span>
      </button>
      
      {/* Multiplayer Cursors */}
      {otherCursors && otherCursors.size > 0 && (
        Array.from(otherCursors.values())
          .filter(cursor => {
            const isValid = cursor && 
                           typeof cursor === 'object' &&
                           typeof cursor.x === 'number' && 
                           typeof cursor.y === 'number' &&
                           !isNaN(cursor.x) && 
                           !isNaN(cursor.y);
            return isValid;
          })
          .map((cursor, index) => (
            <MultiplayerCursor key={`cursor-${cursor.name || index}`} cursor={cursor} />
          ))
      )}
      
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <MultiplayerControls
          activeUsers={activeUsers}
          sessionId={sessionId}
          socket={socket}
          currentTreeSize={currentTreeSize}
        />
        
        <InventoryPanel />
        <MusicPlayer />
        
        {/* FULL SCREEN DROPPABLE CANVAS */}
        <div 
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none flex items-center justify-center z-20"
        >
          {/* Tree Container */}
          <div 
            ref={treeContainerRef}
            className="relative pointer-events-auto"
          >
            <ChristmasTree size={currentTreeSize} />
          </div>
          
          {/* Placed Ornaments - Positioned relative to canvas center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {ornaments.map((ornament) => (
              <div
                key={ornament.id}
                className="absolute pointer-events-auto"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${ornament.position.x}px), calc(-50% + ${ornament.position.y}px))`,
                }}
              >
                <OrnamentItem
                  ornament={ornament}
                  isPlaced={true}
                  onDelete={handleDeleteOrnament}
                  onResize={handleResizeOrnament}
                  onRemove={handleDeleteOrnament}
                />
              </div>
            ))}
          </div>
        </div>
        
        {!isConnected && (
          <div className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-40 flex items-center gap-2 animate-pulse">
            <span className="text-xl">⚠️</span>
            <span>Reconnecting...</span>
          </div>
        )}
        
        <DragOverlay dropAnimation={null}>
          {activeId && activeDragItem && (
            <div className="cursor-grabbing opacity-90 transform scale-125 filter drop-shadow-2xl pointer-events-none">
              <span className="text-6xl">{activeDragItem.emoji}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default WorkspacePage;
