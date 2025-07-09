import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FileText, User, Calendar, Tag } from 'lucide-react';
import { mockApi } from '../data/mockData';

export default function Notes() {
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes'],
        queryFn: mockApi.getNotes,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const getNoteTypeColor = (type: string) => {
        const colors = {
            meeting: 'bg-blue-100 text-blue-800',
            call: 'bg-green-100 text-green-800',
            email: 'bg-purple-100 text-purple-800',
            personal: 'bg-orange-100 text-orange-800',
            follow_up: 'bg-red-100 text-red-800',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getNoteTypeIcon = (type: string) => {
        switch (type) {
            case 'meeting':
                return '📅';
            case 'call':
                return '📞';
            case 'email':
                return '✉️';
            case 'personal':
                return '👤';
            case 'follow_up':
                return '🔄';
            default:
                return '📝';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notes</h1>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Note
                </button>
            </div>

            <div className="space-y-4">
                {notes.map((note) => (
                    <Link
                        key={note.id}
                        to={`/notes/${note.id}`}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all block"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getNoteTypeIcon(note.type)}</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{note.title}</h3>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getNoteTypeColor(note.type)}`}>
                                        {note.type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(note.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                            {note.content}
                        </p>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                {note.personId && (
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>Person</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {note.tags && note.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Tag className="h-4 w-4 text-gray-400" />
                                    <div className="flex gap-1">
                                        {note.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                        {note.tags.length > 3 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">+{note.tags.length - 3}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {notes.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notes yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Create your first note to get started</p>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        Create Note
                    </button>
                </div>
            )}
        </div>
    );
}
