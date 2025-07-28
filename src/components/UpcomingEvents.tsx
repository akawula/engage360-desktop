import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, ExternalLink, RefreshCw, AlertCircle, Users } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { googleCalendarService, type CalendarEvent } from '../services/googleCalendarService';

interface UpcomingEventsProps {
    maxEvents?: number;
    showRefreshButton?: boolean;
}

export default function UpcomingEvents({ maxEvents = 5, showRefreshButton = true }: UpcomingEventsProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data: events, isLoading, error, refetch } = useQuery({
        queryKey: ['upcoming-events', maxEvents],
        queryFn: async () => {
            if (!googleCalendarService.isAuthenticated()) {
                return [];
            }

            const response = await googleCalendarService.getUpcomingEvents(maxEvents);
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Failed to fetch events');
            }
        },
        enabled: googleCalendarService.isAuthenticated(),
        retry: 1,
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
        staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    };

    const formatEventTime = (event: CalendarEvent) => {
        try {
            const startDate = parseISO(event.start.dateTime);
            const endDate = parseISO(event.end.dateTime);
            
            const startTime = format(startDate, 'h:mm a');
            const endTime = format(endDate, 'h:mm a');
            
            let dateLabel = '';
            if (isToday(startDate)) {
                dateLabel = 'Today';
            } else if (isTomorrow(startDate)) {
                dateLabel = 'Tomorrow';
            } else {
                dateLabel = format(startDate, 'MMM d');
            }
            
            return `${dateLabel} • ${startTime} - ${endTime}`;
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getEventStatus = (event: CalendarEvent) => {
        try {
            const startDate = parseISO(event.start.dateTime);
            const endDate = parseISO(event.end.dateTime);
            const now = new Date();
            
            if (now >= startDate && now <= endDate) {
                return 'ongoing';
            } else if (now < startDate) {
                const hoursUntil = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (hoursUntil <= 1) {
                    return 'starting-soon';
                }
                return 'upcoming';
            } else {
                return 'past';
            }
        } catch (error) {
            return 'upcoming';
        }
    };

    if (!googleCalendarService.isAuthenticated()) {
        return (
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-dark-200 dark:border-dark-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-dark-400" />
                    <h3 className="text-lg font-semibold text-dark-950 dark:text-white">
                        Upcoming Events
                    </h3>
                </div>
                <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-dark-300 dark:text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-600 dark:text-dark-400 mb-2">
                        Connect Google Calendar to see your upcoming events
                    </p>
                    <p className="text-sm text-dark-500 dark:text-dark-500">
                        Your calendar events will be displayed here once connected
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-dark-200 dark:border-dark-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-dark-400" />
                    <h3 className="text-lg font-semibold text-dark-950 dark:text-white">
                        Upcoming Events
                    </h3>
                    {showRefreshButton && (
                        <RefreshCw className="w-4 h-4 text-dark-400 animate-spin ml-auto" />
                    )}
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-4 bg-dark-200 dark:bg-dark-700 rounded mb-2"></div>
                            <div className="h-3 bg-dark-100 dark:bg-dark-800 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-dark-200 dark:border-dark-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-dark-400" />
                    <h3 className="text-lg font-semibold text-dark-950 dark:text-white">
                        Upcoming Events
                    </h3>
                    {showRefreshButton && (
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="ml-auto p-1 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">
                        Failed to load events: {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-dark-900 rounded-xl border border-dark-200 dark:border-dark-700 p-6">
            <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-dark-950 dark:text-white">
                    Upcoming Events
                </h3>
                {showRefreshButton && (
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="ml-auto p-1 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 transition-colors"
                        title="Refresh events"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>

            {!events || events.length === 0 ? (
                <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-dark-300 dark:text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-600 dark:text-dark-400 mb-2">
                        No upcoming events
                    </p>
                    <p className="text-sm text-dark-500 dark:text-dark-500">
                        Your next events will appear here
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => {
                        const status = getEventStatus(event);
                        return (
                            <div
                                key={event.id}
                                className={`p-4 rounded-lg border transition-colors ${
                                    status === 'ongoing'
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                        : status === 'starting-soon'
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                        : 'bg-dark-50 dark:bg-dark-800 border-dark-200 dark:border-dark-700'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-medium text-dark-950 dark:text-white truncate">
                                                {event.summary}
                                            </h4>
                                            {event.htmlLink && (
                                                <a
                                                    href={event.htmlLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                                    title="Open in Google Calendar"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-2 text-sm text-dark-600 dark:text-dark-400">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatEventTime(event)}</span>
                                            {status === 'ongoing' && (
                                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                                    Live
                                                </span>
                                            )}
                                            {status === 'starting-soon' && (
                                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                                                    Soon
                                                </span>
                                            )}
                                        </div>

                                        {event.location && (
                                            <div className="flex items-center gap-2 mt-1 text-sm text-dark-600 dark:text-dark-400">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                        )}

                                        {event.attendees && event.attendees.length > 0 && (
                                            <div className="flex items-center gap-2 mt-1 text-sm text-dark-600 dark:text-dark-400">
                                                <Users className="w-4 h-4" />
                                                <span>{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
                                            </div>
                                        )}

                                        {event.description && (
                                            <p className="mt-2 text-sm text-dark-600 dark:text-dark-400 line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}