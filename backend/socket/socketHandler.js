import Session from '../models/Session.js';

const socketHandler = (io) => {
  // Store active sessions, users, and cursor positions
  const activeSessions = new Map();
  const userCursors = new Map(); // sessionId -> { userId: { x, y, name, color } }
  const userDragging = new Map(); // sessionId -> { userId: { ornament, position } }
  
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);
    
    // Join a decoration session
    socket.on('join-session', async ({ sessionId, userId, userName }) => {
      try {
        const session = await Session.findOne({ sessionId });
        
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }
        
        socket.join(sessionId);
        socket.sessionId = sessionId;
        socket.userId = userId;
        
        // Initialize cursor tracking for this session
        if (!userCursors.has(sessionId)) {
          userCursors.set(sessionId, new Map());
          userDragging.set(sessionId, new Map());
        }
        
        // Around line 30-40 in socketHandler.js
        // Assign random color to user
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const userColor = colors[Math.floor(Math.random() * colors.length)];

        // Initialize cursor with VALID x, y coordinates
        userCursors.get(sessionId).set(userId, {
          x: 0,  // Make sure these are numbers, not undefined
          y: 0,
          name: userName || `User ${userId.slice(0, 4)}`,
          color: userColor
        });

        
        if (!activeSessions.has(sessionId)) {
          activeSessions.set(sessionId, new Set());
        }
        activeSessions.get(sessionId).add(userId);
        
        session.activeUsers = activeSessions.get(sessionId).size;
        await session.save();
        
        // Send current session state to the joining user
        socket.emit('session-state', {
          treeSize: session.treeSize,
          ornaments: session.ornaments,
          activeUsers: session.activeUsers
        });
        
        // Send all current cursors to the new user
        const cursors = Array.from(userCursors.get(sessionId).entries())
          .filter(([uid]) => uid !== userId)
          .map(([uid, cursor]) => ({ userId: uid, ...cursor }));
        
        socket.emit('all-cursors', cursors);
        
        // Notify others in the room
        socket.to(sessionId).emit('user-joined', {
          userId,
          activeUsers: session.activeUsers,
          cursor: userCursors.get(sessionId).get(userId)
        });
        
        console.log(`👤 User ${userId} joined session ${sessionId}`);
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });
    
    // Handle cursor movement
    socket.on('cursor-move', ({ sessionId, userId, x, y }) => {
      if (userCursors.has(sessionId)) {
        const cursor = userCursors.get(sessionId).get(userId);
        if (cursor) {
          cursor.x = x;
          cursor.y = y;
          
          // Broadcast to others in the session
          socket.to(sessionId).emit('cursor-update', {
            userId,
            x,
            y
          });
        }
      }
    });
    
    // Handle drag start
    socket.on('drag-start', ({ sessionId, userId, ornament }) => {
      if (userDragging.has(sessionId)) {
        userDragging.get(sessionId).set(userId, { ornament });
        
        socket.to(sessionId).emit('user-dragging', {
          userId,
          ornament
        });
      }
    });
    
    // Handle drag end
    socket.on('drag-end', ({ sessionId, userId }) => {
      if (userDragging.has(sessionId)) {
        userDragging.get(sessionId).delete(userId);
        
        socket.to(sessionId).emit('user-stopped-dragging', {
          userId
        });
      }
    });
    
    // Handle tree size change
    socket.on('change-tree-size', async ({ sessionId, treeSize }) => {
      try {
        const session = await Session.findOne({ sessionId });
        
        if (!session) return;
        
        session.treeSize = treeSize;
        // DO NOT clear ornaments when resizing the tree. Preserve current decorations
        // Optionally, you could apply a scale transform here to reposition ornaments.
        await session.save();

        io.to(sessionId).emit('tree-size-changed', {
          treeSize,
          ornaments: session.ornaments
        });
        
        console.log(`🎄 Tree size changed to ${treeSize} in session ${sessionId}`);
      } catch (error) {
        console.error('Error changing tree size:', error);
      }
    });
    
    // Handle adding ornament
    socket.on('add-ornament', async ({ sessionId, ornament }) => {
      try {
        const session = await Session.findOne({ sessionId });
        
        if (!session) return;
        
        session.ornaments.push(ornament);
        await session.save();
        
        io.to(sessionId).emit('ornament-added', { ornament });
        
        console.log(`🎁 Ornament added in session ${sessionId}`);
      } catch (error) {
        console.error('Error adding ornament:', error);
      }
    });
    
    // Handle moving ornament
    socket.on('move-ornament', async ({ sessionId, ornamentId, position }) => {
      try {
        const session = await Session.findOne({ sessionId });
        
        if (!session) return;
        
        const ornament = session.ornaments.find(o => o.id === ornamentId);
        if (ornament) {
          ornament.position = position;
          await session.save();
          
          socket.to(sessionId).emit('ornament-moved', {
            ornamentId,
            position
          });
        }
      } catch (error) {
        console.error('Error moving ornament:', error);
      }
    });
    
    // Handle deleting ornament
    socket.on('delete-ornament', async ({ sessionId, ornamentId }) => {
      try {
        const session = await Session.findOne({ sessionId });
        
        if (!session) return;
        
        session.ornaments = session.ornaments.filter(o => o.id !== ornamentId);
        await session.save();
        
        io.to(sessionId).emit('ornament-deleted', { ornamentId });
        
        console.log(`🗑️ Ornament deleted in session ${sessionId}`);
      } catch (error) {
        console.error('Error deleting ornament:', error);
      }
    });
    
    // Handle resizing ornament
    socket.on('resize-ornament', async ({ sessionId, ornamentId, scale }) => {
      try {
        const session = await Session.findOne({ sessionId });
        
        if (!session) return;
        
        const ornament = session.ornaments.find(o => o.id === ornamentId);
        if (ornament) {
          ornament.scale = scale;
          await session.save();
          
          io.to(sessionId).emit('ornament-resized', {
            ornamentId,
            scale
          });
          
          console.log(`📏 Ornament resized to ${scale} in session ${sessionId}`);
        }
      } catch (error) {
        console.error('Error resizing ornament:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      
      if (socket.sessionId && socket.userId) {
        try {
          // Remove cursor
          if (userCursors.has(socket.sessionId)) {
            userCursors.get(socket.sessionId).delete(socket.userId);
          }
          
          // Remove dragging state
          if (userDragging.has(socket.sessionId)) {
            userDragging.get(socket.sessionId).delete(socket.userId);
          }
          
          const sessionUsers = activeSessions.get(socket.sessionId);
          if (sessionUsers) {
            sessionUsers.delete(socket.userId);
            
            const session = await Session.findOne({ sessionId: socket.sessionId });
            if (session) {
              session.activeUsers = sessionUsers.size;
              await session.save();
              
              socket.to(socket.sessionId).emit('user-left', {
                userId: socket.userId,
                activeUsers: session.activeUsers
              });
            }
            
            if (sessionUsers.size === 0) {
              activeSessions.delete(socket.sessionId);
              userCursors.delete(socket.sessionId);
              userDragging.delete(socket.sessionId);
            }
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });
};

export default socketHandler;
