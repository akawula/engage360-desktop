import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, Plus, FileText, CheckSquare, Trash2, Users } from 'lucide-react';
import { notesService } from '../services/notesService';
import { actionItemsService } from '../services/actionItemsService';
import { usePerson, useDeletePerson } from '../hooks/usePeople';
import EditPersonModal from '../components/EditPersonModal';

export default function PersonDetail() {
    const { personId } = useParams<{ personId: string }>();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const navigate = useNavigate();

    const { data: person, isLoading } = usePerson(personId || '');

    const { data: notes = [] } = useQuery({
        queryKey: ['notes', personId],
        queryFn: async () => {
            const response = await notesService.getNotes();
            return response.success && response.data ? response.data.filter(note => note.personId === personId) : [];
        },
        enabled: !!personId,
    });

    const { data: actionItems = [] } = useQuery({
        queryKey: ['actionItems', personId],
        queryFn: async () => {
            const response = await actionItemsService.getActionItems();
            return response.success && response.data ? response.data.filter(item => item.personId === personId) : [];
        },
        enabled: !!personId,
    });

    const deleteMutation = useDeletePerson();

    const handleDelete = () => {
        if (personId) {
            deleteMutation.mutate(personId, {
                onSuccess: (response) => {
                    if (response.success) {
                        navigate('/people');
                    } else {
                        console.error('Failed to delete person:', response.error);
                    }
                },
            });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!person) {
        return (
            <div className="space-y-6">
                <Link to="/people" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Back to People
                </Link>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                    <p className="text-gray-600 dark:text-gray-300">Person not found</p>
                </div>
            </div>
        );
    }

    const engagementColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        if (score >= 40) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/people" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to People
                    </Link>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Edit Person
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        {person.avatarUrl ? (
                            <img
                                src={person.avatarUrl}
                                alt={`${person.firstName} ${person.lastName}`}
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                    {person.firstName[0]}{person.lastName[0]}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {person.firstName} {person.lastName}
                            </h1>
                            {person.engagementScore && (
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${engagementColor(person.engagementScore)}`}>
                                    {person.engagementScore}% engagement
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Mail className="h-4 w-4" />
                                <a href={`mailto:${person.email}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                                    {person.email}
                                </a>
                            </div>
                            {person.phone && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <Phone className="h-4 w-4" />
                                    <a href={`tel:${person.phone}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                                        {person.phone}
                                    </a>
                                </div>
                            )}
                            {person.jobDescription && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <MapPin className="h-4 w-4" />
                                    <span>{person.jobDescription}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Calendar className="h-4 w-4" />
                                <span>Last interaction: {person.lastInteraction ? new Date(person.lastInteraction).toLocaleDateString() : 'No recent interaction'}</span>
                            </div>
                        </div>

                        {person.tags && person.tags.length > 0 && (
                            <div className="mt-4">
                                <div className="flex flex-wrap gap-2">
                                    {person.tags.map((tag) => (
                                        <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Groups Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Groups ({person.groups?.length || 0})
                    </h2>
                </div>

                <div className="p-6">
                    {person.groups && person.groups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {person.groups.map((group) => (
                                <Link
                                    key={group.id}
                                    to={`/groups/${group.id}`}
                                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all hover:border-primary-300 dark:hover:border-primary-600"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-gray-900 dark:text-white">{group.name}</h3>
                                        {group.tags && group.tags.length > 0 && (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${group.color
                                                ? 'text-white'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                }`}
                                                style={group.color ? { backgroundColor: group.color } : undefined}>
                                                {group.tags[0]}
                                            </span>
                                        )}
                                    </div>
                                    {group.description && (
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                                            {group.description}
                                        </p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">Not a member of any groups</p>
                    )}
                </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Notes ({notes.length})
                        </h2>
                        <button className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm">
                            <Plus className="h-4 w-4" />
                            Add Note
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {notes.length > 0 ? (
                        <div className="space-y-4">
                            {notes.slice(0, 3).map((note) => (
                                <Link
                                    key={note.id}
                                    to={`/notes/${note.id}`}
                                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-gray-900 dark:text-white">{note.title}</h3>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{note.content}</p>
                                </Link>
                            ))}
                            {notes.length > 3 && (
                                <Link
                                    to={`/notes?personId=${personId}`}
                                    className="block text-center py-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    View all {notes.length} notes
                                </Link>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No notes yet</p>
                    )}
                </div>
            </div>

            {/* Action Items Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" />
                            Action Items ({actionItems.length})
                        </h2>
                        <button className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm">
                            <Plus className="h-4 w-4" />
                            Add Action Item
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {actionItems.length > 0 ? (
                        <div className="space-y-3">
                            {actionItems.slice(0, 3).map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm">{item.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                            {item.dueDate && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {actionItems.length > 3 && (
                                <Link
                                    to={`/action-items?assigneeId=${personId}`}
                                    className="block text-center py-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    View all {actionItems.length} action items
                                </Link>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No action items yet</p>
                    )}
                </div>
            </div>

            {/* Edit Person Modal */}
            {person && (
                <EditPersonModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    person={person}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Person</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete {person?.firstName} {person?.lastName}? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
