import { useState } from 'react';

const MultiplayerControls = ({ activeUsers, sessionId, socket, currentTreeSize }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/session/${sessionId}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleTreeSizeChange = (newSize) => {
    if (socket && sessionId) {
      socket.emit('change-tree-size', {
        sessionId,
        treeSize: newSize
      });
    }
  };
  
  return (
    <>
      <div className="fixed top-6 right-6 flex gap-3 z-40">
        {/* Active Users */}
        <div className="relative overflow-hidden bg-gradient-to-br from-christmas-green/40 to-christmas-green/30 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 group hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="relative text-2xl">👥</span>
          <div className="relative flex flex-col">
            <span className="text-2xl font-bold text-white">{activeUsers}</span>
            <span className="text-xs text-gray-200 -mt-1">decorating</span>
          </div>
        </div>
        
        {/* Tree Size Selector */}
        <div className="relative group">
          <select
            value={currentTreeSize}
            onChange={(e) => handleTreeSizeChange(e.target.value)}
            className="appearance-none bg-gradient-to-br from-christmas-red/40 to-christmas-red/30 backdrop-blur-xl text-white font-bold px-5 py-3 pr-10 rounded-2xl shadow-2xl border border-white/20 cursor-pointer outline-none hover:scale-105 transition-all duration-300"
          >
            <option value="small" className="bg-christmas-red text-white">🎄 Small Tree</option>
            <option value="medium" className="bg-christmas-red text-white">🎄 Medium Tree</option>
            <option value="large" className="bg-christmas-red text-white">🎄 Large Tree</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
            </svg>
          </div>
        </div>
        
        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="relative overflow-hidden bg-gradient-to-r from-christmas-gold to-yellow-500 hover:from-yellow-500 hover:to-christmas-gold text-christmas-green font-bold px-6 py-3 rounded-2xl shadow-2xl transition-all duration-300 flex items-center gap-2 hover:scale-105 border border-yellow-600/30"
        >
          <span className="text-xl">🔗</span>
          <span>Share</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 hover:opacity-100 transition-opacity animate-shimmer"></div>
        </button>
      </div>
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/50 animate-scale-in">
            <div className="absolute -top-12 -right-12 text-8xl opacity-20 rotate-12">🎄</div>
            <div className="absolute -bottom-8 -left-8 text-6xl opacity-20 -rotate-12">🎁</div>
            
            <div className="relative">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-christmas-green to-christmas-red bg-clip-text text-transparent mb-4">
                🎄 Share Your Tree!
              </h3>
              <p className="text-gray-600 mb-6">
                Invite friends to decorate together in real-time:
              </p>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-christmas-green/30 rounded-xl bg-white/50 backdrop-blur-sm focus:border-christmas-green outline-none font-mono text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-gradient-to-r from-christmas-green to-green-600 hover:from-green-600 hover:to-christmas-green text-white px-5 rounded-xl transition-all duration-300 font-bold shadow-lg hover:scale-105"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
              
              {copied && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-xl mb-4 animate-fade-in flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  <span className="font-semibold">Link copied to clipboard!</span>
                </div>
              )}
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-gradient-to-r from-christmas-red to-red-600 hover:from-red-600 hover:to-christmas-red text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MultiplayerControls;
