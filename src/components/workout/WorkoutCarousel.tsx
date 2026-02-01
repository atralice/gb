"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/cn";
import ExerciseCard from "./ExerciseCard";
import BlockHeader from "./BlockHeader";
import { getBlockLabel } from "@/lib/workouts/partition";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";

type WorkoutCarouselProps = {
  workoutDay: NonNullable<WorkoutDayWithBlocks>;
};

const WorkoutCarousel = ({ workoutDay }: WorkoutCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const blocks = workoutDay.blocks;

  // Filter to only blocks that have exercises
  const blocksWithExercises = useMemo(
    () => blocks.filter((block) => block.exercises.length > 0),
    [blocks]
  );

  // Calculate initial block index (first non-warmup block)
  const initialBlockIndex = useMemo(() => {
    const firstMainBlockIndex = blocksWithExercises.findIndex(
      (block) => block.order > 0
    );
    return firstMainBlockIndex > 0 ? firstMainBlockIndex : 0;
  }, [blocksWithExercises]);

  const [activeBlockIndex, setActiveBlockIndex] = useState(initialBlockIndex);

  const scrollToSlide = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
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
          behavior,
        });
      }
    },
    []
  );

  const selectBlock = (index: number) => {
    setActiveBlockIndex(index);
    scrollToSlide(index);
  };

  // Track scroll position to update active block button
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const slides = carousel.children;
      const carouselRect = carousel.getBoundingClientRect();

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        if (!(slide instanceof HTMLElement)) continue;

        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + slideRect.width / 2;
        const carouselCenter = carouselRect.left + carouselRect.width / 2;

        if (Math.abs(slideCenter - carouselCenter) < slideRect.width / 2) {
          setActiveBlockIndex(i);
          break;
        }
      }
    };

    carousel.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      carousel.removeEventListener("scroll", handleScroll);
    };
  }, [blocksWithExercises]);

  // Scroll to initial block on mount
  useEffect(() => {
    if (!hasInitialized.current && initialBlockIndex > 0) {
      hasInitialized.current = true;
      scrollToSlide(initialBlockIndex, "instant");
    }
  }, [initialBlockIndex, scrollToSlide]);

  return (
    <div>
      {/* Block Navigation Buttons */}
      {blocksWithExercises.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {blocksWithExercises.map((block, index) => (
            <button
              key={block.id}
              onClick={() => selectBlock(index)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
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
        className="carousel mb-2 flex gap-2 overflow-x-auto pb-2 scroll-smooth"
        ref={carouselRef}
        style={{ scrollbarWidth: "thin" }}
      >
        {blocksWithExercises.map((block) => {
          // Collect unique tags from exercises in this block
          const allTags = new Set<string>();
          block.exercises.forEach((ex) => {
            const exerciseTags = ex.exercise.tags || [];
            exerciseTags.forEach((tag: string) => allTags.add(tag));
          });
          const uniqueTags = Array.from(allTags);

          return (
            <article
              key={block.id}
              className="carousel-slide w-[calc(100vw-2rem)] max-w-md shrink-0 p-2 sm:w-96"
            >
              <BlockHeader
                title={getBlockLabel(block)}
                comment={block.comment}
                tags={uniqueTags}
              />
              <div className="space-y-2">
                {block.exercises.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default WorkoutCarousel;
