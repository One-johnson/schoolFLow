"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const VARIANT_SRC: Record<
  "welcome" | "emptyHomework" | "emptyEvents" | "emptyTimetable" | "announcement",
  { src: string; width: number; height: number }
> = {
  welcome: {
    src: "/illustrations/student/focused.svg",
    width: 280,
    height: 200,
  },
  emptyHomework: {
    src: "/illustrations/student/homework.svg",
    width: 200,
    height: 160,
  },
  emptyEvents: {
    src: "/illustrations/student/reminder.svg",
    width: 200,
    height: 160,
  },
  emptyTimetable: {
    src: "/illustrations/student/timetable.svg",
    width: 200,
    height: 160,
  },
  announcement: {
    src: "/illustrations/student/taking-notes.svg",
    width: 240,
    height: 140,
  },
};

export type StudentIllustrationVariant = keyof typeof VARIANT_SRC;

interface StudentIllustrationProps {
  variant: StudentIllustrationVariant;
  /** Hero-style sizing on dashboard */
  priority?: boolean;
  className?: string;
  alt?: string;
}

export function StudentIllustration({
  variant,
  priority = false,
  className,
  alt,
}: StudentIllustrationProps): React.JSX.Element {
  const { src, width, height } = VARIANT_SRC[variant];
  const defaultAlt =
    variant === "welcome"
      ? "Welcome illustration"
      : variant === "emptyHomework"
        ? "All caught up illustration"
        : variant === "emptyEvents"
          ? "No events illustration"
          : variant === "emptyTimetable"
            ? "Schedule illustration"
            : "Notes and announcements illustration";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        variant === "welcome"
          ? "mx-auto w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px]"
          : variant === "announcement"
            ? "mx-auto w-full max-w-[180px] sm:max-w-[220px]"
            : "mx-auto w-full max-w-[140px] sm:max-w-[160px]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt ?? defaultAlt}
        width={width}
        height={height}
        priority={priority}
        sizes={
          variant === "welcome"
            ? "(min-width: 640px) 280px, 200px"
            : variant === "announcement"
              ? "(min-width: 640px) 220px, 180px"
              : "(min-width: 640px) 160px, 140px"
        }
        className="h-auto w-full object-contain"
      />
    </div>
  );
}
