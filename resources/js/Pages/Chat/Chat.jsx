import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send, ArrowLeft, User, Phone, MapPin, Clock,
    Check, CheckCheck, Image as ImageIcon, X,
    Search, MoreVertical, Hash, Info, MessageSquare,
    ShoppingBag, Trash2, Camera
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';


const Chat = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showConversationList, setShowConversationList] = useState(true);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initial Fetch & Poll
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    // Message Polling when conversation is selected
    useEffect(() => {
        let messageInterval;
        if (selectedConversation) {
            fetchMessages();
            markAsRead();
            messageInterval = setInterval(fetchMessages, 3000);
        }
        return () => {
            if (messageInterval) clearInterval(messageInterval);
        };
    }, [selectedConversation?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const response = await axios.get('/api/v1/chat/conversations');
            setConversations(response.data.data?.conversations || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!selectedConversation) return;
        try {
            const response = await axios.get(`/api/v1/chat/conversations/${selectedConversation.id}/messages`);
            const fetched = response.data.data?.messages || [];

            setMessages(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(fetched)) {
                    return fetched;
                }
                return prev;
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const markAsRead = async () => {
        if (!selectedConversation) return;
        try {
            await axios.post(`/api/v1/chat/conversations/${selectedConversation.id}/mark-read`);
            // Slightly delayed to let server update
            setTimeout(fetchConversations, 500);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;
        setSending(true);
        const tempMsg = newMessage;
        setNewMessage('');
        try {
            const response = await axios.post(`/api/v1/chat/conversations/${selectedConversation.id}/messages`, {
                message: tempMsg,
            });
            const sentMsg = response.data.data?.message;
            setMessages(prev => [...prev, sentMsg]);
            fetchConversations();
        } catch (error) {
            setNewMessage(tempMsg);
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDateSeparator = (date) => {
        const d = new Date(date);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'اليوم';
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'أمس';
        return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
    };

    const getRoleBadge = (role) => {
        const badges = {
            customer: { label: 'زبون', color: 'bg-indigo-50 text-indigo-600', icon: <User size={10} /> },
            store_owner: { label: 'متجر', color: 'bg-amber-50 text-amber-600', icon: <ShoppingBag size={10} /> },
            driver: { label: 'توصيل', color: 'bg-rose-50 text-rose-600', icon: <Clock size={10} /> },
            admin: { label: 'إدارة', color: 'bg-purple-50 text-purple-600', icon: <Hash size={10} /> },
        };
        return badges[role] || { label: role, color: 'bg-slate-50 text-slate-600', icon: null };
    };

    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            const name = c.display_name?.toLowerCase() || '';
            const msg = c.last_message?.message?.toLowerCase() || '';
            const query = searchTerm.toLowerCase();
            return name.includes(query) || msg.includes(query);
        });
    }, [conversations, searchTerm]);

    const otherMember = useMemo(() => {
        if (!selectedConversation) return null;
        return selectedConversation.participants?.find(p => p.id != user?.id) || {};
    }, [selectedConversation, user]);

    return (
        <div className="h-[calc(100vh-4.5rem)] bg-slate-50 flex items-center justify-center p-0 md:p-4 overflow-hidden" dir="rtl">
            <div className="w-full h-full max-w-7xl flex bg-white/70 backdrop-blur-3xl rounded-none md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden relative">

                {/* Left Sidebar: Conversations */}
                <div className={`${showConversationList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[24rem] border-l border-slate-100/50 bg-white/40 z-10 relative`}>

                    {/* Sidebar Header */}
                    <div className="p-6 pb-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                المحادثات
                                <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">
                                    {conversations.length}
                                </span>
                            </h2>
                            {/* <Button variant="unstyled"
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95"
                            >
                                <ArrowLeft size={18} className="translate-x-0.5" />
                            </Button> */}
                        </div>

                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="ابحث عن محادثة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full py-4 pr-12 pl-4 bg-slate-100/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-brand focus:shadow-xl focus:shadow-brand/5 outline-none transition-all font-bold text-sm"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
                        {loading && conversations.length === 0 ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-slate-100/50 rounded-2xl animate-pulse" />
                            ))
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
                                <MessageSquare size={48} strokeWidth={1} className="mb-4" />
                                <p className="font-bold">لا توجد نتائج</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const active = selectedConversation?.id === conv.id;
                                const other = conv.participants?.find(p => p.id != user?.id) || {};
                                const badge = getRoleBadge(other.role);
                                const isOrder = conv.type === 'order';

                                return (
                                    <Button variant="unstyled"
                                        key={conv.id}
                                        onClick={() => {
                                            setSelectedConversation(conv);
                                            setShowConversationList(false);
                                        }}
                                        className={`w-full group relative p-4 rounded-[1.5rem] flex items-center gap-4 transition-all duration-300 ${active
                                            ? 'bg-brand shadow-2xl shadow-brand/20 text-white'
                                            : 'hover:bg-brand/5 active:scale-[0.98]'
                                            }`}
                                    >
                                        <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center font-black text-xl shadow-lg border-2 ${active ? 'border-white/20 bg-white/20' : 'border-white bg-gradient-to-br from-brand/10 to-rose-500/10 text-brand'
                                            }`}>
                                            {conv.display_image ? (
                                                <img src={conv.display_image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                conv.display_name?.charAt(0) || <User size={20} />
                                            )}
                                            <div className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white ${other.is_online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        </div>

                                        <div className="flex-1 text-right min-w-0">
                                            <div className="flex items-center justify-between mb-1 gap-2">
                                                <h3 className={`font-black truncate ${active ? 'text-white' : 'text-slate-900 group-hover:text-brand'}`}>
                                                    {conv.display_name}
                                                </h3>
                                                <span className={`text-[10px] whitespace-nowrap opacity-70 ${active ? 'text-white' : 'text-slate-500'}`}>
                                                    {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                <p className={`text-xs truncate font-medium ${active ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-600'}`}>
                                                    {conv.last_message?.message || 'ابدأ الحديث الآن...'}
                                                </p>
                                                {conv.unread_count > 0 && !active && (
                                                    <span className="flex-shrink-0 w-5 h-5 bg-brand text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                                        {conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {isOrder && (
                                            <div className={`absolute top-2 left-2 p-1 rounded-lg ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <ShoppingBag size={10} />
                                            </div>
                                        )}
                                    </Button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Chat Content */}
                <div className={`${!showConversationList ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-white/60 relative mix-blend-multiply md:mix-blend-normal`}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100/50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                                <div className="flex items-center gap-4">
                                    <Button variant="unstyled"
                                        onClick={() => setShowConversationList(true)}
                                        className="md:hidden p-2 bg-slate-100 rounded-xl active:scale-95 transition-all"
                                    >
                                        <ArrowLeft size={18} className="rotate-180" />
                                    </Button>

                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-brand to-rose-500 rounded-[1.2rem] overflow-hidden flex items-center justify-center text-white font-black text-lg shadow-lg">
                                            {selectedConversation.display_image ? (
                                                <img src={selectedConversation.display_image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                selectedConversation.display_name?.charAt(0)
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-emerald-500/20 shadow-lg" />
                                    </div>

                                    <div>
                                        <h3 className="font-black text-slate-900 leading-none mb-1">
                                            {selectedConversation.display_name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 ${getRoleBadge(otherMember.role).color}`}>
                                                {getRoleBadge(otherMember.role).icon}
                                                {getRoleBadge(otherMember.role).label}
                                            </span>
                                            <span className="text-[10px] text-emerald-500 font-bold animate-pulse">متصل الآن</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* <Button variant="unstyled" className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand/5 rounded-2xl transition-all border border-slate-100 md:border-transparent">
                                        <Phone size={20} />
                                    </Button>
                                    <Button variant="unstyled" className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand/5 rounded-2xl transition-all border border-slate-100 md:border-transparent">
                                        <Info size={20} />
                                    </Button>
                                    <Button variant="unstyled" className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
                                        <MoreVertical size={20} />
                                    </Button> */}
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                        <div className="p-10 bg-brand/5 rounded-full mb-6">
                                            <MessageSquare size={64} strokeWidth={1} className="text-brand/20" />
                                        </div>
                                        <p className="font-black text-lg text-slate-600">لا توجد رسائل بعد</p>
                                        <p className="text-sm font-bold opacity-60">أرسل رسالة لبدء المحادثة</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMe = msg.sender_id == user?.id;
                                        const prevMsg = messages[i - 1];
                                        const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                                        const isSystem = msg.type === 'system';

                                        return (
                                            <React.Fragment key={msg.id || i}>
                                                {showDate && (
                                                    <div className="flex justify-center my-8">
                                                        <span className="px-6 py-2 bg-slate-200/50 backdrop-blur-sm text-slate-500 text-[10px] font-black rounded-full shadow-sm text-center">
                                                            {formatDateSeparator(msg.created_at)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-end gap-3`}>
                                                    {!isMe && (
                                                        <div className="w-8 h-8 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center font-black text-xs text-slate-500 shadow-sm transition-transform group-hover:scale-110">
                                                            {msg.sender_profile_image ? (
                                                                <img src={msg.sender_profile_image} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                msg.sender_name?.charAt(0)
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                                        <div className={`relative px-5 py-4 rounded-[1.8rem] shadow-xl group-hover:shadow-2xl transition-all duration-300 ${isMe
                                                            ? 'bg-gradient-to-br from-brand via-pink-600 to-rose-500 text-white rounded-br-none shadow-brand/10'
                                                            : 'bg-white/80 backdrop-blur-xl text-slate-900 border border-white rounded-bl-none shadow-slate-200/50'
                                                            }`}>
                                                            <p className="text-sm leading-relaxed font-bold whitespace-pre-wrap">{msg.message}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2 px-1">
                                                            <span className="text-[9px] font-black tracking-widest text-slate-400">
                                                                {formatTime(msg.created_at)}
                                                            </span>
                                                            {isMe && (
                                                                msg.is_read ? (
                                                                    <CheckCheck size={14} className="text-sky-500 drop-shadow-sm" />
                                                                ) : (
                                                                    <Check size={14} className="text-slate-300" />
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input Container */}
                            <div className="p-6 md:p-8 bg-transparent">
                                <div className="flex items-end gap-3 md:gap-4 p-2 bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white backdrop-blur-xl sticky bottom-0">
                                    <div className="flex items-center gap-1 md:gap-2 pr-2">
                                        {/* <Button variant="unstyled"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand/5 rounded-2xl transition-all active:scale-90"
                                        >
                                            <ImageIcon size={22} strokeWidth={2} />
                                        </Button>
                                        <Button variant="unstyled" className="hidden sm:flex w-12 h-12 items-center justify-center text-slate-400 hover:text-brand hover:bg-brand/5 rounded-2xl transition-all active:scale-90">
                                            <Camera size={22} strokeWidth={2} />
                                        </Button> */}
                                    </div>

                                    <textarea
                                        rows="1"
                                        placeholder="اكتب رسالتك الذكية هنا..."
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onKeyPress={handleKeyPress}
                                        className="flex-1 py-3 px-2 bg-transparent border-none outline-none resize-none font-bold text-slate-900 placeholder:text-slate-300 custom-scrollbar max-h-32 text-sm md:text-base"
                                    />

                                    <div className="flex items-center gap-2 pl-2">
                                        <Button variant="unstyled"
                                            onClick={sendMessage}
                                            disabled={sending || !newMessage.trim()}
                                            className="w-12 h-12 flex items-center justify-center bg-brand text-white rounded-[1.3rem] shadow-lg shadow-brand/20 hover:shadow-xl active:scale-95 disabled:opacity-30 transition-all group overflow-hidden"
                                        >
                                            {sending ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Send size={20} className="rotate-180 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                            <div className="relative w-48 h-48 mb-6">
                                <div className="absolute inset-0 bg-brand/5 rounded-full animate-ping opacity-20" />
                                <div className="absolute inset-4 bg-brand/10 rounded-full animate-pulse opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center text-brand/20 drop-shadow-2xl">
                                    <MessageSquare size={120} strokeWidth={0.5} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-3">أهلاً بك في نظام المحادثة</h3>
                            <p className="text-slate-400 font-bold max-w-sm text-center leading-relaxed">أبقِ تواصلك مباشراً وفعالاً مع الزبائن، السائقين والمتاجر لتجربة توصيل مثالية</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Styles for scrollbar for premium look */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #e2e8f0;
                }
            `}</style>
        </div>
    );
};

export default Chat;
