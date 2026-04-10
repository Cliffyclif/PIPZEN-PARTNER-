"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDateTime } from "@/lib/utils";
import { Send, Loader2, MessageSquare } from "lucide-react";

interface Contact {
  id: string;
  fullName: string | null;
  email: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; fullName: string | null; email: string };
}

interface MessagingClientProps {
  currentUserId: string;
  contacts: Contact[];
}

export function MessagingClient({ currentUserId, contacts }: MessagingClientProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
      const interval = setInterval(() => loadMessages(selectedContact.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages(partnerId: string) {
    const res = await fetch(`/api/messages/${partnerId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }

  async function sendMessage() {
    if (!selectedContact || !newMessage.trim()) return;
    setSending(true);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: selectedContact.id, content: newMessage }),
    });

    if (res.ok) {
      setNewMessage("");
      loadMessages(selectedContact.id);
    }
    setSending(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Contact List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm">Contacts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedContact(c)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50",
                  selectedContact?.id === c.id && "bg-slate-700/50"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs">
                    {(c.fullName || c.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.fullName || c.email}</p>
                  <p className="text-xs text-slate-400 truncate">{c.email}</p>
                </div>
              </button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Thread */}
      <Card className="bg-slate-800/50 border-slate-700 md:col-span-2 flex flex-col">
        {selectedContact ? (
          <>
            <CardHeader className="pb-3 border-b border-slate-700">
              <CardTitle className="text-white text-sm">
                {selectedContact.fullName || selectedContact.email}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((m) => {
                    const isMe = m.sender.id === currentUserId;
                    return (
                      <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[70%] rounded-lg px-3 py-2",
                          isMe ? "bg-amber-500/20 text-white" : "bg-slate-700 text-white"
                        )}>
                          <p className="text-sm">{m.content}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDateTime(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-slate-700 flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a contact to start messaging</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
