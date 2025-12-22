import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const HomePage = () => {
  const [treeSize, setTreeSize] = useState('medium');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const createNewSession = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeSize })
      });
      
      const data = await response.json();
      
      if (data.success) {
        navigate(`/session/${data.sessionId}`);
      } else {
        setError(data.message || 'Failed to create session');
        alert('Failed to create session: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Cannot connect to server. Make sure backend is running on port 5000');
      alert('Cannot connect to server. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };
  
  const joinSession = () => {
    if (sessionId.trim()) {
      navigate(`/session/${sessionId.trim()}`);
    }
  };
  
  return (
    // Change the outermost div className to:
    <div className="w-screen min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a] to-[#2a1810] flex items-center justify-center p-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-lg animate-pulse">
            🎄
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Christmas Tree Decorator
          </h2>
          <p className="text-xl text-gray-300">
            Decorate a tree together in real-time!
          </p>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-500/20 border-2 border-red-500 rounded-lg p-4 text-white">
            <p className="font-bold">⚠️ Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-2 border-christmas-gold">
          {/* Create New Session */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              🎨 Create New Tree
            </h3>
            
            <div className="mb-4">
              <label className="block text-white mb-2 font-semibold">
                Choose Tree Size:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['small', 'medium', 'large'].map(size => (
                  <button
                    key={size}
                    onClick={() => setTreeSize(size)}
                    className={`
                      py-3 px-4 rounded-lg font-bold transition-all
                      ${treeSize === size
                        ? 'bg-christmas-green text-white scale-105 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }
                    `}
                  >
                    🎄 {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={createNewSession}
              disabled={loading}
              className="w-full bg-christmas-red hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? '🎄 Creating...' : '🎅 Start Decorating!'}
            </button>
          </div>
          
          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-christmas-gold"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/10 text-white font-bold">OR</span>
            </div>
          </div>
          
          {/* Join Existing Session */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              🔗 Join Friend's Tree
            </h3>
            
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter Session ID"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && joinSession()}
                className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-400 border-2 border-transparent focus:border-christmas-gold outline-none"
              />
              <button
                onClick={joinSession}
                className="bg-christmas-gold hover:bg-yellow-500 text-christmas-green font-bold px-6 py-3 rounded-lg transition-all shadow-lg"
              >
                Join 🎄
              </button>
            </div>
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-white font-semibold">Real-Time Collaboration</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-3xl mb-2">🎨</div>
            <p className="text-white font-semibold">Drag & Drop Ornaments</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="text-3xl mb-2">❄️</div>
            <p className="text-white font-semibold">Cozy Christmas Scene</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
