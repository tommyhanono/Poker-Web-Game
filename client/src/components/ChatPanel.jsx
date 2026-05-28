import { useState, useRef, useEffect } from 'react';
import socket from '../socket';

const EMOJIS = ['👏', '😂', '😱', '🃏', '🤑', '😤', '💀', '🎰'];

export default function ChatPanel({ room, playerId }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages, open]);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('send_message', { text: text.trim() });
    setText('');
  };

  const sendEmoji = (emoji) => {
    socket.emit('send_message', { emoji });
  };

  const messages = room.messages || [];
  const unread = messages.length;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-4 z-30 w-10 h-10 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-lg hover:bg-black/90 transition-colors"
      >
        💬
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">{Math.min(unread, 9)}</span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-16 z-30 w-64 panel flex flex-col" style={{ maxHeight: '40vh' }}>
          <div className="flex items-center justify-between p-2 border-b border-white/10">
            <span className="text-xs font-bold text-gray-300">Chat</span>
            <button className="text-gray-400 hover:text-white text-xs" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Emoji row */}
          <div className="flex gap-1 p-2 border-b border-white/10 flex-wrap">
            {EMOJIS.map(e => (
              <button key={e} className="text-lg hover:scale-125 transition-transform" onClick={() => sendEmoji(e)}>{e}</button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin flex flex-col gap-1" style={{ minHeight: 80 }}>
            {messages.map(m => (
              <div key={m.id} className={`text-xs ${m.playerId === playerId ? 'text-right' : ''}`}>
                <span className="text-gray-500">{m.playerName}: </span>
                <span className="text-white">{m.text || m.emoji}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-1 p-2 border-t border-white/10">
            <input
              className="input-field text-xs flex-1 py-1"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Message..."
              maxLength={100}
            />
            <button className="btn-action btn-primary text-xs px-2 py-1" onClick={send}>→</button>
          </div>
        </div>
      )}
    </>
  );
}
