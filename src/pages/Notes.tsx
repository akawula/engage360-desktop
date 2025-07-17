import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, User, Tag, Search, Filter, Grid, List, StickyNote, ArrowRight, Clock, MessageCircle, Phone, Mail, UserCheck, RotateCcw } from 'lucide-react';
import { notesService } from '../services/notesService';
import { stripHtmlAndTruncate } from '../lib/utils';
import { useState, useMemo } from 'react';

export default function Notes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'created' | 'updated' | 'title'>('updated');

    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes'],
        queryFn: async () => {
            const response = await notesService.getNotes();
            return response.success && response.data ? response.data : [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes cache
    });

    // Filter and sort notes
    const filteredAndSortedNotes = useMemo(() => {
        let filtered = notes.filter(note => {
            const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stripHtmlAndTruncate(note.content, 1000).toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesType = selectedType === 'all' || note.type === selectedType;

            return matchesSearch && matchesType;
        });

        // Sort notes
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'created':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'updated':
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [notes, searchTerm, selectedType, sortBy]);

    const noteTypes = [
        { value: 'all', label: 'All Notes', icon: '📝', count: notes.length },
        { value: 'personal', label: 'Personal', icon: '👤', count: notes.filter(n => n.type === 'personal').length },
        { value: 'meeting', label: 'Meeting', icon: '🤝', count: notes.filter(n => n.type === 'meeting').length },
        { value: 'call', label: 'Call', icon: '📞', count: notes.filter(n => n.type === 'call').length },
        { value: 'email', label: 'Email', icon: '✉️', count: notes.filter(n => n.type === 'email').length },
        { value: 'follow_up', label: 'Follow Up', icon: '🔄', count: notes.filter(n => n.type === 'follow_up').length },
    ];

    if (isLoading) {
        return (
            <div className="h-full bg-gray-50 dark:bg-gray-900">
                {/* Enhanced Loading State */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </div>
                            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4"></div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                <div className="flex justify-between">
                                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const getNoteTypeColor = (type: string) => {
        switch (type) {
            case 'meeting': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-700';
            case 'call': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-700';
            case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-700';
            case 'personal': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border border-orange-200 dark:border-orange-700';
            case 'follow_up': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-200 dark:border-red-700';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 border border-gray-200 dark:border-gray-700';
        }
    };

    const getNoteTypeIcon = (type: string) => {
        switch (type) {
            case 'meeting': return MessageCircle;
            case 'call': return Phone;
            case 'email': return Mail;
            case 'personal': return UserCheck;
            case 'follow_up': return RotateCcw;
            default: return StickyNote;
        }
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

        if (diffInDays > 0) {
            return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
        } else if (diffInHours > 0) {
            return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
        } else if (diffInMinutes > 0) {
            return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
        } else {
            return 'Just now';
        }
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900">
            {/* Enhanced Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                                <StickyNote className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notes</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {filteredAndSortedNotes.length} of {notes.length} notes
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                                            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list'
                                            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                            <Link
                                to="/notes/create"
                                className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span className="font-medium">New Note</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search notes by title, content, or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {noteTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setSelectedType(type.value)}
                                className={`group flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${selectedType === type.value
                                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="text-lg group-hover:scale-110 transition-transform">
                                    {type.icon}
                                </span>
                                <span className="font-medium">{type.label}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${selectedType === type.value
                                        ? 'bg-primary-200 text-primary-800 dark:bg-primary-800 dark:text-primary-200'
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                    {type.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'created' | 'updated' | 'title')}
                                className="text-sm bg-transparent border-0 text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer"
                            >
                                <option value="updated">Last Updated</option>
                                <option value="created">Date Created</option>
                                <option value="title">Title</option>
                            </select>
                        </div>

                        {(searchTerm || selectedType !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedType('all');
                                }}
                                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes Grid/List */}
            <div className="flex-1 overflow-y-auto p-6">
                {filteredAndSortedNotes.length > 0 ? (
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                            : 'space-y-4'
                    }>
                        {filteredAndSortedNotes.map((note) => {
                            const IconComponent = getNoteTypeIcon(note.type);

                            return (
                                <Link
                                    key={note.id}
                                    to={`/notes/${note.id}`}
                                    className={`group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/10 ${viewMode === 'grid' ? 'p-6' : 'p-4'
                                        }`}
                                >
                                    {viewMode === 'grid' ? (
                                        // Grid View
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
                                                        <IconComponent className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNoteTypeColor(note.type)}`}>
                                                            {note.type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-all duration-200 transform group-hover:translate-x-1" />
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                                                    {note.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                                                    {stripHtmlAndTruncate(note.content, 150)}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{getRelativeTime(note.updatedAt)}</span>
                                                </div>
                                                {note.personId && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        <span>Person</span>
                                                    </div>
                                                )}
                                            </div>

                                            {note.tags && note.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                    {note.tags.slice(0, 3).map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {note.tags.length > 3 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400">
                                                            +{note.tags.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // List View
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <IconComponent className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                        {note.title}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getNoteTypeColor(note.type)}`}>
                                                        {note.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                                                    {stripHtmlAndTruncate(note.content, 100)}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{getRelativeTime(note.updatedAt)}</span>
                                                    </div>
                                                    {note.personId && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <User className="h-3 w-3" />
                                                            <span>Person</span>
                                                        </div>
                                                    )}
                                                    {note.tags && note.tags.length > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <Tag className="h-3 w-3" />
                                                            <span>{note.tags.length} tags</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-all duration-200 transform group-hover:translate-x-1 flex-shrink-0" />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    // Empty State
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            {searchTerm || selectedType !== 'all' ? (
                                <Search className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                            ) : (
                                <StickyNote className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                            )}
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {searchTerm || selectedType !== 'all' ? 'No notes found' : 'No notes yet'}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            {searchTerm || selectedType !== 'all'
                                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                                : 'Create your first note to start organizing your thoughts, meetings, and ideas.'
                            }
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            {(searchTerm || selectedType !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedType('all');
                                    }}
                                    className="px-4 py-2 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                >
                                    Clear filters
                                </button>
                            )}
                            <Link
                                to="/notes/create"
                                className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="font-medium">Create Your First Note</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
