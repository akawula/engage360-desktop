import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Code2,
    Settings,
    Users,
    MessageSquare,
    Brain,
    Clock,
    ArrowRight,
    CheckCircle,
    Star,
    Lightbulb,
    BookOpen,
    TrendingUp,
    Award,
    Target
} from 'lucide-react';

interface Skill {
    id: string;
    name: string;
    category: 'technical' | 'soft' | 'business';
    description: string;
    importance: 'essential' | 'important' | 'beneficial';
    levels: {
        beginner: string[];
        intermediate: string[];
        advanced: string[];
        expert: string[];
    };
    learningResources: {
        type: 'course' | 'book' | 'practice' | 'certification';
        title: string;
        provider?: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        estimatedTime: string;
    }[];
    relatedSkills: string[];
    icon: React.ComponentType<any>;
}

const skills: Skill[] = [
    {
        id: 'programming-languages',
        name: 'Programming Languages',
        category: 'technical',
        description: 'Proficiency in multiple programming languages appropriate for your domain',
        importance: 'essential',
        levels: {
            beginner: [
                'Understand basic syntax of one primary language',
                'Write simple programs and scripts',
                'Use basic data types and control structures',
                'Debug simple errors using print statements'
            ],
            intermediate: [
                'Proficient in 1-2 languages with good practices',
                'Understand object-oriented or functional paradigms',
                'Use advanced language features and libraries',
                'Write clean, readable, and maintainable code'
            ],
            advanced: [
                'Expert in primary language, proficient in 2-3 others',
                'Choose appropriate language for specific problems',
                'Optimize code for performance and memory',
                'Contribute to language communities and frameworks'
            ],
            expert: [
                'Deep understanding of language internals',
                'Design and implement language features or DSLs',
                'Mentor others in multiple programming paradigms',
                'Influence language/framework evolution'
            ]
        },
        learningResources: [
            {
                type: 'course',
                title: 'JavaScript: The Complete Guide',
                provider: 'Udemy',
                difficulty: 'beginner',
                estimatedTime: '52 hours'
            },
            {
                type: 'book',
                title: 'Eloquent JavaScript',
                difficulty: 'intermediate',
                estimatedTime: '40 hours'
            },
            {
                type: 'practice',
                title: 'LeetCode Programming Challenges',
                difficulty: 'intermediate',
                estimatedTime: 'Ongoing'
            }
        ],
        relatedSkills: ['frameworks', 'testing', 'debugging'],
        icon: Code2
    },
    {
        id: 'system-design',
        name: 'System Design & Architecture',
        category: 'technical',
        description: 'Ability to design scalable, maintainable, and efficient software systems',
        importance: 'essential',
        levels: {
            beginner: [
                'Understand basic software architecture patterns',
                'Design simple applications with clear separation of concerns',
                'Use design patterns appropriately',
                'Create basic system diagrams'
            ],
            intermediate: [
                'Design moderately complex systems',
                'Understand microservices vs monolith trade-offs',
                'Apply SOLID principles and clean architecture',
                'Consider scalability and performance in design'
            ],
            advanced: [
                'Design large-scale distributed systems',
                'Handle millions of users and high throughput',
                'Design for fault tolerance and disaster recovery',
                'Lead architecture decisions for multiple teams'
            ],
            expert: [
                'Architect enterprise-scale systems',
                'Define architectural standards and patterns',
                'Research and evaluate new architectural approaches',
                'Influence industry best practices'
            ]
        },
        learningResources: [
            {
                type: 'course',
                title: 'System Design Interview',
                provider: 'Educative',
                difficulty: 'intermediate',
                estimatedTime: '20 hours'
            },
            {
                type: 'book',
                title: 'Designing Data-Intensive Applications',
                difficulty: 'advanced',
                estimatedTime: '60 hours'
            },
            {
                type: 'practice',
                title: 'Design Systems Practice',
                difficulty: 'intermediate',
                estimatedTime: 'Ongoing'
            }
        ],
        relatedSkills: ['databases', 'cloud-platforms', 'performance-optimization'],
        icon: Settings
    },
    {
        id: 'communication',
        name: 'Communication & Presentation',
        category: 'soft',
        description: 'Ability to communicate technical concepts clearly to diverse audiences',
        importance: 'essential',
        levels: {
            beginner: [
                'Write clear commit messages and code comments',
                'Participate actively in team meetings',
                'Ask questions effectively when stuck',
                'Document work for team members'
            ],
            intermediate: [
                'Present technical topics to non-technical stakeholders',
                'Lead team discussions and meetings',
                'Write comprehensive technical documentation',
                'Provide constructive feedback in code reviews'
            ],
            advanced: [
                'Present at conferences and technical events',
                'Facilitate cross-team collaboration',
                'Translate business requirements into technical solutions',
                'Mentor and teach complex technical concepts'
            ],
            expert: [
                'Influence technical direction through communication',
                'Represent company in industry forums',
                'Author technical blog posts and articles',
                'Lead organization-wide technical initiatives'
            ]
        },
        learningResources: [
            {
                type: 'course',
                title: 'Technical Writing for Engineers',
                provider: 'Google',
                difficulty: 'beginner',
                estimatedTime: '10 hours'
            },
            {
                type: 'book',
                title: 'The Pyramid Principle',
                difficulty: 'intermediate',
                estimatedTime: '15 hours'
            },
            {
                type: 'practice',
                title: 'Toastmasters International',
                difficulty: 'beginner',
                estimatedTime: 'Ongoing'
            }
        ],
        relatedSkills: ['leadership', 'teamwork', 'documentation'],
        icon: MessageSquare
    },
    {
        id: 'problem-solving',
        name: 'Problem Solving & Critical Thinking',
        category: 'soft',
        description: 'Systematic approach to analyzing and solving complex technical challenges',
        importance: 'essential',
        levels: {
            beginner: [
                'Break down problems into smaller components',
                'Use debugging tools and techniques effectively',
                'Research solutions using documentation and forums',
                'Apply basic algorithms and data structures'
            ],
            intermediate: [
                'Analyze root causes of complex issues',
                'Design elegant solutions to business problems',
                'Optimize existing solutions for better performance',
                'Evaluate trade-offs between different approaches'
            ],
            advanced: [
                'Solve novel problems with creative approaches',
                'Anticipate and prevent potential issues',
                'Design systems that are resilient to edge cases',
                'Mentor others in problem-solving methodologies'
            ],
            expert: [
                'Tackle industry-wide technical challenges',
                'Research and develop new problem-solving frameworks',
                'Lead post-mortems and continuous improvement',
                'Influence best practices across the organization'
            ]
        },
        learningResources: [
            {
                type: 'course',
                title: 'Algorithms and Data Structures',
                provider: 'MIT OpenCourseWare',
                difficulty: 'intermediate',
                estimatedTime: '40 hours'
            },
            {
                type: 'book',
                title: 'Cracking the Coding Interview',
                difficulty: 'intermediate',
                estimatedTime: '30 hours'
            },
            {
                type: 'practice',
                title: 'Project Euler Mathematical Problems',
                difficulty: 'advanced',
                estimatedTime: 'Ongoing'
            }
        ],
        relatedSkills: ['programming-languages', 'testing', 'debugging'],
        icon: Brain
    },
    {
        id: 'leadership',
        name: 'Technical Leadership',
        category: 'soft',
        description: 'Ability to guide technical teams and drive engineering excellence',
        importance: 'important',
        levels: {
            beginner: [
                'Take ownership of assigned tasks and deliverables',
                'Help onboard new team members',
                'Volunteer for additional responsibilities',
                'Share knowledge through pair programming'
            ],
            intermediate: [
                'Lead small projects and feature development',
                'Mentor junior developers effectively',
                'Facilitate technical discussions and decisions',
                'Drive adoption of best practices within team'
            ],
            advanced: [
                'Lead cross-functional teams and initiatives',
                'Set technical vision and strategy',
                'Make critical architectural and technology decisions',
                'Build and scale high-performing engineering teams'
            ],
            expert: [
                'Influence engineering culture across organization',
                'Define technical standards and practices company-wide',
                'Attract and develop top engineering talent',
                'Drive innovation and technical excellence'
            ]
        },
        learningResources: [
            {
                type: 'book',
                title: 'The Manager\'s Path',
                difficulty: 'intermediate',
                estimatedTime: '20 hours'
            },
            {
                type: 'course',
                title: 'Technical Leadership Essentials',
                provider: 'LinkedIn Learning',
                difficulty: 'intermediate',
                estimatedTime: '8 hours'
            },
            {
                type: 'book',
                title: 'Staff Engineer: Leadership beyond the management track',
                difficulty: 'advanced',
                estimatedTime: '15 hours'
            }
        ],
        relatedSkills: ['communication', 'project-management', 'mentoring'],
        icon: Users
    }
];

const importanceColors = {
    essential: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    important: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    beneficial: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
};

export default function SkillDevelopmentGuide() {
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<keyof Skill['levels']>('beginner');

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <TrendingUp className="h-8 w-8 text-primary-600" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Skill Development Guide
                    </h1>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Master the essential skills for software engineering success. From technical expertise to soft skills,
                    follow our structured approach to advance your career.
                </p>
            </div>

            {/* Skills Overview */}
            <div className="grid gap-6">
                {skills.map((skill) => {
                    const Icon = skill.icon;
                    const isSelected = selectedSkill === skill.id;

                    return (
                        <div key={skill.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setSelectedSkill(isSelected ? null : skill.id)}
                                className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-xl"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                                        <Icon className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                {skill.name}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${importanceColors[skill.importance]}`}>
                                                {skill.importance}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-xs font-medium">
                                                {skill.category}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            {skill.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-3 text-sm text-primary-600">
                                            <span>Click to view detailed learning path</span>
                                            <ArrowRight className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {isSelected && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-6">
                                    {/* Level Selection */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                            Skill Progression Levels
                                        </h4>
                                        <div className="flex gap-2 mb-4">
                                            {(Object.keys(skill.levels) as Array<keyof Skill['levels']>).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setSelectedLevel(level)}
                                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedLevel === level
                                                            ? 'bg-primary-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Level Details */}
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <Target className="h-5 w-5 text-primary-600" />
                                                {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Level Competencies
                                            </h5>
                                            <ul className="space-y-2">
                                                {skill.levels[selectedLevel].map((competency, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                        <span className="text-gray-600 dark:text-gray-300">{competency}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Learning Resources */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-blue-500" />
                                            Learning Resources
                                        </h4>
                                        <div className="grid gap-3">
                                            {skill.learningResources.map((resource, index) => {
                                                const resourceIcons = {
                                                    course: BookOpen,
                                                    book: BookOpen,
                                                    practice: Target,
                                                    certification: Award
                                                };
                                                const ResourceIcon = resourceIcons[resource.type];

                                                return (
                                                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                                        <div className="flex items-start gap-3">
                                                            <ResourceIcon className="h-5 w-5 text-primary-600 mt-1" />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h6 className="font-medium text-gray-900 dark:text-white">
                                                                        {resource.title}
                                                                    </h6>
                                                                    {resource.provider && (
                                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                            by {resource.provider}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <span className={`px-2 py-1 rounded-full ${resource.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                                            resource.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                                        }`}>
                                                                        {resource.difficulty}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                                                        <Clock className="h-4 w-4" />
                                                                        {resource.estimatedTime}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Related Skills */}
                                    {skill.relatedSkills.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <Star className="h-5 w-5 text-yellow-500" />
                                                Related Skills
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {skill.relatedSkills.map((relatedSkill, index) => (
                                                    <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full text-sm">
                                                        {relatedSkill.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action Section */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="h-8 w-8" />
                    <h2 className="text-2xl font-bold">Start Your Skill Development Journey</h2>
                </div>
                <p className="text-primary-100 mb-6 text-lg">
                    Ready to level up your skills? Create personalized development plans and track your progress.
                </p>
                <div className="flex gap-4">
                    <Link
                        to="/people"
                        className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center gap-2"
                    >
                        <Users className="h-5 w-5" />
                        View Growth Plans
                    </Link>
                    <Link
                        to="/action-items?title=Assess Current Skill Levels"
                        className="bg-primary-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-800 transition-colors flex items-center gap-2"
                    >
                        <Target className="h-5 w-5" />
                        Create Skill Assessment
                    </Link>
                </div>
            </div>
        </div>
    );
}
