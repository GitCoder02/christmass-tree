import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';

const router = express.Router();

// Create new session
router.post('/create', async (req, res) => {
  try {
    console.log('📝 Received request to create session:', req.body);
    
    const { treeSize } = req.body;
    const sessionId = uuidv4();
    
    console.log('🆔 Generated session ID:', sessionId);
    
    const newSession = new Session({
      sessionId,
      treeSize: treeSize || 'medium',
      ornaments: [],
      activeUsers: 0
    });
    
    console.log('💾 Attempting to save session...');
    await newSession.save();
    console.log('✅ Session saved successfully!');
    
    res.status(201).json({
      success: true,
      sessionId,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating session:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error creating session',
      error: error.message
    });
  }
});

// Get session details
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('🔍 Looking for session:', sessionId);
    
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    console.log('✅ Session found:', sessionId);
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('❌ Error fetching session:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching session',
      error: error.message
    });
  }
});

export default router;
