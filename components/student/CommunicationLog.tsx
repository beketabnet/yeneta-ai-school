import React, { useState, useRef, useEffect, useContext } from 'react';
import { Message, Attachment, Conversation } from '../../types';
import { apiService } from '../../services/apiService';
import {
    PaperAirplaneIcon,
    PaperclipIcon,
    MicrophoneIcon,
    VideoCameraIcon,
    XCircleIcon,
    CheckIcon,
    CheckCheckIcon,
    TrashIcon,
    ChatBubbleLeftEllipsisIcon,
    MagnifyingGlassIcon,
    PlusIcon
} from '../icons/Icons';
import VideoRecorderModal from '../common/VideoRecorderModal';
import AudioRecorderModal from '../common/AudioRecorderModal';
import MessageAttachment from '../common/MessageAttachment';
import NewConversationModal from '../common/NewConversationModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { AuthContext } from '../../contexts/AuthContext';

const MessageStatus: React.FC<{ status: 'sent' | 'delivered' | 'read' | undefined }> = ({ status }) => {
    if (!status) return null;
    const isRead = status === 'read';
    const iconClass = isRead ? 'text-emerald-500 w-3 h-3' : 'text-gray-400 dark:text-gray-500 w-3 h-3';

    return (
        <span className="flex items-center ml-1" title={status}>
            {status === 'sent' ? <CheckIcon className={iconClass} /> : <CheckCheckIcon className={iconClass} />}
        </span>
    );
};

const AttachmentPreview: React.FC<{ attachment: File, onRemove: () => void }> = ({ attachment, onRemove }) => {
    return (
        <div className="relative group inline-flex items-center gap-2 p-2 pr-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-sm mb-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300">
                <PaperclipIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{attachment.name}</span>
                <span className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</span>
            </div>
            <button
                onClick={onRemove}
                className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                aria-label="Remove attachment"
            >
                <XCircleIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const StudentCommunicationLog: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingConvos, setIsLoadingConvos] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
    const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [deleteConvoConfirmOpen, setDeleteConvoConfirmOpen] = useState(false);

    // Deletion states
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user: currentUser } = useContext(AuthContext);

    useEffect(() => {
        const fetchConversations = async () => {
            setIsLoadingConvos(true);
            setError(null);
            try {
                let convos = await apiService.getConversations();
                // Add display title to each conversation
                convos = convos.map(convo => ({
                    ...convo,
                    conversation_title: convo.participants.find(p => p.id !== currentUser?.id)?.username || 'Unknown User'
                }));
                // Sort by most recent activity
                convos.sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at).getTime();
                    const dateB = new Date(b.updated_at || b.created_at).getTime();
                    return dateB - dateA;
                });
                setConversations(convos);

                // Auto-select first conversation
                if (convos.length > 0 && !selectedConversation) {
                    setSelectedConversation(convos[0]);
                }
            } catch (err) {
                setError("Failed to load conversations.");
            } finally {
                setIsLoadingConvos(false);
            }
        };
        if (currentUser) {
            fetchConversations();
        }
    }, [currentUser]);

    useEffect(() => {
        if (!selectedConversation) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            setError(null);
            try {
                const msgs = await apiService.getMessages(selectedConversation.id);
                setMessages(msgs);
            } catch (err) {
                setError(`Failed to load messages for ${selectedConversation.conversation_title}.`);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [selectedConversation]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !selectedConversation) return;

        setIsSending(true);
        try {
            const sentMessage = await apiService.sendMessage(selectedConversation.id, newMessage, attachment || undefined);
            setMessages(prev => [...prev, { ...sentMessage, status: 'sent' }]);
            setNewMessage('');
            setAttachment(null);

            // Simulate delivered/read status
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === sentMessage.id ? { ...m, status: 'delivered' } : m));
            }, 1000);
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === sentMessage.id ? { ...m, status: 'read' } : m));
            }, 2500);
        } catch (err) {
            setError("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachment(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleVideoSelect = (videoAttachment: Attachment) => {
        fetch(videoAttachment.url)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], videoAttachment.name, { type: 'video/webm' });
                setAttachment(file);
                setIsVideoModalOpen(false);
            })
            .catch(err => console.error(err));
    };

    const handleAudioSelect = (audioAttachment: Attachment) => {
        fetch(audioAttachment.url)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], audioAttachment.name, { type: 'audio/webm' });
                setAttachment(file);
                setIsAudioModalOpen(false);
            })
            .catch(err => console.error(err));
    };

    const handleConversationCreated = async (conversationId: number) => {
        try {
            let convos = await apiService.getConversations();
            const updatedConvos = convos.map(convo => ({
                ...convo,
                conversation_title: convo.participants.find(p => p.id !== currentUser?.id)?.username || 'Unknown User'
            }));
            updatedConvos.sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at).getTime();
                const dateB = new Date(b.updated_at || b.created_at).getTime();
                return dateB - dateA;
            });
            setConversations(updatedConvos);
            const newConvo = updatedConvos.find(c => c.id === conversationId);
            if (newConvo) {
                setSelectedConversation(newConvo);
            }
        } catch (err) {
            setError('Failed to load new conversation.');
        }
    };

    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;

        setIsDeleting(true);
        try {
            await apiService.deleteMessage(messageToDelete);
            setMessages(prev => prev.filter(m => m.id !== messageToDelete));
            setDeleteConfirmOpen(false);
            setMessageToDelete(null);
        } catch (err) {
            setError('Failed to delete message.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClearConversation = async () => {
        if (!selectedConversation) return;

        setIsDeleting(true);
        try {
            await apiService.clearConversationMessages(selectedConversation.id);
            setMessages([]);
            setClearConfirmOpen(false);
        } catch (err) {
            setError('Failed to clear conversation.');
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteConfirm = (messageId: number) => {
        setMessageToDelete(messageId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConversation = async () => {
        if (!conversationToDelete) return;

        setIsDeleting(true);
        try {
            await apiService.deleteConversation(conversationToDelete);
            setConversations(prev => prev.filter(c => c.id !== conversationToDelete));
            if (selectedConversation?.id === conversationToDelete) {
                setSelectedConversation(null);
                setMessages([]);
            }
            setDeleteConvoConfirmOpen(false);
            setConversationToDelete(null);
        } catch (err) {
            setError('Failed to delete conversation.');
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteConvoConfirm = (conversationId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setConversationToDelete(conversationId);
        setDeleteConvoConfirmOpen(true);
    };

    // Filter conversations based on search
    const filteredConversations = conversations.filter(convo =>
        convo.conversation_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col h-[85vh] max-h-[900px]">
                {/* Main Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                            Student Messages
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Connect with your teachers and family</p>
                    </div>
                    {error && (
                        <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full animate-pulse">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Conversation List */}
                    <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
                        <div className="p-4 space-y-4">
                            {/* Search & New Button */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search messages..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border-none rounded-xl text-sm shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsNewConversationModalOpen(true)}
                                    className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 active:scale-95 transition-all"
                                    title="New Conversation"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                            {isLoadingConvos ? (
                                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs text-gray-400">Loading...</p>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                        <ChatBubbleLeftEllipsisIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No conversations found</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new chat to connect.</p>
                                </div>
                            ) : (
                                <div className="space-y-1 pb-4">
                                    {filteredConversations.map(convo => {
                                        const otherUser = convo.participants.find(p => p.id !== currentUser?.id);
                                        const isSelected = selectedConversation?.id === convo.id;

                                        // Colors based on role
                                        const avatarBg = otherUser?.role === 'Teacher' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                                            otherUser?.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                                otherUser?.role === 'Parent' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';

                                        return (
                                            <div
                                                key={convo.id}
                                                className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent ${isSelected
                                                    ? 'bg-white dark:bg-gray-800 shadow-sm border-gray-100 dark:border-gray-700'
                                                    : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                                                    }`}
                                                onClick={() => setSelectedConversation(convo)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${avatarBg}`}>
                                                        <span className="font-bold text-sm">
                                                            {convo.conversation_title.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                {convo.conversation_title}
                                                            </h4>
                                                            {otherUser && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 font-medium">
                                                                    {otherUser.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-6">
                                                            {convo.last_message ? convo.last_message.content || '📎 Attachment' : 'No messages yet'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => openDeleteConvoConfirm(convo.id, e)}
                                                    className="absolute right-2 bottom-3 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Delete conversation"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm relative">
                        {!selectedConversation ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <ChatBubbleLeftEllipsisIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Welcome to Messages</h3>
                                <p className="text-sm max-w-xs mt-2">Select a conversation to start chatting.</p>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex justify-between items-center shadow-sm z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                                            <span className="font-bold text-sm">
                                                {selectedConversation.conversation_title.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                                                {selectedConversation.conversation_title}
                                            </h3>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                {selectedConversation.participants.find(p => p.id !== currentUser?.id)?.role || 'User'}
                                            </p>
                                        </div>
                                    </div>

                                    {messages.length > 0 && (
                                        <button
                                            onClick={() => setClearConfirmOpen(true)}
                                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                            title="Clear Chat History"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Messages View */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar bg-slate-50/50 dark:bg-gray-900/50">
                                    {isLoadingMessages ? (
                                        <div className="flex justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-gray-400 text-sm">No messages yet. Say hello! 👋</p>
                                        </div>
                                    ) : (
                                        messages.map(msg => {
                                            const isMe = msg.sender.id === currentUser?.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-2`}>
                                                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`relative px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed transition-all ${isMe
                                                            ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-none'
                                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                                            }`}>
                                                            {msg.attachment && (
                                                                <div className="mb-2 -mx-2 -mt-2">
                                                                    <MessageAttachment
                                                                        attachmentUrl={msg.attachment}
                                                                        isOwnMessage={isMe}
                                                                        className="rounded-xl overflow-hidden max-w-full"
                                                                    />
                                                                </div>
                                                            )}
                                                            {msg.content}

                                                            <button
                                                                onClick={() => openDeleteConfirm(msg.id)}
                                                                className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm ${isMe ? '-left-10' : '-right-10'
                                                                    }`}
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 px-1">
                                                            <span className="text-[10px] text-gray-400 font-medium">
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isMe && <MessageStatus status={msg.status} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                                    {attachment && <AttachmentPreview attachment={attachment} onRemove={() => setAttachment(null)} />}

                                    <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                                        <div className="flex gap-1 mb-1">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isSending}
                                                className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                                                title="Attach File"
                                            >
                                                <PaperclipIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAudioModalOpen(true)}
                                                disabled={isSending}
                                                className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
                                            >
                                                <MicrophoneIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isSending}
                                                onClick={() => setIsVideoModalOpen(true)}
                                                className="p-2.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-colors"
                                            >
                                                <VideoCameraIcon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex-1 relative">
                                            <textarea
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage(e);
                                                    }
                                                }}
                                                placeholder="Type your message..."
                                                rows={1}
                                                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl resize-none shadow-inner text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all custom-scrollbar max-h-32"
                                                disabled={isSending}
                                                style={{ minHeight: '46px' }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSending || (!newMessage.trim() && !attachment)}
                                                className="absolute right-2 bottom-2 p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-all active:scale-95"
                                            >
                                                {isSending ? (
                                                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <PaperAirplaneIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <VideoRecorderModal
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                onVideoSelect={handleVideoSelect}
            />
            <AudioRecorderModal
                isOpen={isAudioModalOpen}
                onClose={() => setIsAudioModalOpen(false)}
                onAudioSelect={handleAudioSelect}
            />
            <NewConversationModal
                isOpen={isNewConversationModalOpen}
                onClose={() => setIsNewConversationModalOpen(false)}
                onConversationCreated={handleConversationCreated}
                allowedRoles={['Teacher', 'Admin', 'Parent', 'Student']}
            />
            <ConfirmationModal
                isOpen={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setMessageToDelete(null);
                }}
                onConfirm={handleDeleteMessage}
                title="Delete Message"
                message="Are you sure you want to delete this message? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
                isLoading={isDeleting}
            />
            <ConfirmationModal
                isOpen={clearConfirmOpen}
                onClose={() => setClearConfirmOpen(false)}
                onConfirm={handleClearConversation}
                title="Clear All Messages"
                message="Are you sure you want to clear all messages in this conversation? This action cannot be undone."
                confirmText="Clear All"
                cancelText="Cancel"
                isDestructive={true}
                isLoading={isDeleting}
            />
            <ConfirmationModal
                isOpen={deleteConvoConfirmOpen}
                onClose={() => {
                    setDeleteConvoConfirmOpen(false);
                    setConversationToDelete(null);
                }}
                onConfirm={handleDeleteConversation}
                title="Delete Conversation"
                message="Are you sure you want to delete this conversation? All messages will be permanently removed. This action cannot be undone."
                confirmText="Delete Conversation"
                cancelText="Cancel"
                isDestructive={true}
                isLoading={isDeleting}
            />
        </>
    );
};

export default StudentCommunicationLog;
