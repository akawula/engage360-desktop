import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Code,
    Users,
    Zap,
    ArrowRight,
    Star,
    Target,
    TrendingUp,
    Award,
    Lightbulb,
    Layers,
    GitBranch
} from 'lucide-react';

interface CareerLevel {
    id: string;
    title: string;
    description: string;
    experience: string;
    salary: string;
    keySkills: string[];
    responsibilities: string[];
    nextLevel?: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
}

const careerLevels: CareerLevel[] = [
    {
        id: 'junior',
        title: 'Junior Software Engineer',
        description: 'Entry-level position focused on learning and building foundational skills',
        experience: '0-2 years',
        salary: '$60,000 - $80,000',
        keySkills: [
            'Basic programming languages (JavaScript, Python, Java)',
            'Version control (Git)',
            'HTML/CSS fundamentals',
            'Basic debugging skills',
            'Following code standards',
            'Learning frameworks and libraries'
        ],
        responsibilities: [
            'Write simple features under supervision',
            'Fix bugs and make minor improvements',
            'Participate in code reviews',
            'Learn company processes and tools',
            'Complete assigned tasks within deadlines',
            'Ask questions and seek guidance'
        ],
        nextLevel: 'mid',
        icon: Code,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
        id: 'mid',
        title: 'Mid-Level Software Engineer',
        description: 'Competent developer who can work independently on features and projects',
        experience: '2-5 years',
        salary: '$80,000 - $120,000',
        keySkills: [
            'Proficiency in multiple programming languages',
            'Framework expertise (React, Angular, Vue, etc.)',
            'Database design and optimization',
            'API development and integration',
            'Testing methodologies (unit, integration)',
            'Performance optimization',
            'Security best practices'
        ],
        responsibilities: [
            'Develop features independently',
            'Participate in technical design discussions',
            'Mentor junior developers',
            'Review code and provide feedback',
            'Estimate project timelines',
            'Troubleshoot complex issues'
        ],
        nextLevel: 'senior',
        icon: Layers,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
        id: 'senior',
        title: 'Senior Software Engineer',
        description: 'Experienced developer who leads technical decisions and mentors others',
        experience: '5-8 years',
        salary: '$120,000 - $160,000',
        keySkills: [
            'Advanced system design and architecture',
            'Multiple technology stacks',
            'Performance and scalability optimization',
            'DevOps and CI/CD',
            'Technical leadership',
            'Cross-functional collaboration',
            'Code review and quality assurance'
        ],
        responsibilities: [
            'Lead technical design and architecture decisions',
            'Mentor mid-level and junior developers',
            'Drive technical initiatives and improvements',
            'Collaborate with product and design teams',
            'Estimate and plan large features',
            'Ensure code quality and best practices'
        ],
        nextLevel: 'staff',
        icon: Star,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
        id: 'staff',
        title: 'Staff Engineer / Tech Lead',
        description: 'Senior technical leader responsible for complex systems and team guidance',
        experience: '8-12 years',
        salary: '$160,000 - $220,000',
        keySkills: [
            'Large-scale system architecture',
            'Technical strategy and planning',
            'Team leadership and management',
            'Cross-team collaboration',
            'Technology evaluation and adoption',
            'Risk assessment and mitigation',
            'Stakeholder communication'
        ],
        responsibilities: [
            'Define technical vision and strategy',
            'Lead complex, multi-team projects',
            'Make critical technical decisions',
            'Guide career development of team members',
            'Interface with executive leadership',
            'Drive engineering excellence initiatives'
        ],
        nextLevel: 'principal',
        icon: Target,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
        id: 'principal',
        title: 'Principal Engineer',
        description: 'Distinguished engineer who shapes technology direction across the organization',
        experience: '12+ years',
        salary: '$220,000 - $300,000+',
        keySkills: [
            'Enterprise-scale architecture',
            'Technology research and innovation',
            'Strategic technical planning',
            'Industry expertise and thought leadership',
            'Executive communication',
            'Organizational influence',
            'Technical due diligence'
        ],
        responsibilities: [
            'Set company-wide technical standards',
            'Research and evaluate emerging technologies',
            'Solve the most complex technical challenges',
            'Influence technology roadmaps',
            'Represent company in technical community',
            'Drive innovation and technical excellence'
        ],
        icon: Award,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
];

const skillCategories = [
    {
        id: 'technical',
        name: 'Technical Skills',
        icon: Code,
        skills: [
            'Programming Languages',
            'Frameworks & Libraries',
            'Databases & Data Storage',
            'Cloud Platforms & DevOps',
            'Testing & Quality Assurance',
            'System Design & Architecture'
        ]
    },
    {
        id: 'soft',
        name: 'Soft Skills',
        icon: Users,
        skills: [
            'Communication & Presentation',
            'Problem Solving & Critical Thinking',
            'Teamwork & Collaboration',
            'Time Management & Organization',
            'Adaptability & Learning',
            'Leadership & Mentoring'
        ]
    },
    {
        id: 'business',
        name: 'Business Skills',
        icon: TrendingUp,
        skills: [
            'Project Management',
            'Requirements Analysis',
            'Stakeholder Management',
            'Product Understanding',
            'Strategic Thinking',
            'Risk Assessment'
        ]
    }
];

export default function CareerGuides() {
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <BookOpen className="h-8 w-8 text-primary-600" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Software Engineer Career Guide
                    </h1>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Navigate your software engineering career with our comprehensive guide covering skill requirements,
                    responsibilities, and growth paths from junior to principal engineer levels.
                </p>
            </div>

            {/* Quick Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Career Progression Path
                </h2>
                <div className="flex flex-wrap gap-3">
                    {careerLevels.map((level, index) => {
                        const Icon = level.icon;
                        return (
                            <div key={level.id} className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedLevel(selectedLevel === level.id ? null : level.id)}
                                    className={`${level.bgColor} ${level.color} px-4 py-2 rounded-lg font-medium text-sm border transition-all hover:scale-105 ${selectedLevel === level.id ? 'ring-2 ring-primary-500' : ''
                                        }`}
                                >
                                    <Icon className="h-4 w-4 inline mr-2" />
                                    {level.title}
                                </button>
                                {index < careerLevels.length - 1 && (
                                    <ArrowRight className="h-4 w-4 text-gray-400" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detailed Level View */}
            {selectedLevel && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    {(() => {
                        const level = careerLevels.find(l => l.id === selectedLevel)!;
                        const Icon = level.icon;
                        return (
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className={`${level.bgColor} p-3 rounded-lg`}>
                                        <Icon className={`h-8 w-8 ${level.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {level.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                                            {level.description}
                                        </p>
                                        <div className="flex gap-6 mt-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Experience: </span>
                                                <span className="text-gray-600 dark:text-gray-400">{level.experience}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Salary Range: </span>
                                                <span className="text-gray-600 dark:text-gray-400">{level.salary}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-yellow-500" />
                                            Key Skills Required
                                        </h4>
                                        <ul className="space-y-2">
                                            {level.keySkills.map((skill, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span className="text-gray-600 dark:text-gray-300">{skill}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <Target className="h-5 w-5 text-blue-500" />
                                            Key Responsibilities
                                        </h4>
                                        <ul className="space-y-2">
                                            {level.responsibilities.map((responsibility, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                    <span className="text-gray-600 dark:text-gray-300">{responsibility}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {level.nextLevel && (
                                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-700">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-primary-600" />
                                            Next Career Step
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Ready to advance? Click on <strong>{careerLevels.find(l => l.id === level.nextLevel)?.title}</strong> above to explore the next level in your career journey.
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Skills Overview */}
            <div className="grid lg:grid-cols-3 gap-6">
                {skillCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Icon className="h-6 w-6 text-primary-600" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {category.name}
                                </h3>
                            </div>
                            <ul className="space-y-3">
                                {category.skills.map((skill, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                        <span className="text-gray-600 dark:text-gray-300">{skill}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Action Items */}
            <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="h-8 w-8" />
                    <h2 className="text-2xl font-bold">Ready to Plan Your Growth?</h2>
                </div>
                <p className="text-primary-100 mb-6 text-lg">
                    Use our integrated growth planning tools to set goals, track skills, and accelerate your career progression.
                </p>
                <div className="flex gap-4">
                    <Link
                        to="/people"
                        className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center gap-2"
                    >
                        <Users className="h-5 w-5" />
                        View Team Profiles
                    </Link>
                    <Link
                        to="/action-items?title=Create Career Development Plan"
                        className="bg-primary-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-800 transition-colors flex items-center gap-2"
                    >
                        <Target className="h-5 w-5" />
                        Create Development Plan
                    </Link>
                </div>
            </div>
        </div>
    );
}
