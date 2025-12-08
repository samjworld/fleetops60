
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Button } from '../components/ui/Common';
import { Send, Trash2, Edit2, X, Check, MessageSquare } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { ChatMessage } from '../types';

export const TeamChat = () => {
  const { chatMessages, sendChatMessage, deleteChatMessage, editChatMessage, getCurrentSystemIdentity, currentRole, markChatRead } = useApp();
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = getCurrentSystemIdentity();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Mark messages as read when entering chat
    markChatRead();
  }, [chatMessages, markChatRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendChatMessage(inputText);
      setInputText('');
    }
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditText(msg.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) {
      editChatMessage(id, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Are you sure you want to delete this message?")) {
          deleteChatMessage(id);
      }
  };

  // Group messages by date could be an enhancement, keeping it simple for now
  
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Team Chat
          </h2>
          <span className="text-sm text-slate-500">Global channel for all departments</span>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-slate-200">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
           {chatMessages.length === 0 && (
               <div className="text-center text-slate-400 mt-10">
                   No messages yet. Start the conversation!
               </div>
           )}
           
           {chatMessages.map((msg) => {
             const isMe = msg.user_id === currentUser.id;
             
             return (
               <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                     
                     {/* Avatar / Initial */}
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                        {msg.user_name.charAt(0)}
                     </div>

                     {/* Message Bubble */}
                     <div className={`group relative p-3 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                        {/* Header Info */}
                        <div className={`text-xs mb-1 flex items-center gap-2 ${isMe ? 'text-blue-200 justify-end' : 'text-slate-500'}`}>
                           <span className="font-bold">{msg.user_name}</span>
                           <span className="opacity-75">({msg.role})</span>
                        </div>

                        {/* Content or Edit Form */}
                        {editingId === msg.id ? (
                            <div className="flex items-center gap-2 bg-white/10 p-1 rounded">
                                <input 
                                  type="text" 
                                  value={editText} 
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="bg-transparent border-b border-white/50 focus:outline-none text-inherit w-full min-w-[200px]"
                                  autoFocus
                                />
                                <button onClick={() => saveEdit(msg.id)} className="p-1 hover:bg-white/20 rounded"><Check size={14}/></button>
                                <button onClick={cancelEdit} className="p-1 hover:bg-white/20 rounded"><X size={14}/></button>
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        )}
                        
                        {/* Metadata */}
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-blue-200 justify-end' : 'text-slate-400'}`}>
                           {formatDateTime(msg.timestamp)}
                           {msg.is_edited && <span>(edited)</span>}
                        </div>

                        {/* Action Buttons (Only for owner) */}
                        {isMe && !editingId && (
                           <div className="absolute top-2 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                               <button onClick={() => startEdit(msg)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600">
                                   <Edit2 size={12} />
                               </button>
                               <button onClick={() => handleDelete(msg.id)} className="p-1.5 bg-red-100 hover:bg-red-200 rounded-full text-red-600">
                                   <Trash2 size={12} />
                               </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             );
           })}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSend} className="flex gap-2">
               <input 
                 type="text" 
                 placeholder={`Message as ${currentUser.name}...`}
                 className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
               />
               <Button type="submit" className="rounded-full w-12 h-10 p-0 flex items-center justify-center">
                  <Send size={18} />
               </Button>
            </form>
        </div>
      </Card>
    </div>
  );
};
