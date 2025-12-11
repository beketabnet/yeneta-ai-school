import React, { useState, useEffect, useRef, useContext } from 'react';
import Card from '../Card';
import { Message, Attachment, Conversation, User } from '../../types';
import { PaperAirplaneIcon, CheckIcon, CheckCheckIcon, PaperclipIcon, MicrophoneIcon, VideoCameraIcon, XCircleIcon, TrashIcon, ChatBubbleLeftRightIcon, UserCircleIcon, ChatBubbleLeftEllipsisIcon } from '../icons/Icons';
import VideoRecorderModal from '../common/VideoRecorderModal';
import AudioRecorderModal from '../common/AudioRecorderModal';
import MessageAttachment from '../common/MessageAttachment';
import NewConversationModal from '../common/NewConversationModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { apiService } from '../../services/apiService';
import { AuthContext } from '../../contexts/AuthContext';

const MessageStatus: React.FC<{ status: 'sent' | 'delivered' | 'read' | undefined }> = ({ status }) => {
    if (!status) return null;
    const isRead = status === 'read';
    const iconClass = isRead ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500';
    if (status === 'sent') return <CheckIcon className={iconClass} />;
    return <CheckCheckIcon className={iconClass} />;
};

const AttachmentPreview: React.FC<{ attachment: File, onRemove: () => void }> = ({ attachment, onRemove }) => {
    return (
        <div className="p-3 mb-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl flex justify-between items-center text-sm relative group transition-all hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm">
            <span className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <PaperclipIcon className="w-4 h-4 text-gray-400" /> {attachment.name}
            </span>
            <button
                onClick={onRemove}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                aria-label="Remove attachment"
            >
                <XCircleIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const CommunicationLog: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isLoadingConvos, setIsLoadingConvos] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
    const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [deleteConvoConfirmOpen, setDeleteConvoConfirmOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
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
                // Sort by most recent activity (updated_at or created_at)
                convos.sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at).getTime();
                    const dateB = new Date(b.updated_at || b.created_at).getTime();
                    return dateB - dateA; // Most recent first
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
            setMessages(prev => [...prev, { ...sentMessage, status: 'sent' }]); // Add optimistic status
            setNewMessage('');
            setAttachment(null);
            // Simulate delivered/read status for demo
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
        // We need to convert the blob URL back to a File object
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
            console.log('handleConversationCreated called with ID:', conversationId);

            // Refresh conversations list
            let convos = await apiService.getConversations();
            console.log('Fetched conversations:', convos.length);

            const updatedConvos = convos.map(convo => ({
                ...convo,
                conversation_title: convo.participants.find(p => p.id !== currentUser?.id)?.username || 'Unknown User'
            }));

            // Sort by most recent
            updatedConvos.sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at).getTime();
                const dateB = new Date(b.updated_at || b.created_at).getTime();
                return dateB - dateA;
            });

            console.log('Updated conversations:', updatedConvos.map(c => ({ id: c.id, title: c.conversation_title })));
            setConversations(updatedConvos);

            // Select the newly created conversation
            const newConvo = updatedConvos.find(c => c.id === conversationId);
            console.log('Looking for conversation ID:', conversationId);
            console.log('Found conversation:', newConvo ? { id: newConvo.id, title: newConvo.conversation_title } : 'NOT FOUND');

            if (newConvo) {
                setSelectedConversation(newConvo);
                console.log('Selected conversation set to:', newConvo.conversation_title);
            } else {
                console.error('Conversation not found in list!');
            }
        } catch (err) {
            setError('Failed to load new conversation.');
            console.error('Error loading new conversation:', err);
        }
    };

    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;

        setIsDeleting(true);
        try {
            await apiService.deleteMessage(messageToDelete);
            // Remove message from local state
            setMessages(prev => prev.filter(m => m.id !== messageToDelete));
            setDeleteConfirmOpen(false);
            setMessageToDelete(null);
        } catch (err) {
            setError('Failed to delete message.');
            console.error('Error deleting message:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClearConversation = async () => {
        if (!selectedConversation) return;

        setIsDeleting(true);
        try {
            await apiService.clearConversationMessages(selectedConversation.id);
            // Clear messages from local state
            setMessages([]);
            setClearConfirmOpen(false);
        } catch (err) {
            setError('Failed to clear conversation.');
            console.error('Error clearing conversation:', err);
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
            // Remove conversation from local state
            setConversations(prev => prev.filter(c => c.id !== conversationToDelete));
            // Clear selected conversation if it was deleted
            if (selectedConversation?.id === conversationToDelete) {
                setSelectedConversation(null);
                setMessages([]);
            }
            setDeleteConvoConfirmOpen(false);
            setConversationToDelete(null);
        } catch (err) {
            setError('Failed to delete conversation.');
            console.error('Error deleting conversation:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteConvoConfirm = (conversationId: number, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent conversation selection
        setConversationToDelete(conversationId);
        setDeleteConvoConfirmOpen(true);
    };

    return (
        <>
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-[85vh] flex flex-col transition-all duration-300">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl shadow-inner">
                            <ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Secure communication with parents & students</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Conversation List */}
                    <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">Conversations</h3>
                            <button
                                onClick={() => setIsNewConversationModalOpen(true)}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-sm font-medium"
                                title="Start new conversation"
                            >
                                <span>+ New Chat</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {isLoadingConvos ? (
                                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center p-8 text-gray-400">No conversations yet.</div>
                            ) : (
                                conversations.map(convo => (
                                    <div key={convo.id} className="relative group">
                                        <button
                                            onClick={() => setSelectedConversation(convo)}
                                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-3 border ${selectedConversation?.id === convo.id ? 'bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-800 shadow-md ring-1 ring-indigo-500/20' : 'border-transparent hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'}`}
                                        >
                                            <div className={`p-2 rounded-full ${selectedConversation?.id === convo.id ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                                <UserCircleIcon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-sm truncate ${selectedConversation?.id === convo.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-200'}`}>{convo.conversation_title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Click to view messages</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => openDeleteConvoConfirm(convo.id, e)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-full shadow-sm border border-gray-100 dark:border-gray-700"
                                            title="Delete conversation"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className="w-2/3 flex flex-col bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm relative">
                        {selectedConversation ? (
                            <>
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                                            <span className="font-bold text-lg">{selectedConversation.conversation_title.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-100">{selectedConversation.conversation_title}</h3>
                                            <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setClearConfirmOpen(true)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Clear history"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                                    {isLoadingMessages ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
                                            <ChatBubbleLeftEllipsisIcon className="w-12 h-12 mb-2 opacity-50" />
                                            <p>Loading conversation...</p>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-700" />
                                            <p>No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <div key={msg.id} className={`flex ${msg.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'} group mb-4`}>
                                                <div className={`flex flex-col ${msg.sender.id === currentUser?.id ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                                    <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm ${msg.sender.id === currentUser?.id
                                                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-none'
                                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                                                        }`}>
                                                        {msg.attachment && (
                                                            <MessageAttachment
                                                                attachmentUrl={msg.attachment}
                                                                isOwnMessage={msg.sender.id === currentUser?.id}
                                                                className="mb-3 rounded-lg overflow-hidden"
                                                            />
                                                        )}
                                                        {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                                                        {/* Timestamp & Status inside bubble for cleaner look */}
                                                        <div className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${msg.sender.id === currentUser?.id ? 'text-indigo-100/70' : 'text-gray-400'}`}>
                                                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            {msg.sender.id === currentUser?.id && <MessageStatus status={msg.status} />}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => openDeleteConfirm(msg.id)}
                                                        className={`mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-500 flex items-center gap-1 ${msg.sender.id === currentUser?.id ? 'mr-1' : 'ml-1'}`}
                                                    >
                                                        <TrashIcon className="w-3 h-3" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                    {attachment && <AttachmentPreview attachment={attachment} onRemove={() => setAttachment(null)} />}
                                    <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                        <div className="flex items-center gap-1 pb-1">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors" title="Attach file">
                                                <PaperclipIcon className="w-5 h-5" />
                                            </button>
                                            <button type="button" onClick={() => setIsAudioModalOpen(true)} disabled={isSending} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors" title="Record Audio">
                                                <MicrophoneIcon className="w-5 h-5" />
                                            </button>
                                            <button type="button" onClick={() => setIsVideoModalOpen(true)} disabled={isSending} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors" title="Record Video">
                                                <VideoCameraIcon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            className="flex-1 max-h-32 min-h-[44px] py-3 px-2 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none"
                                            disabled={isSending}
                                        />

                                        <button
                                            type="submit"
                                            disabled={isSending || (!newMessage.trim() && !attachment)}
                                            className="p-3 mb-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                                        >
                                            <PaperAirplaneIcon className={`w-5 h-5 ${isSending ? 'animate-pulse' : ''}`} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 dark:bg-gray-900/30">
                                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <ChatBubbleLeftRightIcon className="w-12 h-12 text-indigo-300 dark:text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Select a Conversation</h3>
                                <p className="max-w-xs text-center text-sm">Choose a thread from the sidebar or start a new conversation to communicate with parents.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Modals remain unchanged */}
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
                allowedRoles={['Parent', 'Admin', 'Student', 'Teacher']}
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

export default CommunicationLog;