import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Mail, Phone, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { usePeople } from '../hooks/usePeople';
import { useGrowthAnalytics } from '../hooks/useGrowth';
import { formatAvatarSrc } from '../lib/utils';
import AddPersonModal from '../components/AddPersonModal';

export default function People() {
    const { data: peopleResponse, isLoading } = usePeople();
    const people = peopleResponse?.people || [];
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Get all unique tags
    const allTags = Array.from(new Set(people.flatMap(person => person.tags)));

    // Filter people based on search and tag
    const filteredPeople = people.filter(person => {
        const matchesSearch = !searchTerm ||
            `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.githubUsername?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTag = !selectedTag || person.tags.includes(selectedTag);

        return matchesSearch && matchesTag;
    });

    // Growth Progress Component
    const GrowthProgress = ({ personId }: { personId: string }) => {
        const { data: analytics } = useGrowthAnalytics(personId);

        if (!analytics) return null;

        return (
            <div className="flex items-center gap-2 mt-2 p-2 bg-dark-200 dark:bg-dark-800 rounded">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div className="text-xs text-dark-600 dark:text-dark-300">
                    <span className="font-medium">{analytics.totalGoals}</span> goals •
                    <span className="font-medium"> {analytics.skillsCount}</span> skills •
                    <span className="font-medium"> {analytics.averageProgress}%</span> avg progress
                </div>
            </div>
        );
    };

    // Helper function for engagement score colors
    const getEngagementColor = (score: number) => {
        if (score >= 80) {
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
        } else if (score >= 60) {
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        } else if (score >= 30) {
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        } else {
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-950 dark:text-white">People</h1>
                    <p className="text-dark-700 dark:text-dark-400 mt-1">Manage your network and relationships</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Person
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-500" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-dark-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400"
                        />
                    </div>

                    {/* Tag Filter */}
                    <div className="relative">
                        <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-500" />
                        <select
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-dark-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                        >
                            <option value="">All Tags</option>
                            {allTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* People Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPeople.map((person) => (
                    <Link
                        key={person.id}
                        to={`/people/${person.id}`}
                        className="bg-white dark:bg-dark-900 rounded-lg shadow hover:shadow-md transition-all p-6 group flex flex-col h-full"
                    >
                        {/* Header Section */}
                        <div className="flex items-start space-x-4 mb-4">
                            {formatAvatarSrc(person.avatarUrl || person.avatar) ? (
                                <img
                                    key={`${person.id}-avatar-${person.avatarUrl || person.avatar}`}
                                    src={formatAvatarSrc(person.avatarUrl || person.avatar)!}
                                    alt={`${person.firstName} ${person.lastName}`}
                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-medium">
                                        {person.firstName[0]}{person.lastName[0]}
                                    </span>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-medium text-dark-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {person.firstName} {person.lastName}
                                </h3>

                                {person.position && (
                                    <p className="text-sm text-dark-700 dark:text-dark-400 mt-1">
                                        {person.position}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Content Section - Flexible height */}
                        <div className="flex-1 space-y-3">
                            {/* Contact Info */}
                            <div className="space-y-1">
                                {person.email && (
                                    <div className="flex items-center text-sm text-dark-600 dark:text-dark-500">
                                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="truncate">{person.email}</span>
                                    </div>
                                )}

                                {person.phone && (
                                    <div className="flex items-center text-sm text-dark-600 dark:text-dark-500">
                                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span>{person.phone}</span>
                                    </div>
                                )}

                                {person.githubUsername && (
                                    <div className="flex items-center text-sm text-dark-600 dark:text-dark-500">
                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>@{person.githubUsername}</span>
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            {person.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {person.tags.slice(0, 3).map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-block px-2 py-1 text-xs bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {person.tags.length > 3 && (
                                        <span className="inline-block px-2 py-1 text-xs bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 rounded-full">
                                            +{person.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Section - Always at bottom */}
                        <div className="mt-4 pt-4 border-t border-dark-300 dark:border-dark-800 space-y-3">
                            {/* Growth Progress */}
                            <GrowthProgress personId={person.id} />

                            {/* Engagement Score */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-dark-600 dark:text-dark-500">
                                        Engagement:
                                    </span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded ${getEngagementColor(person.engagementScore || 0)}`}>
                                        {person.engagementScore}%
                                    </span>
                                </div>
                                {person.lastInteraction && (
                                    <span className="text-xs text-dark-500">
                                        Last: {format(new Date(person.lastInteraction), 'MMM d')}
                                    </span>
                                )}
                            </div>

                            {/* Activity breakdown */}
                            <div className="flex items-center gap-4 text-xs text-dark-600 dark:text-dark-500">
                                <span>{person.counts?.notes || 0} notes</span>
                                <span>{person.counts?.achievements || 0} achievements</span>
                                <span>{person.counts?.actions || 0} actions</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredPeople.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-dark-500 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-dark-950 dark:text-white mb-1">No people found</h3>
                    <p className="text-dark-600 dark:text-dark-500">
                        {searchTerm || selectedTag
                            ? 'Try adjusting your search or filters'
                            : 'Get started by adding your first person'
                        }
                    </p>
                </div>
            )}

            <AddPersonModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
}
