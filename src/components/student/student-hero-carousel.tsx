"use client";

import Autoplay from "embla-carousel-autoplay";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { StudentIllustration } from "@/components/student/student-illustration";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Student } from "@/hooks/useStudentAuth";
import { CalendarDays, GraduationCap, LayoutDashboard, Megaphone } from "lucide-react";

export type UpcomingClassBlock = {
  dayLabel: string;
  periodName: string;
  startTime: string;
  endTime: string;
  subjectName?: string;
};

export type PortalEventBrief = {
  _id: string;
  eventTitle: string;
  startDate: string;
  eventType: string;
  isAllDay: boolean;
  startTime?: string;
};

export type AnnouncementBrief = {
  _id: string;
  title: string;
  content: string;
  publishedAt?: string;
  createdAt: string;
};

interface StudentHeroCarouselProps {
  student: Student;
  greet: string;
  upcomingHwCount: number | undefined;
  homeworkLoaded: boolean;
  hasTimetable: boolean;
  timetableLoaded: boolean;
  upcomingClasses: UpcomingClassBlock[];
  portalEvents: PortalEventBrief[] | undefined;
  announcements: AnnouncementBrief[] | undefined;
}

export function StudentHeroCarousel({
  student,
  greet,
  upcomingHwCount,
  homeworkLoaded,
  hasTimetable,
  timetableLoaded,
  upcomingClasses,
  portalEvents,
  announcements,
}: StudentHeroCarouselProps): React.JSX.Element {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const autoplayPlugins = useMemo(
    () => [Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true })],
    [],
  );

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = (): void => {
      setCurrent(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const nextClass = upcomingClasses[0];
  const firstEvent = portalEvents?.[0];
  const firstAnnouncement = announcements?.[0];

  const formatEventWhen = (e: PortalEventBrief): string => {
    const d = new Date(e.startDate).toLocaleDateString();
    if (e.isAllDay) return d;
    return e.startTime ? `${d} · ${e.startTime}` : d;
  };

  return (
    <div className="rounded-2xl border-2 border-violet-500 bg-violet-800 p-6 text-white shadow-sm dark:border-violet-800 dark:bg-violet-950/45 dark:text-white sm:p-8">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={autoplayPlugins}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          <CarouselItem className="pl-0">
            <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-violet-300 ring-offset-2 ring-offset-violet-50 dark:ring-violet-700 dark:ring-offset-violet-950/45"
                    width={56}
                    height={56}
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-md dark:bg-violet-600">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                )}
                <div>
                  <p className="mb-1 text-xs font-semibold text-white dark:text-white">{greet}</p>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    <span className="text-white dark:text-white">{student.firstName}</span>
                    <span className="text-white dark:text-white">, you&apos;re in</span>
                  </h1>
                  <p className="mt-1 text-sm text-white sm:text-base dark:text-white">
                    {student.className} · ID {student.studentId}
                  </p>
                </div>
              </div>
              <StudentIllustration variant="welcome" priority className="sm:max-w-[min(100%,280px)]" />
            </div>
          </CarouselItem>

          <CarouselItem className="pl-0">
            <div className="flex min-h-[140px] flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm dark:bg-violet-600">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl dark:text-white">
                    Today at a glance
                  </h2>
                  {!homeworkLoaded ? (
                    <p className="text-sm text-white dark:text-white">Loading your tasks…</p>
                  ) : (
                    <p className="text-sm text-white dark:text-white">
                      {upcomingHwCount === 0
                        ? "No homework due dates coming up. Great job staying on track."
                        : `${upcomingHwCount} homework task${upcomingHwCount === 1 ? "" : "s"} with upcoming due dates.`}
                    </p>
                  )}
                  {!timetableLoaded ? (
                    <p className="text-sm text-white dark:text-white">Loading your timetable…</p>
                  ) : !hasTimetable ? (
                    <p className="text-sm text-white dark:text-white">
                      Your timetable will appear when the school publishes it.
                    </p>
                  ) : nextClass ? (
                    <p className="text-sm font-medium text-white dark:text-white">
                      Next class:{" "}
                      <span className="text-white dark:text-white">
                        {nextClass.subjectName ?? nextClass.periodName} · {nextClass.startTime} – {nextClass.endTime}
                      </span>
                      <span className="block text-xs font-normal text-white dark:text-white">
                        {nextClass.dayLabel}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-white dark:text-white">
                      No more classes in this block—enjoy your time.
                    </p>
                  )}
                  <Button
                    variant="link"
                    className="h-auto px-0 font-semibold text-white hover:text-white/90 dark:text-white"
                    asChild
                  >
                    <Link href="/student/homework">Open homework</Link>
                  </Button>
                </div>
              </div>
              <StudentIllustration variant="emptyHomework" className="sm:max-w-[min(100%,200px)]" />
            </div>
          </CarouselItem>

          <CarouselItem className="pl-0">
            <div className="flex min-h-[140px] flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm dark:bg-violet-600">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl dark:text-white">
                    Next school event
                  </h2>
                  {portalEvents === undefined ? (
                    <p className="text-sm text-white dark:text-white">Loading events…</p>
                  ) : !firstEvent ? (
                    <p className="text-sm text-white dark:text-white">
                      No upcoming school events right now.
                    </p>
                  ) : (
                    <>
                      <p className="font-medium leading-snug text-white dark:text-white">{firstEvent.eventTitle}</p>
                      <p className="text-xs capitalize text-white dark:text-white">
                        {firstEvent.eventType.replace(/_/g, " ")} · {formatEventWhen(firstEvent)}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <StudentIllustration variant="emptyEvents" className="sm:max-w-[min(100%,200px)]" />
            </div>
          </CarouselItem>

          <CarouselItem className="pl-0">
            <div className="flex min-h-[140px] flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm dark:bg-violet-600">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div className="min-w-0 space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl dark:text-white">
                    Latest announcement
                  </h2>
                  {announcements === undefined ? (
                    <p className="text-sm text-white dark:text-white">Loading announcements…</p>
                  ) : !firstAnnouncement ? (
                    <p className="text-sm text-white dark:text-white">
                      No announcements right now.
                    </p>
                  ) : (
                    <>
                      <p className="font-medium leading-snug text-white dark:text-white">{firstAnnouncement.title}</p>
                      <p className="line-clamp-2 text-sm text-white dark:text-white">
                        {firstAnnouncement.content}
                      </p>
                      <p className="text-xs text-white dark:text-white">
                        {new Date(firstAnnouncement.publishedAt ?? firstAnnouncement.createdAt).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <StudentIllustration variant="announcement" className="sm:max-w-[min(100%,220px)]" />
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Hero slides">
        {count > 0 &&
          Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1} of ${count}`}
              className={cn(
                "h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-600 dark:focus-visible:ring-violet-500 dark:focus-visible:ring-offset-violet-950/45",
                i === current
                  ? "w-6 bg-white dark:bg-violet-500"
                  : "w-2 bg-white/45 hover:bg-white/70 dark:bg-violet-700/60 dark:hover:bg-violet-600",
              )}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
      </div>

      <p className="mt-2 text-center text-[11px] text-white sm:hidden dark:text-white">
        Swipe or tap the dots to see more
      </p>
    </div>
  );
}
