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
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const isSavingRef = useRef(isSaving);
  const savedTimeoutRef = useRef(null);
  const [isUiVisible, setIsUiVisible] = useState(true);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const triggerSavedToast = () => {
    setShowSaved(true);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setShowSaved(false), 1500);
  };

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);
  
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
      // Save absolute mouse for drop calculations
      window.lastMouseX = e.clientX;
      window.lastMouseY = e.clientY;

      // Normalize relative to viewport center so different-resolution clients see cursors in same logical place
      const normX = (e.clientX - (window.innerWidth / 2)) / window.innerWidth; // -0.5..0.5 normalized around center
      const normY = (e.clientY - (window.innerHeight / 2)) / window.innerHeight;

      socket.emit('cursor-move', {
        sessionId,
        userId,
        x: normX,
        y: normY
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
      if (isSavingRef.current) triggerSavedToast();
      setIsSaving(false);
    });
    
    socket.on('ornament-moved', ({ ornamentId, position }) => {
      setOrnaments(prev =>
        prev.map(orn => (orn.id === ornamentId ? { ...orn, position } : orn))
      );
      if (isSavingRef.current) triggerSavedToast();
      setIsSaving(false);
    });
    
    socket.on('ornament-deleted', ({ ornamentId }) => {
      setOrnaments(prev => prev.filter(orn => orn.id !== ornamentId));
      if (isSavingRef.current) triggerSavedToast();
      setIsSaving(false);
    });
    
    socket.on('ornament-resized', ({ ornamentId, scale }) => {
      setOrnaments(prev =>
        prev.map(orn => (orn.id === ornamentId ? { ...orn, scale } : orn))
      );
      if (isSavingRef.current) triggerSavedToast();
      setIsSaving(false);
    });
    
    socket.on('tree-size-changed', ({ treeSize, ornaments: newOrnaments }) => {
      console.log('🎄 Tree size changed to:', treeSize);
      setCurrentTreeSize(treeSize);
      setOrnaments(newOrnaments);
      const positions = generateTreePositions(treeSize);
      setTreePositions(positions);
      if (isSavingRef.current) triggerSavedToast();
      setIsSaving(false);
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
      // It's a placed ornament being moved
      setActiveDragItem(existingOrnament);
    } else {
      // It's from inventory - could be inventory-{ornamentId}-{index}
      let ornamentType = null;
      
      if (event.active.id.startsWith('inventory-')) {
        // Extract ornamentId from "inventory-{ornamentId}-{index}" format
        const parts = event.active.id.split('-');
        // Remove 'inventory' prefix and last part (index)
        const ornamentId = parts.slice(1, -1).join('-');
        ornamentType = ornamentTypes.find(t => t.id === ornamentId);
      } else {
        // Fallback to old format for backward compatibility
        ornamentType = ornamentTypes.find(t => t.id === event.active.id);
      }
      
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
    
    // Get canvas dimensions and position (absolute values)
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasCenterX = canvasRect.left + canvasRect.width / 2;
    const canvasCenterY = canvasRect.top + canvasRect.height / 2;

    // Use absolute mouse position (saved in mousemove) rather than delta-based calculation.
    // This avoids race conditions when another player moved the ornament mid-drag.
    const dropX = window.lastMouseX || (canvasCenterX);
    const dropY = window.lastMouseY || (canvasCenterY);

    // Position relative to canvas center
    const relativeX = dropX - canvasCenterX;
    const relativeY = dropY - canvasCenterY;

    // Clamp to canvas bounds (with padding)
    const maxX = canvasRect.width / 2 - 50;
    const maxY = canvasRect.height / 2 - 50;

    const clampedPosition = {
      x: Math.max(-maxX, Math.min(maxX, relativeX)),
      y: Math.max(-maxY, Math.min(maxY, relativeY))
    };

    const existingOrnament = ornaments.find(o => o.id === active.id);

    if (existingOrnament) {
      // Move existing placed ornament to the absolute drop location
      setIsSaving(true);
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
      let ornamentType = null;
      
      if (active.id.startsWith('inventory-')) {
        // Extract ornamentId from "inventory-{ornamentId}-{index}" format
        const parts = active.id.split('-');
        // Remove 'inventory' prefix and last part (index)
        const ornamentId = parts.slice(1, -1).join('-');
        ornamentType = ornamentTypes.find(t => t.id === ornamentId);
      } else {
        // Fallback to old format
        ornamentType = ornamentTypes.find(t => t.id === active.id);
      }
      
      if (!ornamentType) return;

      const newOrnament = {
        ...ornamentType,
        id: uuidv4(), // Override ornamentType.id with a unique UUID
        position: clampedPosition,
        scale: 1,
        rotation: 0,
        addedBy: socket.id
      };

      setIsSaving(true);
      socket.emit('add-ornament', {
        sessionId,
        ornament: newOrnament
      });

      setOrnaments(prev => [...prev, newOrnament]);
    }
  };
  
  const handleDeleteOrnament = (ornamentId) => {
    if (!socket) return;
    setIsSaving(true);
    socket.emit('delete-ornament', {
      sessionId,
      ornamentId
    });

    setOrnaments(prev => prev.filter(o => o.id !== ornamentId));
  };
  
  const handleResizeOrnament = (ornamentId, newScale) => {
    if (!socket) return;
    setIsSaving(true);
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

      {/* 👁️ Eye Toggle - Always Visible */}
      <button
        onClick={() => setIsUiVisible(!isUiVisible)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 border-2 ${
          isUiVisible
            ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            : 'bg-christmas-red hover:bg-red-600 text-white border-white/50 scale-110 animate-pulse'
        }`}
        title={isUiVisible ? 'Hide Interface' : 'Show Interface'}
      >
        <span className="text-2xl">{isUiVisible ? '👁️' : '🙈'}</span>
      </button>

      {/* WRAPPER FOR UI ELEMENTS THAT HIDES THEM */}
      <div className={`transition-opacity duration-500 ease-in-out ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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

        {/* Saving Indicator */}
        {isSaving && (
          <div className="fixed top-6 right-6 z-50 bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 backdrop-blur-sm flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-sm">Saving...</span>
          </div>
        )}
        {/* Saved Toast */}
        {showSaved && (
          <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-3 py-2 rounded-lg border border-white/10 backdrop-blur-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.362 7.362a1 1 0 01-1.414 0L3.293 9.07a1 1 0 011.414-1.414l3.414 3.414 6.648-6.648a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Saved</span>
          </div>
        )}
      </div>
      
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
        <div className={`transition-opacity duration-500 ease-in-out ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <MultiplayerControls
            activeUsers={activeUsers}
            sessionId={sessionId}
            socket={socket}
            currentTreeSize={currentTreeSize}
          />
          
          <InventoryPanel />
          <MusicPlayer />
        </div>
        
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

            {/* Ghost previews for remote users who are dragging */}
            {Array.from(otherCursors.values())
              .filter(c => c && c.isDragging && c.draggingItem && typeof c.x === 'number' && typeof c.y === 'number')
              .map((c, idx) => {
                // Convert normalized coords to pixels when needed
                const normalized = Math.abs(c.x) <= 1 && Math.abs(c.y) <= 1;
                const pixelX = normalized ? (window.innerWidth * (0.5 + c.x)) : c.x;
                const pixelY = normalized ? (window.innerHeight * (0.5 + c.y)) : c.y;

                const canvasRect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
                if (!canvasRect) return null;

                const canvasCenterX = canvasRect.left + canvasRect.width / 2;
                const canvasCenterY = canvasRect.top + canvasRect.height / 2;

                const relativeX = pixelX - canvasCenterX;
                const relativeY = pixelY - canvasCenterY;

                const item = c.draggingItem;

                return (
                  <div
                    key={`ghost-${c.userId || idx}`}
                    className="absolute pointer-events-none opacity-80"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${relativeX}px), calc(-50% + ${relativeY}px))`,
                      zIndex: 30
                    }}
                  >
                    <div className="text-5xl scale-110 filter drop-shadow-lg opacity-90 animate-pulse select-none">
                      {item.emoji}
                    </div>
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                      {c.name || 'Guest'}
                    </div>
                  </div>
                );
              })}
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
