import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Mail, Phone, Building } from 'lucide-react';
import { useAppStore } from '../store';
import { format } from 'date-fns';

export default function People() {
    const { people, loading } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('');

    // Get all unique tags
    const allTags = Array.from(new Set(people.flatMap(person => person.tags)));

    // Filter people based on search and tag
    const filteredPeople = people.filter(person => {
        const matchesSearch = !searchTerm ||
            `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.company?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTag = !selectedTag || person.tags.includes(selectedTag);

        return matchesSearch && matchesTag;
    });

    if (loading.people) {
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">People</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your network and relationships</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Person
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>

                    {/* Tag Filter */}
                    <div className="relative">
                        <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all p-6 group"
                    >
                        <div className="flex items-start space-x-4">
                            {person.avatar ? (
                                <img
                                    src={person.avatar}
                                    alt={`${person.firstName} ${person.lastName}`}
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium">
                                        {person.firstName[0]}{person.lastName[0]}
                                    </span>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {person.firstName} {person.lastName}
                                </h3>

                                {person.position && person.company && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {person.position} at {person.company}
                                    </p>
                                )}

                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    {person.email && (
                                        <div className="flex items-center">
                                            <Mail className="w-4 h-4 mr-1" />
                                            <span className="truncate">{person.email}</span>
                                        </div>
                                    )}
                                </div>

                                {person.phone && (
                                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        <Phone className="w-4 h-4 mr-1" />
                                        <span>{person.phone}</span>
                                    </div>
                                )}

                                {person.company && (
                                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        <Building className="w-4 h-4 mr-1" />
                                        <span>{person.company}</span>
                                    </div>
                                )}

                                {/* Tags */}
                                {person.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {person.tags.slice(0, 3).map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {person.tags.length > 3 && (
                                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                                                +{person.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Engagement Score */}
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Engagement: {person.engagementScore}%
                                    </span>
                                    {person.lastInteraction && (
                                        <span className="text-xs text-gray-400">
                                            Last: {format(new Date(person.lastInteraction), 'MMM d')}
                                        </span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full"
                                        style={{ width: `${person.engagementScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredPeople.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No people found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || selectedTag
                            ? 'Try adjusting your search or filters'
                            : 'Get started by adding your first person'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
