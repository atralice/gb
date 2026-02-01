"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/cn";
import EditableExerciseCard from "./EditableExerciseCard";
import EditableBlockHeader from "./EditableBlockHeader";
import { getBlockLabel } from "@/lib/workouts/partition";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";

type EditableWorkoutCarouselProps = {
  workoutDay: NonNullable<WorkoutDayWithBlocks>;
};

const EditableWorkoutCarousel = ({
  workoutDay,
}: EditableWorkoutCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [rawActiveBlockIndex, setActiveBlockIndex] = useState(0);

  const blocks = workoutDay.blocks;

  // Filter to only blocks that have exercises
  const blocksWithExercises = useMemo(
    () => blocks.filter((block) => block.exercises.length > 0),
    [blocks]
  );

  // Clamp active index to valid range
  const activeBlockIndex =
    blocksWithExercises.length > 0
      ? Math.min(rawActiveBlockIndex, blocksWithExercises.length - 1)
      : 0;

  const scrollToSlide = useCallback((index: number) => {
    if (!carouselRef.current) return;

    const slides = carouselRef.current.children;
    const targetSlide = slides[index];

    if (targetSlide instanceof HTMLElement) {
      const carousel = carouselRef.current;
      const slideLeft = targetSlide.offsetLeft;
      const slideWidth = targetSlide.offsetWidth;
      const carouselWidth = carousel.offsetWidth;
      const scrollPosition = slideLeft - (carouselWidth - slideWidth) / 2;

      carousel.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, []);

  const selectBlock = (index: number) => {
    setActiveBlockIndex(index);
    scrollToSlide(index);
  };

  useEffect(() => {
    if (!carouselRef.current || blocksWithExercises.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const blockId = entry.target.getAttribute("data-block-id");
            const index = blocksWithExercises.findIndex(
              (b) => b.id === blockId
            );
            if (index >= 0) {
              setActiveBlockIndex(index);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const slides = carouselRef.current.children;
    Array.from(slides).forEach((slide) => observer.observe(slide));

    return () => observer.disconnect();
  }, [blocksWithExercises]);

  return (
    <div>
      {blocksWithExercises.length > 1 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {blocksWithExercises.map((block, index) => (
            <button
              key={block.id}
              onClick={() => selectBlock(index)}
              className={cn(
                "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                activeBlockIndex === index
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {getBlockLabel(block)}
            </button>
          ))}
        </div>
      )}

      <div
        className="carousel mb-2 flex gap-2 overflow-x-auto pb-1.5 scroll-smooth"
        ref={carouselRef}
        style={{ scrollbarWidth: "thin" }}
      >
        {blocksWithExercises.map((block) => {
          const allTags = new Set<string>();
          block.exercises.forEach((ex) => {
            const exerciseTags = ex.exercise.tags || [];
            exerciseTags.forEach((tag: string) => allTags.add(tag));
          });
          const uniqueTags = Array.from(allTags);

          return (
            <article
              key={block.id}
              data-block-id={block.id}
              className="carousel-slide w-[calc(100vw-2rem)] max-w-md shrink-0 p-2 sm:w-96"
            >
              <EditableBlockHeader
                blockId={block.id}
                title={getBlockLabel(block)}
                tags={uniqueTags}
                comment={block.comment}
              />
              <div className="space-y-2">
                {block.exercises.map((exercise) => (
                  <EditableExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default EditableWorkoutCarousel;
