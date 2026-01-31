"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { BlockType, blockLabels } from "@/types/workout";
import { cn } from "@/lib/cn";
import ExerciseCard from "./ExerciseCard";
import BlockHeader from "./BlockHeader";
import {
  partitionExercises,
  partitionBlockComments,
} from "@/lib/workouts/partition";
import type { WorkoutDayWithExercises } from "@/lib/workouts/getWorkoutDay";

type WorkoutCarouselProps = {
  workoutDay: NonNullable<WorkoutDayWithExercises>;
};

const WorkoutCarousel = ({ workoutDay }: WorkoutCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeBlock, setActiveBlock] = useState<BlockType>(BlockType.a);

  const exercises = partitionExercises(workoutDay.exercises);
  const blockComments = partitionBlockComments(workoutDay.blockComments || []);

  // Build list of available blocks (only those with exercises)
  const availableBlocks = Object.values(BlockType).filter(
    (blockType) => exercises[blockType].length > 0
  );

  // Memoize exercises to avoid recreating on every render
  const exercisesMemo = useMemo(() => exercises, [workoutDay.exercises]);

  const selectBlock = (blockType: BlockType) => {
    setActiveBlock(blockType);

    if (!carouselRef.current) return;

    const slides = carouselRef.current.children;
    // Find the slide index for the block by counting blocks with exercises before it
    let slideIndex = 0;
    for (const bt of Object.values(BlockType)) {
      if (bt === blockType) break;
      if (exercises[bt].length > 0) slideIndex++;
    }

    const targetSlide = slides[slideIndex] as HTMLElement;
    if (targetSlide && carouselRef.current) {
      // Scroll the carousel container directly to the target slide position
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
  };

  // Track scroll position to update active block button
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const slides = carousel.children;
      const carouselRect = carousel.getBoundingClientRect();

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + slideRect.width / 2;
        const carouselCenter = carouselRect.left + carouselRect.width / 2;

        // Check if slide is in the center of viewport
        if (Math.abs(slideCenter - carouselCenter) < slideRect.width / 2) {
          // Determine which block this slide represents
          let slideCount = 0;
          let blockType = BlockType.warmup;
          for (const bt of Object.values(BlockType)) {
            if (exercises[bt].length > 0) {
              if (slideCount === i) {
                blockType = bt;
                break;
              }
              slideCount++;
            }
          }
          setActiveBlock(blockType);
          break;
        }
      }
    };

    carousel.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => {
      carousel.removeEventListener("scroll", handleScroll);
    };
  }, [exercisesMemo]);

  // Scroll to Block A on mount - skip warmup if present
  useEffect(() => {
    if (carouselRef.current) {
      const slides = carouselRef.current.children;
      // Find Block A slide index
      let blockASlideIndex = 0;
      for (const bt of Object.values(BlockType)) {
        if (bt === BlockType.a) break;
        if (exercises[bt].length > 0) blockASlideIndex++;
      }

      const blockASlide = slides[blockASlideIndex];
      if (blockASlide) {
        blockASlide.scrollIntoView({
          behavior: "instant",
          block: "nearest",
        });
      }
    }
  }, [exercisesMemo]);

  return (
    <div>
      {/* Block Navigation Buttons */}
      {availableBlocks.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {availableBlocks.map((blockType) => (
            <button
              key={blockType}
              onClick={() => selectBlock(blockType)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                activeBlock === blockType
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {blockLabels[blockType]}
            </button>
          ))}
        </div>
      )}

      <div
        className="carousel mb-2 flex gap-2 overflow-x-auto pb-2 scroll-smooth"
        ref={carouselRef}
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Render slides for each block type that has exercises */}
        {Object.values(BlockType).map((blockType) => {
          const blockExercises = exercises[blockType];
          if (blockExercises.length === 0) return null;

          // Collect unique tags from exercises in this block
          const allTags = new Set<string>();
          blockExercises.forEach((ex) => {
            const exerciseTags = ex.exercise.tags || [];
            exerciseTags.forEach((tag: string) => allTags.add(tag));
          });
          const uniqueTags = Array.from(allTags);

          const blockComment = blockComments[blockType];

          return (
            <article
              key={blockType}
              className="carousel-slide w-[calc(100vw-2rem)] max-w-md shrink-0 p-2 sm:w-96"
            >
              <BlockHeader
                block={blockType}
                title={blockLabels[blockType]}
                comment={blockComment}
                tags={uniqueTags}
              />
              <div className="space-y-2">
                {blockExercises.map((exercise) => (
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
