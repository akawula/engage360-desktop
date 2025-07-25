import { Link } from 'react-router-dom';
import { Users, Building2, FileText, CheckSquare, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-dark-950 dark:text-white">Dashboard</h1>
                <p className="text-dark-700 dark:text-dark-400 mt-1">Welcome to Engage360 - your relationship management hub</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                    to="/people"
                    className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-dark-200 dark:border-dark-700 group"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark-900 dark:text-white">People</h3>
                            <p className="text-sm text-dark-600 dark:text-dark-400">Manage contacts</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/groups"
                    className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-dark-200 dark:border-dark-700 group"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                            <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark-900 dark:text-white">Groups</h3>
                            <p className="text-sm text-dark-600 dark:text-dark-400">Organize teams</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/notes"
                    className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-dark-300 dark:border-dark-800 group"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark-950 dark:text-white">Notes</h3>
                            <p className="text-sm text-dark-700 dark:text-dark-500">Track interactions</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/action-items"
                    className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-dark-300 dark:border-dark-800 group"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                            <CheckSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark-950 dark:text-white">Action Items</h3>
                            <p className="text-sm text-dark-700 dark:text-dark-500">Track tasks</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Welcome Message */}
            <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow border border-dark-300 dark:border-dark-800">
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-dark-950 dark:text-white mb-2">
                            Get Started with Engage360
                        </h2>
                        <p className="text-dark-700 dark:text-dark-500 mb-4">
                            Engage360 helps you manage your professional relationships and stay on top of important interactions.
                            Click on any section above to get started, or explore the navigation menu on the left.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                to="/people"
                                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Add Your First Person
                            </Link>
                            <Link
                                to="/groups"
                                className="inline-flex items-center px-4 py-2 border border-dark-400 dark:border-dark-700 text-dark-800 dark:text-dark-400 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                            >
                                <Building2 className="w-4 h-4 mr-2" />
                                Create a Group
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow border border-dark-300 dark:border-dark-800">
                <h3 className="text-lg font-semibold text-dark-950 dark:text-white mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Quick Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                        <p className="text-dark-700 dark:text-dark-500">
                            <strong>People:</strong> Add contacts with tags to easily organize and find them later
                        </p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                        <p className="text-dark-700 dark:text-dark-500">
                            <strong>Notes:</strong> Track meetings, calls, and important conversations
                        </p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                        <p className="text-dark-700 dark:text-dark-500">
                            <strong>Groups:</strong> Organize people into teams, projects, or customer segments
                        </p>
                    </div>
                    <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                        <p className="text-dark-700 dark:text-dark-500">
                            <strong>Action Items:</strong> Never miss a follow-up with task tracking
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
