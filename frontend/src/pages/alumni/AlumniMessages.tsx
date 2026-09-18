import React, { useState, useEffect } from 'react';
import { Search, Send, Trash2, MessageSquare, Loader2, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { cn } from '../../lib/utils';

interface ParticipantInfo {
  user_id: string;
  full_name: string;
  role: string;
}

interface Conversation {
  conversation_id: string;
  last_message_at: string;
  is_active: boolean;
  unread_count: number;
  other_participant?: ParticipantInfo;
}

interface MessageItem {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  reply_to_id?: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
}

export function AlumniMessages() {
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');

  // 1. Fetch conversations
  const { data: conversations = [], isLoading: isConvosLoading } = useQuery<Conversation[]>({
    queryKey: ['community-conversations'],
    queryFn: () => apiClient.get<Conversation[]>('/community/conversations')
  });

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConvoId) {
      setSelectedConvoId(conversations[0].conversation_id);
    }
  }, [conversations, selectedConvoId]);

  const activeConvo = conversations.find(c => c.conversation_id === selectedConvoId);

  // 2. Fetch messages for active conversation
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery<MessageItem[]>({
    queryKey: ['community-messages', selectedConvoId],
    queryFn: () => apiClient.get<MessageItem[]>(`/community/conversations/${selectedConvoId}/messages`),
    enabled: Boolean(selectedConvoId)
  });

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedConvoId) {
      apiClient.patch(`/community/conversations/${selectedConvoId}/read`).catch(() => {});
    }
  }, [selectedConvoId]);

  // 3. Send message mutation
  const sendMutation = useApiMutation({
    mutationFn: (text: string) =>
      apiClient.post(`/community/conversations/${selectedConvoId}/messages`, { message: text }),
    invalidateQueries: [
      ['community-messages', selectedConvoId],
      ['community-conversations']
    ],
    onSuccess: () => {
      setInputText('');
    }
  });

  // 4. Delete message mutation
  const deleteMutation = useApiMutation({
    mutationFn: (messageId: string) =>
      apiClient.delete(`/community/messages/${messageId}`),
    invalidateQueries: [['community-messages', selectedConvoId]]
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvoId || sendMutation.isPending) return;
    sendMutation.mutate(inputText.trim());
  };

  const handleDelete = (messageId: string) => {
    deleteMutation.mutate(messageId);
  };

  if (isConvosLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-white border border-hairline rounded-sm shadow-sm p-8 text-center">
        <div className="flex items-center gap-2 text-slate text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-ink" /> Loading conversations...
        </div>
      </div>
    );
  }

  // Strictly follow requirement: No start conversation button exists anywhere
  if (conversations.length === 0) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-white border border-hairline rounded-sm shadow-sm p-8 text-center">
        <div className="max-w-sm space-y-4">
          <div className="w-16 h-16 bg-slate/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-8 w-8 text-slate" />
          </div>
          <h2 className="text-lg font-bold text-ink">No Messages Yet</h2>
          <p className="text-sm text-slate leading-relaxed">
            When a student or faculty member at your institution reaches out, their message will appear here.
          </p>
          <p className="text-xs font-bold text-slate uppercase tracking-wider pt-4">
            Note: Alumni can only reply to incoming conversations.
          </p>
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(c => {
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
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(convo => {
            const isSelected = convo.conversation_id === selectedConvoId;
            const otherName = convo.other_participant?.full_name || 'Participant';
            const role = convo.other_participant?.role || 'Member';
            const timeStr = convo.last_message_at 
              ? new Date(convo.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div 
                key={convo.conversation_id}
                onClick={() => setSelectedConvoId(convo.conversation_id)}
                className={cn(
                  "p-4 border-b border-hairline cursor-pointer transition-colors",
                  isSelected ? "bg-white border-l-4 border-l-ink" : "hover:bg-slate/5"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-ink text-sm">{otherName}</h4>
                  {timeStr && <span className="text-[10px] text-slate font-medium">{timeStr}</span>}
                </div>
                <div className="flex items-center justify-between text-xs text-slate">
                  <span className="capitalize">{role}</span>
                  {convo.unread_count > 0 && (
                    <span className="bg-growth-teal text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {convo.unread_count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      {activeConvo ? (
        <div className="flex-1 flex flex-col bg-white min-w-0">
          <div className="h-16 border-b border-hairline px-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink">{activeConvo.other_participant?.full_name || 'Participant'}</h3>
              <p className="text-xs text-slate capitalize">
                {activeConvo.other_participant?.role || 'Member'} • Proof Ledger Contact
              </p>
            </div>
            <div className="text-xs font-medium text-slate">
              Reply-only channel
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate/5">
            {isMessagesLoading ? (
              <div className="py-12 text-center text-slate text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-ink" /> Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-slate text-sm">
                No messages in this conversation yet. Send a reply below.
              </div>
            ) : (
              messages.map(msg => {
                const otherId = activeConvo.other_participant?.user_id;
                const isMe = msg.sender_id !== otherId;
                const time = msg.created_at 
                  ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '';

                return (
                  <div key={msg.message_id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] group", isMe ? "items-end" : "items-start")}>
                      {msg.is_deleted ? (
                        <div className="bg-paper border border-hairline text-slate italic px-4 py-2 rounded-sm text-sm">
                          [Message deleted]
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {isMe && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mr-2">
                              <button 
                                onClick={() => handleDelete(msg.message_id)} 
                                disabled={deleteMutation.isPending}
                                className="p-1 text-slate hover:text-alert-rust rounded-sm transition-colors cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <div className={cn(
                            "px-4 py-2 rounded-sm text-sm",
                            isMe ? "bg-ink text-paper" : "bg-white border border-hairline text-ink"
                          )}>
                            {msg.message}
                          </div>
                        </div>
                      )}
                      <div className={cn("text-[10px] text-slate mt-1 font-medium", isMe && "text-right")}>
                        {time}
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
                placeholder="Reply to this conversation..." 
                disabled={sendMutation.isPending}
                className="flex-1 bg-paper border border-hairline rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-ink disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!inputText.trim() || sendMutation.isPending}
                className="bg-ink text-paper p-2.5 rounded-sm hover:bg-ink/90 disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate text-sm">
          Select a conversation from the list to view and reply.
        </div>
      )}

    </div>
  );
}
