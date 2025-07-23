import { Link } from 'react-router-dom';
import {
    BookOpen,
    TrendingUp,
    Users,
    Target,
    Award,
    ArrowRight,
    Code,
    Lightbulb,
    Star,
    Zap
} from 'lucide-react';

const guideCategories = [
    {
        id: 'career-progression',
        title: 'Career Progression',
        description: 'Navigate your software engineering career from junior to principal level',
        icon: TrendingUp,
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-600',
        guides: [
            {
                title: 'Software Engineer Levels',
                description: 'Complete breakdown of career levels, skills, and responsibilities',
                path: '/guides/career-levels',
                estimatedReadTime: '15 min'
            },
            {
                title: 'Salary Expectations',
                description: 'Industry salary ranges and negotiation strategies',
                path: '/guides/salary-guide',
                estimatedReadTime: '10 min'
            },
            {
                title: 'Promotion Strategies',
                description: 'How to advance to the next level in your career',
                path: '/guides/promotion-guide',
                estimatedReadTime: '12 min'
            }
        ]
    },
    {
        id: 'skill-development',
        title: 'Skill Development',
        description: 'Master the technical and soft skills essential for success',
        icon: Code,
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-600',
        guides: [
            {
                title: 'Technical Skills Roadmap',
                description: 'Structured approach to developing programming and system design skills',
                path: '/guides/technical-skills',
                estimatedReadTime: '20 min'
            },
            {
                title: 'Soft Skills for Engineers',
                description: 'Communication, leadership, and collaboration skills',
                path: '/guides/soft-skills',
                estimatedReadTime: '15 min'
            },
            {
                title: 'Learning Resources',
                description: 'Curated list of courses, books, and practice platforms',
                path: '/guides/learning-resources',
                estimatedReadTime: '8 min'
            }
        ]
    },
    {
        id: 'leadership',
        title: 'Technical Leadership',
        description: 'Develop leadership skills and guide engineering teams',
        icon: Users,
        color: 'bg-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-600',
        guides: [
            {
                title: 'From Engineer to Leader',
                description: 'Transition from individual contributor to technical leadership',
                path: '/guides/tech-leadership',
                estimatedReadTime: '18 min'
            },
            {
                title: 'Mentoring Best Practices',
                description: 'How to effectively mentor junior developers',
                path: '/guides/mentoring',
                estimatedReadTime: '12 min'
            },
            {
                title: 'Building High-Performance Teams',
                description: 'Creating and scaling engineering teams that deliver',
                path: '/guides/team-building',
                estimatedReadTime: '16 min'
            }
        ]
    },
    {
        id: 'specializations',
        title: 'Engineering Specializations',
        description: 'Deep dive into specific engineering domains and paths',
        icon: Target,
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-600',
        guides: [
            {
                title: 'Frontend Engineering Path',
                description: 'React, Vue, Angular, and modern frontend development',
                path: '/guides/frontend-path',
                estimatedReadTime: '14 min'
            },
            {
                title: 'Backend Engineering Path',
                description: 'APIs, databases, microservices, and system architecture',
                path: '/guides/backend-path',
                estimatedReadTime: '16 min'
            },
            {
                title: 'DevOps & Infrastructure',
                description: 'Cloud platforms, CI/CD, and infrastructure as code',
                path: '/guides/devops-path',
                estimatedReadTime: '18 min'
            }
        ]
    }
];

const quickTips = [
    {
        title: 'Set SMART Goals',
        description: 'Create Specific, Measurable, Achievable, Relevant, and Time-bound career objectives',
        icon: Target
    },
    {
        title: 'Build a Portfolio',
        description: 'Showcase your best work through personal projects and open source contributions',
        icon: Star
    },
    {
        title: 'Network Actively',
        description: 'Connect with peers, join tech communities, and attend industry events',
        icon: Users
    },
    {
        title: 'Stay Current',
        description: 'Keep up with industry trends, new technologies, and best practices',
        icon: TrendingUp
    }
];

export default function Guides() {
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <BookOpen className="h-8 w-8 text-primary-600" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Career Development Guides
                    </h1>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Comprehensive guides to help software engineers at every stage of their career.
                    From junior developer to technical leadership, find the resources you need to grow.
                </p>
            </div>

            {/* Quick Access to Popular Guides */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-6 w-6" />
                    <h2 className="text-xl font-bold">Quick Start</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <Link
                        to="/guides/career-levels"
                        className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 hover:bg-opacity-20 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold mb-1">Career Progression Path</h3>
                                <p className="text-primary-100 text-sm">Understand software engineering levels and requirements</p>
                            </div>
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                    <Link
                        to="/guides/skill-development"
                        className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 hover:bg-opacity-20 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold mb-1">Skill Development Roadmap</h3>
                                <p className="text-primary-100 text-sm">Master essential technical and soft skills</p>
                            </div>
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Guide Categories */}
            <div className="grid lg:grid-cols-2 gap-8">
                {guideCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className={`${category.bgColor} p-6 border-b border-gray-200 dark:border-gray-700`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`${category.color} p-2 rounded-lg text-white`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {category.title}
                                    </h3>
                                </div>
                                <p className={`${category.textColor} dark:text-gray-300`}>
                                    {category.description}
                                </p>
                            </div>
                            <div className="p-6 space-y-4">
                                {category.guides.map((guide, index) => (
                                    <Link
                                        key={index}
                                        to={guide.path}
                                        className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {guide.title}
                                                </h4>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                                    {guide.description}
                                                </p>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 inline-block">
                                                    {guide.estimatedReadTime} read
                                                </span>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Lightbulb className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Quick Career Tips
                    </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickTips.map((tip, index) => {
                        const Icon = tip.icon;
                        return (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                <Icon className="h-8 w-8 text-primary-600 mb-3" />
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                    {tip.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    {tip.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Integration with Growth System */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Award className="h-8 w-8" />
                    <h2 className="text-2xl font-bold">Put Knowledge into Action</h2>
                </div>
                <p className="text-green-100 mb-6 text-lg">
                    Ready to apply what you've learned? Use our integrated growth planning tools to set goals,
                    track progress, and accelerate your development.
                </p>
                <div className="flex gap-4">
                    <Link
                        to="/people"
                        className="bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center gap-2"
                    >
                        <Users className="h-5 w-5" />
                        View Growth Plans
                    </Link>
                    <Link
                        to="/action-items?title=Create Career Development Plan"
                        className="bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition-colors flex items-center gap-2"
                    >
                        <Target className="h-5 w-5" />
                        Start Planning
                    </Link>
                </div>
            </div>
        </div>
    );
}
