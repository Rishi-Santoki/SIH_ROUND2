import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Send, MoreVertical, Edit2, Trash2, Check, X, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { supabase } from '../../lib/supabase';

interface BackendMessage {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  reply_to_id?: string | null;
  is_edited?: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
}

interface Conversation {
  conversation_id: string;
  created_at: string;
  updated_at?: string;
  last_message_at?: string;
  other_participant?: {
    user_id: string;
    full_name: string;
    role: string;
  };
  unread_count?: number;
}

export function SharedMessages() {
  const { conversationId: routeConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeConvoId, setActiveConvoId] = useState<string | null>(routeConversationId || null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Get current user ID from Supabase session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  // 1. Fetch Conversations
  const { data: conversations = [], isLoading: isLoadingThreads } = useQuery({
    queryKey: ['community', 'conversations'],
    queryFn: async () => {
      try {
        return await apiClient.get<Conversation[]>('/community/conversations');
      } catch {
        return [];
      }
    }
  });

  // Select active conversation on load or route change
  useEffect(() => {
    if (routeConversationId) {
      setActiveConvoId(routeConversationId);
    } else if (conversations.length > 0 && !activeConvoId) {
      setActiveConvoId(conversations[0].conversation_id);
    }
  }, [routeConversationId, conversations, activeConvoId]);

  // 2. Fetch Messages for active conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['community', 'messages', activeConvoId],
    queryFn: async () => {
      if (!activeConvoId) return [];
      try {
        return await apiClient.get<BackendMessage[]>(`/community/conversations/${activeConvoId}/messages`);
      } catch {
        return [];
      }
    },
    enabled: !!activeConvoId
  });

  // Mark active thread read
  useEffect(() => {
    if (activeConvoId) {
      apiClient.patch(`/community/conversations/${activeConvoId}/read`).catch(() => {});
    }
  }, [activeConvoId]);

  // 3. Send Message Mutation
  const sendMutation = useApiMutation({
    mutationFn: async (messageText: string) => {
      return await apiClient.post(`/community/conversations/${activeConvoId}/messages`, {
        message: messageText,
        reply_to_id: null
      });
    },
    invalidateQueries: [
      ['community', 'messages', activeConvoId],
      ['community', 'conversations']
    ],
    onSuccess: () => {
      setInputText('');
    }
  });

  // 4. Edit Message Mutation
  const editMutation = useApiMutation({
    mutationFn: async ({ messageId, newContent }: { messageId: string; newContent: string }) => {
      return await apiClient.patch(`/community/messages/${messageId}`, {
        message: newContent
      });
    },
    invalidateQueries: [
      ['community', 'messages', activeConvoId],
      ['community', 'conversations']
    ],
    onSuccess: () => {
      setEditingMessageId(null);
      setEditText('');
    }
  });

  // 5. Delete Message Mutation
  const deleteMutation = useApiMutation({
    mutationFn: async (messageId: string) => {
      return await apiClient.delete(`/community/messages/${messageId}`);
    },
    invalidateQueries: [
      ['community', 'messages', activeConvoId],
      ['community', 'conversations']
    ]
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvoId) return;
    sendMutation.mutate(inputText.trim());
  };

  const handleStartEdit = (msg: BackendMessage) => {
    setEditingMessageId(msg.message_id);
    setEditText(msg.message);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editText.trim()) return;
    editMutation.mutate({ messageId: msgId, newContent: editText.trim() });
  };

  const activeThread = conversations.find(c => c.conversation_id === activeConvoId);
  const otherPersonName = activeThread?.other_participant?.full_name || 'Conversation';
  const otherPersonRole = activeThread?.other_participant?.role || 'User';

  const filteredThreads = conversations.filter(c => {
    const name = c.other_participant?.full_name?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row bg-white border border-hairline rounded-sm shadow-sm overflow-hidden">
      
      {/* Threads List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-hairline flex flex-col bg-paper">
        <div className="p-4 border-b border-hairline">
          <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-slate" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..." 
              className="flex-1 bg-transparent text-sm focus:outline-none" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingThreads ? (
            <div className="p-6 text-center text-xs text-slate">Loading threads...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate">
              No conversations found. Reach out to alumni in the Alumni Network to start one!
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.conversation_id === activeConvoId;
              const name = thread.other_participant?.full_name || 'Alumni Partner';
              const role = thread.other_participant?.role || 'Alumni';
              const timeStr = thread.last_message_at 
                ? new Date(thread.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={thread.conversation_id}
                  onClick={() => {
                    setActiveConvoId(thread.conversation_id);
                    navigate(`/student/messages/${thread.conversation_id}`);
                  }}
                  className={cn(
                    "p-4 border-b border-hairline cursor-pointer transition-colors border-l-4",
                    isActive ? "bg-white border-l-ink" : "hover:bg-white/50 border-l-transparent"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-ink text-sm">{name}</h4>
                    {timeStr && <span className="text-[10px] text-slate font-medium">{timeStr}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate capitalize">{role}</span>
                    {thread.unread_count && thread.unread_count > 0 ? (
                      <span className="h-4 min-w-[1rem] px-1 bg-ink text-paper rounded-full text-[10px] font-bold flex items-center justify-center">
                        {thread.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <div className="h-16 border-b border-hairline px-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-ink">{otherPersonName}</h3>
            <p className="text-xs text-slate capitalize">{otherPersonRole} • ProofLedger Community</p>
          </div>
          <button className="text-slate hover:text-ink"><MoreVertical className="h-5 w-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate/5">
          {isLoadingMessages ? (
            <div className="text-center text-xs text-slate py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-xs text-slate py-12 flex flex-col items-center">
              <MessageSquare className="h-8 w-8 text-slate/40 mb-2" />
              <span>No messages yet. Send a message to start the conversation!</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const isEditing = editingMessageId === msg.message_id;
              const timeStr = msg.created_at 
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div key={msg.message_id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[70%] group", isMe ? "items-end" : "items-start")}>
                    {msg.is_deleted ? (
                      <div className="bg-paper border border-hairline text-slate italic px-4 py-2 rounded-sm text-sm">
                        [Message deleted]
                      </div>
                    ) : isEditing ? (
                      <div className="bg-white border border-hairline p-2 rounded-sm flex items-center gap-2 shadow-sm">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-sm px-2 py-1 border border-hairline rounded-sm flex-1 focus:outline-none focus:border-ink"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(msg.message_id)}
                          disabled={editMutation.isPending}
                          className="p-1 text-growth-teal hover:bg-slate/10 rounded-sm"
                          title="Save Edit"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="p-1 text-slate hover:bg-slate/10 rounded-sm"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isMe && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mr-1">
                            <button 
                              onClick={() => handleStartEdit(msg)} 
                              className="p-1 text-slate hover:text-ink rounded-sm"
                              title="Edit Message"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => deleteMutation.mutate(msg.message_id)} 
                              className="p-1 text-slate hover:text-alert-rust rounded-sm"
                              title="Delete Message"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <div className={cn(
                          "px-4 py-2 rounded-sm text-sm break-words",
                          isMe ? "bg-ink text-paper" : "bg-white border border-hairline text-ink"
                        )}>
                          {msg.message}
                          {msg.is_edited && (
                            <span className="text-[10px] ml-1.5 opacity-70 italic">(edited)</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className={cn("text-[10px] text-slate mt-1 font-medium", isMe && "text-right")}>
                      {timeStr}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-white border-t border-hairline">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Write a message..." 
              disabled={!activeConvoId || sendMutation.isPending}
              className="flex-1 bg-paper border border-hairline rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-ink disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || !activeConvoId || sendMutation.isPending}
              className="bg-ink text-paper p-2.5 rounded-sm hover:bg-ink/90 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
