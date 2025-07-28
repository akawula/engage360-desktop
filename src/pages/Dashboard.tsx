import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, FileText, CheckSquare, TrendingUp, Calendar, Star, Zap, Target, ArrowUpRight, Sparkles, Plus } from 'lucide-react';
import { peopleService } from '../services/peopleService';
import { groupsService } from '../services/groupsService';
import { notesService } from '../services/notesService';
import { actionItemsService } from '../services/actionItemsService';

export default function Dashboard() {
    // Fetch data to determine what content to show
    const { data: peopleData } = useQuery({
        queryKey: ['people'],
        queryFn: async () => {
            try {
                const response = await peopleService.getPeople();
                return response.success ? response.data : { people: [] };
            } catch (error) {
                console.error('Failed to fetch people:', error);
                return { people: [] };
            }
        },
        retry: false,
    });

    const { data: groupsResponse } = useQuery({
        queryKey: ['groups'],
        queryFn: groupsService.getGroups,
        retry: false, // Don't retry failed requests immediately on dashboard
    });

    const { data: notesData } = useQuery({
        queryKey: ['notes-count'],
        queryFn: async () => {
            try {
                const response = await notesService.getNotes(undefined, 1, 5);
                return response.success ? response.data : { notes: [] };
            } catch (error) {
                console.error('Failed to fetch notes:', error);
                return { notes: [] };
            }
        },
        retry: false,
    });

    const { data: actionItemsData } = useQuery({
        queryKey: ['action-items-count'],
        queryFn: async () => {
            try {
                const response = await actionItemsService.getActionItems();
                return response.success ? response.data : [];
            } catch (error) {
                console.error('Failed to fetch action items:', error);
                return [];
            }
        },
        retry: false,
    });

    // Calculate stats
    const hasPeople = (peopleData?.people?.length || 0) > 0;
    const hasGroups = (groupsResponse?.success && groupsResponse?.data?.length || 0) > 0;
    const hasNotes = (notesData?.notes?.length || 0) > 0;
    const hasActionItems = (actionItemsData?.length || 0) > 0;
    const isNewUser = !hasPeople && !hasGroups && !hasNotes && !hasActionItems;


    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
            <div className="space-y-8 p-6">
                {/* Simplified Header */}
                <div className="bg-white dark:bg-dark-900 rounded-xl border border-dark-200 dark:border-dark-700 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-xl">
                            {isNewUser ? (
                                <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                            ) : (
                                <Target className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-dark-950 dark:text-white">
                                {isNewUser ? "Welcome to Engage360" : "Dashboard"}
                            </h1>
                            <p className="text-dark-600 dark:text-dark-400 text-lg mt-1">
                                {isNewUser 
                                    ? "Your relationship management platform"
                                    : `Managing ${peopleData?.people?.length || 0} contacts across ${groupsResponse?.success && groupsResponse?.data?.length || 0} groups`
                                }
                            </p>
                        </div>
                    </div>
                    {!isNewUser && (
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-dark-700 dark:text-dark-300">{notesData?.notes?.length || 0} notes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-dark-700 dark:text-dark-300">{actionItemsData?.length || 0} action items</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Simplified Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                        to="/people"
                        className="group bg-white dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-700 p-6 hover:shadow-md hover:border-dark-300 dark:hover:border-dark-600 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Users className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-dark-950 dark:text-white">People</h3>
                                <p className="text-dark-600 dark:text-dark-400 text-sm">
                                    {peopleData?.people?.length || 0} contacts
                                </p>
                            </div>
                        </div>
                        <p className="text-dark-600 dark:text-dark-400 text-sm leading-relaxed">
                            Manage your professional network and connections
                        </p>
                    </Link>

                    <Link
                        to="/groups"
                        className="group bg-white dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-700 p-6 hover:shadow-md hover:border-dark-300 dark:hover:border-dark-600 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                                <Building2 className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-dark-950 dark:text-white">Groups</h3>
                                <p className="text-dark-600 dark:text-dark-400 text-sm">
                                    {groupsResponse?.success && groupsResponse?.data?.length || 0} teams
                                </p>
                            </div>
                        </div>
                        <p className="text-dark-600 dark:text-dark-400 text-sm leading-relaxed">
                            Organize teams, projects, and communities
                        </p>
                    </Link>

                    <Link
                        to="/notes"
                        className="group bg-white dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-700 p-6 hover:shadow-md hover:border-dark-300 dark:hover:border-dark-600 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                <FileText className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-dark-950 dark:text-white">Notes</h3>
                                <p className="text-dark-600 dark:text-dark-400 text-sm">
                                    {notesData?.notes?.length || 0} entries
                                </p>
                            </div>
                        </div>
                        <p className="text-dark-600 dark:text-dark-400 text-sm leading-relaxed">
                            Capture conversations and insights
                        </p>
                    </Link>

                    <Link
                        to="/action-items"
                        className="group bg-white dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-700 p-6 hover:shadow-md hover:border-dark-300 dark:hover:border-dark-600 transition-all duration-200"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                                <CheckSquare className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-dark-950 dark:text-white">Tasks</h3>
                                <p className="text-dark-600 dark:text-dark-400 text-sm">
                                    {actionItemsData?.length || 0} items
                                </p>
                            </div>
                        </div>
                        <p className="text-dark-600 dark:text-dark-400 text-sm leading-relaxed">
                            Track follow-ups and reminders
                        </p>
                    </Link>
                </div>

                {/* Simplified Welcome Section */}
                {(isNewUser || (!hasPeople || !hasGroups || !hasNotes || !hasActionItems)) && (
                    <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-700 p-6">
                        <h2 className="text-xl font-semibold text-dark-950 dark:text-white mb-4">
                            {isNewUser ? "Get Started" : "Next Steps"}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {!hasPeople && (
                                <Link
                                    to="/people"
                                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Add Your First Person
                                </Link>
                            )}
                            {!hasGroups && (
                                <Link
                                    to="/groups"
                                    className="inline-flex items-center px-4 py-2 border border-dark-300 dark:border-dark-600 text-dark-700 dark:text-dark-300 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
                                >
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Create First Group
                                </Link>
                            )}
                            {!hasNotes && hasPeople && (
                                <Link
                                    to="/notes/create"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Write First Note
                                </Link>
                            )}
                            {!hasActionItems && (hasPeople || hasNotes) && (
                                <Link
                                    to="/action-items"
                                    className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Action Item
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Simplified Tips Section */}
                {isNewUser && (
                    <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-700 p-6">
                        <h3 className="text-lg font-semibold text-dark-950 dark:text-white mb-4">
                            Quick Tips
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-dark-600 dark:text-dark-400">
                                    <strong>Start with people:</strong> Add your key contacts with their roles and companies
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-dark-600 dark:text-dark-400">
                                    <strong>Organize with groups:</strong> Create teams or project groups for better tracking
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-dark-600 dark:text-dark-400">
                                    <strong>Document interactions:</strong> Take notes after meetings and important calls
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
