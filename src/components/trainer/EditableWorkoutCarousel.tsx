"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { BlockType, blockLabels } from "@/types/workout";
import { cn } from "@/lib/cn";
import EditableExerciseCard from "./EditableExerciseCard";
import EditableBlockHeader from "./EditableBlockHeader";
import {
  partitionExercises,
  partitionBlockComments,
} from "@/lib/workouts/partition";
import type { WorkoutDayWithExercises } from "@/lib/workouts/getWorkoutDay";

type EditableWorkoutCarouselProps = {
  workoutDay: NonNullable<WorkoutDayWithExercises>;
};

const EditableWorkoutCarousel = ({
  workoutDay,
}: EditableWorkoutCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeBlock, setActiveBlock] = useState<BlockType>(BlockType.a);

  const exercises = partitionExercises(workoutDay.exercises);
  const blockComments = partitionBlockComments(workoutDay.blockComments || []);

  const availableBlocks = Object.values(BlockType).filter(
    (blockType) => exercises[blockType].length > 0
  );

  const selectBlock = (blockType: BlockType) => {
    setActiveBlock(blockType);

    if (!carouselRef.current) return;

    const slides = carouselRef.current.children;
    let slideIndex = 0;
    for (const bt of Object.values(BlockType)) {
      if (bt === blockType) break;
      if (exercises[bt].length > 0) slideIndex++;
    }

    const targetSlide = slides[slideIndex] as HTMLElement;
    if (targetSlide && carouselRef.current) {
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

  useEffect(() => {
    if (!carouselRef.current || availableBlocks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const blockType = entry.target.getAttribute(
              "data-block"
            ) as BlockType;
            if (blockType) {
              setActiveBlock(blockType);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const slides = carouselRef.current.children;
    Array.from(slides).forEach((slide) => observer.observe(slide));

    return () => observer.disconnect();
  }, [availableBlocks.length]);

  useEffect(() => {
    if (availableBlocks.length > 0 && !activeBlock) {
      setActiveBlock(availableBlocks[0]);
    }
  }, [availableBlocks, activeBlock]);

  return (
    <div>
      {availableBlocks.length > 1 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {availableBlocks.map((blockType) => (
            <button
              key={blockType}
              onClick={() => selectBlock(blockType)}
              className={cn(
                "rounded px-2 py-1 text-[10px] font-medium transition-colors",
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
        className="carousel mb-2 flex gap-2 overflow-x-auto pb-1.5 scroll-smooth"
        ref={carouselRef}
        style={{ scrollbarWidth: "thin" }}
      >
        {Object.values(BlockType).map((blockType) => {
          const blockExercises = exercises[blockType];
          if (blockExercises.length === 0) return null;

          const allTags = new Set<string>();
          blockExercises.forEach((ex) => {
            const exerciseTags = ex.exercise.tags || [];
            exerciseTags.forEach((tag: string) => allTags.add(tag));
          });
          const uniqueTags = Array.from(allTags);

          const comment = blockComments[blockType];

          return (
            <article
              key={blockType}
              data-block={blockType}
              className="carousel-slide w-[calc(100vw-2rem)] max-w-md shrink-0 p-2 sm:w-96"
            >
              <EditableBlockHeader
                block={blockType}
                title={blockLabels[blockType]}
                tags={uniqueTags}
                comment={comment}
                workoutDayId={workoutDay.id}
              />
              <div className="space-y-2">
                {blockExercises.map((exercise) => (
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
