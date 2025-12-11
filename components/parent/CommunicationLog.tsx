import React, { useState, useRef, useEffect, useContext } from 'react';
import { Message, Attachment, Conversation, User } from '../../types';
import { apiService } from '../../services/apiService';
import Card from '../Card';
import {
    PaperAirplaneIcon,
    PaperclipIcon,
    MicrophoneIcon,
    VideoCameraIcon,
    XCircleIcon,
    CheckIcon,
    CheckCheckIcon,
    TrashIcon,
    SearchIcon,
    UserCircleIcon,
    ChatBubbleLeftRightIcon
} from '../icons/Icons';
import VideoRecorderModal from '../common/VideoRecorderModal';
import AudioRecorderModal from '../common/AudioRecorderModal';
import MessageAttachment from '../common/MessageAttachment';
import NewConversationModal from '../common/NewConversationModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { AuthContext } from '../../contexts/AuthContext';
import ScrollableListContainer from '../common/ScrollableListContainer';

const MessageStatus: React.FC<{ status: 'sent' | 'delivered' | 'read' | undefined }> = ({ status }) => {
    if (!status) return null;
    const isRead = status === 'read';
    const iconClass = isRead ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500';
    if (status === 'sent') return <CheckIcon className={`h-3 w-3 ${iconClass}`} />;
    return <CheckCheckIcon className={`h-3 w-3 ${iconClass}`} />;
};

const AttachmentPreview: React.FC<{ attachment: File, onRemove: () => void }> = ({ attachment, onRemove }) => {
    return (
        <div className="p-2 mb-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex justify-between items-center text-sm relative border border-gray-200 dark:border-gray-600">
            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{attachment.name}</span>
            <button
                onClick={onRemove}
                className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label="Remove attachment"
            >
                <XCircleIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

const CommunicationLog: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingConvos, setIsLoadingConvos] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
    const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [deleteConvoConfirmOpen, setDeleteConvoConfirmOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
                setError(`Failed to load messages.`);
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
            // Simulate status updates (demo)
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
            });
    };

    const handleAudioSelect = (audioAttachment: Attachment) => {
        fetch(audioAttachment.url)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], audioAttachment.name, { type: 'audio/webm' });
                setAttachment(file);
                setIsAudioModalOpen(false);
            });
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

    const filteredConversations = conversations.filter(c =>
        c.conversation_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    return (
        <div className="animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                        <ChatBubbleLeftRightIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Messages</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Connect with teachers and staff</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsNewConversationModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                    <span className="text-xl leading-none">+</span>
                    New Chat
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl text-red-700 dark:text-red-400 font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl overflow-hidden h-[75vh] flex flex-col md:flex-row">

                {/* Sidebar */}
                <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            />
                            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoadingConvos ? (
                            <div className="flex flex-col items-center justify-center h-full p-4 space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-500">Loading chats...</p>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">
                                <p className="mb-2">No conversations found</p>
                                <button onClick={() => setIsNewConversationModalOpen(true)} className="text-blue-600 font-semibold hover:underline">Start a new one</button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredConversations.map(convo => (
                                    <li key={convo.id} className="group relative">
                                        <button
                                            onClick={() => setSelectedConversation(convo)}
                                            className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${selectedConversation?.id === convo.id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                                                    : 'hover:bg-white dark:hover:bg-gray-800 border-l-4 border-transparent'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${selectedConversation?.id === convo.id
                                                    ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                                                    : 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {getInitials(convo.conversation_title)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold truncate ${selectedConversation?.id === convo.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {convo.conversation_title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {new Date(convo.updated_at || convo.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => openDeleteConvoConfirm(convo.id, e)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                                            title="Delete conversation"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 backdrop-blur-md z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                        {getInitials(selectedConversation.conversation_title)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">
                                            {selectedConversation.conversation_title}
                                        </h3>
                                        <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            Active Now
                                        </p>
                                    </div>
                                </div>
                                {messages.length > 0 && (
                                    <button
                                        onClick={() => setClearConfirmOpen(true)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Clear chat history"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/20">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                            <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {messages.length === 0 && (
                                            <div className="text-center py-12 text-gray-400">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <p>No messages yet. Say hello!</p>
                                            </div>
                                        )}
                                        {messages.map((msg, index) => {
                                            const isMe = msg.sender.id === currentUser?.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group`}>
                                                    {!isMe && (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                                                            {getInitials(msg.sender.username || 'User')}
                                                        </div>
                                                    )}

                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                                        <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${isMe
                                                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-sm'
                                                                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-100 dark:border-gray-600 rounded-tl-sm'
                                                            }`}>
                                                            {msg.attachment && (
                                                                <MessageAttachment
                                                                    attachmentUrl={msg.attachment}
                                                                    isOwnMessage={isMe}
                                                                    className="mb-2"
                                                                />
                                                            )}
                                                            {msg.content && <p className="textarea-pre-wrap text-sm leading-relaxed">{msg.content}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1 px-1">
                                                            <span className="text-[10px] text-gray-400 font-medium">
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isMe && <MessageStatus status={msg.status} />}
                                                            <button
                                                                onClick={() => openDeleteConfirm(msg.id)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 ml-2"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={chatEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                {attachment && <AttachmentPreview attachment={attachment} onRemove={() => setAttachment(null)} />}
                                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1 h-[52px]">
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
                                            className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all"
                                            title="Attach File"
                                        >
                                            <PaperclipIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAudioModalOpen(true)}
                                            disabled={isSending}
                                            className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all"
                                            title="Record Audio"
                                        >
                                            <MicrophoneIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsVideoModalOpen(true)}
                                            disabled={isSending}
                                            className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all"
                                            title="Record Video"
                                        >
                                            <VideoCameraIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700/50 border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-gray-800 rounded-2xl transition-all">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full px-4 py-3.5 bg-transparent border-none focus:ring-0 text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-500"
                                            disabled={isSending}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSending || (!newMessage.trim() && !attachment)}
                                        className="h-[52px] w-[52px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                    >
                                        {isSending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <PaperAirplaneIcon className="w-6 h-6 -ml-0.5 mt-0.5 rotate-90" />
                                        )}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-white dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <ChatBubbleLeftRightIcon className="w-12 h-12 text-indigo-500/50 dark:text-indigo-400/50" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Messages</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                                Select a conversation from the sidebar or start a new chat to connect with teachers and staff.
                            </p>
                            <button
                                onClick={() => setIsNewConversationModalOpen(true)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                allowedRoles={['Teacher', 'Admin', 'Student', 'Parent']}
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
        </div>
    );
};

export default CommunicationLog;