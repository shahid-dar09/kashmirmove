import { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Send, MessageSquare, Clock, Phone, Loader2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContextValue';
import api from '../services/api';

const Chat = ({ bookingId, receiverName, receiverPhone, socketRef, onClose }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/messages/${bookingId}`);
        if (res.data.success) {
          setMessages(res.data.messages);
          // Initial scroll to bottom should be instant
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    const socket = socketRef.current;

    if (socket) {
      socket.on('new_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      if (socket) socket.off('new_message');
    };
  }, [bookingId, socketRef]);

  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom('smooth');
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      bookingId,
      senderId: user.id,
      message: newMessage.trim()
    };

    try {
      const socket = socketRef.current;
      if (socket) {
        socket.emit('send_message', messageData);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return createPortal(
    <div 
      style={{
        left: isMobile ? '1rem' : 'auto',
        right: isMobile ? '1rem' : '1.5rem',
        width: isMobile ? 'calc(100% - 2rem)' : '400px',
        bottom: isMobile ? '5rem' : '8rem'
      }}
      className="fixed bg-gradient-to-br from-slate-900 via-obsidian to-slate-900 z-[9999] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] flex flex-col animate-slide-up rounded-[2.5rem] sm:rounded-[3rem] border border-white/10 overflow-hidden font-display"
    >
      {/* Header */}
      <div className="p-8 border-b border-white/10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 bg-white/5 border border-white/10 text-primary rounded-2xl flex items-center justify-center font-black italic text-xl shadow-2xl">
              {receiverName?.charAt(0) || 'P'}
            </div>
          </div>
          <div>
            <h3 className="text-base font-black italic uppercase leading-none tracking-widest text-white">{receiverName || 'Pilot'}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">COMM-LINK ACTIVE</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {receiverPhone && (
            <a href={`tel:${receiverPhone}`} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-obsidian transition-all shadow-xl">
              <Phone size={16} />
            </a>
          )}
          <button onClick={onClose} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/20">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 opacity-20">
              <MessageSquare size={32} className="text-primary" />
            </div>
            <p className="font-black italic uppercase tracking-[0.3em] text-[10px] text-white/20 leading-relaxed">No transmission logs detected.<br/>Initiate communication protocol.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = String(msg.senderId || msg.sender_id) === String(user?.id);
            const rawDate = msg.timestamp || msg.created_at;
            let timeStr = '...';
            
            if (rawDate) {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            }

            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl shadow-2xl text-xs ${
                  isMe 
                  ? 'bg-primary text-obsidian font-bold rounded-br-none shadow-glow-saffron/20' 
                  : 'bg-white/5 text-white/90 rounded-bl-none border border-white/10'
                }`}>
                  <p className="leading-relaxed">{msg.message}</p>
                  <div className={`flex items-center gap-2 mt-3 text-[11px] font-black uppercase tracking-tighter ${isMe ? 'text-obsidian/60' : 'text-white/60'}`}>
                    <Clock size={10} />
                    {timeStr}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-obsidian border-t border-white/5 relative z-10">
        <div className="flex gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-inner focus-within:border-primary/50 transition-colors">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="TYPE SECURE MESSAGE..." 
            className="flex-1 bg-transparent border-none outline-none px-4 font-black uppercase tracking-widest text-[11px] text-white placeholder:text-white/10"
          />
          <button 
            onClick={sendMessage}
            className="w-14 h-14 bg-primary text-obsidian rounded-xl flex items-center justify-center hover:scale-[1.05] active:scale-95 transition-all shadow-glow-saffron shrink-0"
          >
            <Send size={18} className="text-obsidian" />
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpChat {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slideUpChat 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>,
    document.body
  );
};

export default Chat;
