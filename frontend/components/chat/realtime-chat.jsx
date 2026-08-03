"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Paperclip,
  Send,
  ArrowLeft,
  Search,
  Smile,
  X,
  ChevronDown,
  MoreVertical,
  Image as ImageIcon,
} from "lucide-react";
import { MessageBubble } from "@/components/message-bubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getOrCreateConversation,
} from "@/lib/services/messageService";
import { useUser } from "@/components/providers/UserProvider";

// Small set of quick-access emoji — keeps the picker lightweight, no extra deps
const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🙏", "😮", "😢", "🔥"];

// Groups consecutive messages by calendar day so we can render date dividers
function groupMessagesByDay(messages) {
  const groups = [];
  let currentDay = null;
  let currentGroup = null;

  for (const msg of messages) {
    const day = new Date(msg.createdAt).toDateString();
    if (day !== currentDay) {
      currentDay = day;
      currentGroup = { day, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(msg);
  }
  return groups;
}

function formatDayLabel(dayString) {
  const date = new Date(dayString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

export function RealtimeChat({ emit }) {
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);

  // --- New UI state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);

  // Initial Data Load
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setIsLoadingConversations(true);
        const convosData = await getConversations();
        setConversations(convosData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsLoadingConversations(false);
      }
    }
    fetchInitialData();
  }, []);

  // Socket Events Setup
  useEffect(() => {
    const handleNewMessage = (e) => {
      const msg = e.detail;
      if (msg.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        markMessagesAsRead(activeConversationId).then(() => {
          window.dispatchEvent(new CustomEvent("messages:read"));
        });
      } else {
        getConversations().then(setConversations);
      }
    };

    window.addEventListener("message:receive", handleNewMessage);

    return () => {
      window.removeEventListener("message:receive", handleNewMessage);
    };
  }, [activeConversationId]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // Load Messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      emit("leave_conversation", { conversationId: activeConversationId });

      async function loadMessages() {
        setIsLoadingMessages(true);
        try {
          const msgs = await getMessages(activeConversationId);
          setMessages(msgs);
          await markMessagesAsRead(activeConversationId);
          window.dispatchEvent(new CustomEvent("messages:read"));
        } finally {
          setIsLoadingMessages(false);
        }
      }
      loadMessages();

      emit("join_conversation", { conversationId: activeConversationId });
    }
  }, [activeConversationId, emit]);

  // Auto-scroll, with smart "scroll to bottom" detection
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (isNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      setShowScrollToBottom(false);
    } else {
      setShowScrollToBottom(true);
    }
  }, [messages, otherIsTyping]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollToBottom(distanceFromBottom > 200);
  };

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
    setShowScrollToBottom(false);
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !pendingAttachment) || !activeConversationId || isSending) return;

    const tempText = messageText;
    setMessageText("");
    setPendingAttachment(null);
    setShowEmojiPicker(false);
    setIsSending(true);

    clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    emit("typing", { conversationId: activeConversationId, isTyping: false });

    try {
      const msg = await sendMessage(activeConversationId, tempText);
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversationId ? { ...c, lastMessage: tempText } : c
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // restore text so the person doesn't lose their draft on failure
      setMessageText(tempText);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);

    if (!isTyping && activeConversationId) {
      setIsTyping(true);
      emit("typing", { conversationId: activeConversationId, isTyping: true });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emit("typing", { conversationId: activeConversationId, isTyping: false });
    }, 2000);
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAttachment({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      isImage: file.type.startsWith("image/"),
    });
    e.target.value = "";
  };

  const removeAttachment = () => {
    if (pendingAttachment?.url) URL.revokeObjectURL(pendingAttachment.url);
    setPendingAttachment(null);
  };

  const activePartner = useMemo(() => {
    const conv = conversations.find((c) => c._id === activeConversationId);
    if (!conv || !conv.participants) return null;
    return conv.participants.find((p) => p._id !== user?._id && p.id !== user?._id) || null;
  }, [conversations, activeConversationId, user]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((c) => {
      const partner = c.participants?.find((p) => p._id !== user?._id && p.id !== user?._id);
      if (!partner) return false;
      return (
        partner.name?.toLowerCase().includes(query) ||
        partner.role?.toLowerCase().includes(query) ||
        c.lastMessage?.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery, user]);

  const messageGroups = useMemo(() => groupMessagesByDay(messages), [messages]);

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[480px] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm md:min-h-[560px]">
      {/* ----------------- Sidebar: Chats ----------------- */}
      <aside
        className={`w-full flex-shrink-0 flex-col border-r border-[var(--border)] md:w-[300px] lg:w-[320px] ${
          activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex-none border-b border-[var(--border)] p-4">
          <p className="mb-3 text-sm font-semibold text-[var(--text-main)]">Messages</p>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="bg-[var(--surface)] pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {isLoadingConversations ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl p-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                    <div className="h-2.5 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <p className="text-sm font-medium text-[var(--text-main)]">
                {searchQuery ? "No matches found" : "No chats yet"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {searchQuery
                  ? "Try searching for a different name or message content."
                  : "Matches will appear here once interest is mutual."}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const partner = conv.participants?.find((p) => p._id !== user?._id && p.id !== user?._id);
              if (!partner) return null;
              const isActive = activeConversationId === conv._id;
              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveConversationId(conv._id)}
                  className={`w-full rounded-xl p-3 text-left text-sm transition-colors ${
                    isActive ? "bg-[var(--accent)]/10" : "hover:bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {partner.avatar ? (
                        <img
                          src={partner.avatar}
                          alt={partner.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                          {partner.name?.charAt(0)}
                        </div>
                      )}
                      {partner.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-[var(--text-main)]">
                          {partner.name}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs capitalize text-[var(--text-muted)]">
                        {conv.lastMessage || partner.role}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ----------------- Main Chat Panel ----------------- */}
      <section
        className={`flex-1 min-w-0 flex-col h-full ${
          !activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeConversationId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-[var(--text-muted)]">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)]">
              <Send size={20} className="text-[var(--text-muted)]" />
            </div>
            <p className="font-medium text-[var(--text-main)]">Select a chat</p>
            <p className="text-sm">Choose a conversation from your list to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex-none border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="-ml-2 rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-slate-200/50 hover:text-[var(--text-main)] md:hidden"
                  onClick={() => setActiveConversationId(null)}
                  aria-label="Back to chats"
                >
                  <ArrowLeft size={18} />
                </button>

                {activePartner?.avatar ? (
                  <img
                    src={activePartner.avatar}
                    alt={activePartner.name}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                    {activePartner?.name?.charAt(0) || "?"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-main)]">
                    {activePartner?.name || "Chat"}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {otherIsTyping ? (
                      <span className="text-[var(--accent)]">typing...</span>
                    ) : activePartner?.online ? (
                      "Online"
                    ) : (
                      activePartner?.role
                    )}
                  </p>
                </div>

                <button
                  className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-slate-200/50 hover:text-[var(--text-main)]"
                  aria-label="More options"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="relative flex-1 min-h-0">
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex h-full flex-col space-y-1 overflow-y-auto bg-[var(--surface)] p-4"
              >
                {isLoadingMessages ? (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-muted)]" />
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-[var(--text-muted)]">
                    <p className="text-sm font-medium text-[var(--text-main)]">No messages yet</p>
                    <p className="text-xs">Say hello to start the conversation.</p>
                  </div>
                ) : (
                  messageGroups.map((group) => (
                    <div key={group.day}>
                      <div className="my-3 flex items-center justify-center">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[var(--text-muted)] shadow-sm">
                          {formatDayLabel(group.day)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((msg, index) => {
                          const isMe =
                            msg.sender?._id === user?._id || msg.sender === user?._id;
                          const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          return (
                            <MessageBubble
                              key={msg._id ? `${msg._id}-${index}` : index}
                              text={msg.text}
                              me={isMe}
                              read={msg.seen}
                              time={timeStr}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}

                {otherIsTyping && (
                  <div className="flex items-center gap-1 self-start rounded-2xl bg-white px-3 py-2 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)]" />
                  </div>
                )}
              </div>

              {/* Scroll to bottom button */}
              {showScrollToBottom && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--text-main)] shadow-md transition-transform hover:scale-105"
                  aria-label="Scroll to latest messages"
                >
                  <ChevronDown size={16} />
                </button>
              )}
            </div>

            {/* Attachment preview */}
            {pendingAttachment && (
              <div className="flex-none border-t border-[var(--border)] bg-white px-3 pt-3">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
                  {pendingAttachment.isImage ? (
                    <img
                      src={pendingAttachment.url}
                      alt={pendingAttachment.name}
                      className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200">
                      <Paperclip size={14} className="text-slate-600" />
                    </div>
                  )}
                  <p className="flex-1 truncate text-xs text-[var(--text-main)]">
                    {pendingAttachment.name}
                  </p>
                  <button
                    onClick={removeAttachment}
                    className="flex-shrink-0 rounded-full p-1 text-[var(--text-muted)] hover:bg-slate-200/60"
                    aria-label="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="relative flex-none border-t border-[var(--border)] bg-white p-3">
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-full left-3 mb-2 grid grid-cols-4 gap-1 rounded-xl border border-[var(--border)] bg-white p-2 shadow-lg"
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="rounded-lg p-1.5 text-lg transition-colors hover:bg-[var(--surface)]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,.doc,.docx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 rounded-lg border border-[var(--border)] p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)]"
                  aria-label="Attach file"
                >
                  <Paperclip size={16} />
                </button>

                <button
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className={`hidden flex-shrink-0 rounded-lg border border-[var(--border)] p-2 transition-colors sm:block ${
                    showEmojiPicker
                      ? "bg-[var(--surface)] text-[var(--text-main)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface)]"
                  }`}
                  aria-label="Add emoji"
                >
                  <Smile size={16} />
                </button>

                <Input
                  ref={inputRef}
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="bg-[var(--surface)]"
                />

                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={isSending || (!messageText.trim() && !pendingAttachment)}
                  className="flex-shrink-0 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}