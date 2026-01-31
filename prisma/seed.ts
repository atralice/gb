import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { BlockType } from "@/types/workout";
import truncateDb from "test/helpers/test-helpers";

async function seed() {
  console.log("🌱 Seeding database...");

  // Truncate database to make seed idempotent
  console.log("🗑️  Truncating database...");
  await truncateDb();
  console.log("✅ Database truncated");

  // Create trainer and athlete
  const trainer = await prisma.user.create({
    data: {
      email: "trainer@example.com",
      name: "Trainer",
      role: UserRole.trainer,
    },
  });

  const athlete = await prisma.user.create({
    data: {
      email: "athlete@example.com",
      name: "Athlete",
      role: UserRole.athlete,
    },
  });

  console.log("✅ Created trainer and athlete");

  // Create exercises (exercise library)
  const exerciseMap = new Map<string, { id: string }>();

  const exercises = [
    { name: "Sentadilla bulgara", tags: ["fuerza"] },
    { name: "Press de hombros (sentado)", tags: ["fuerza"] },
    { name: "Dominada", tags: ["fuerza"] },
    { name: "Salto unilateral con cajón", tags: ["pliometrico"] },
    { name: "Slam ball", tags: ["pliometrico"] },
    { name: "Hip Thrust", tags: ["fuerza"] },
    { name: "Vuelta al mundo kb", tags: ["core"] },
    { name: "Peso muerto trap bar", tags: ["fuerza"] },
    { name: "Press inclinado a un brazo", tags: ["fuerza"] },
    { name: "Salto vertical sin contramovimiento", tags: ["pliometrico"] },
    { name: "Desplazamiento lateral explosivo", tags: ["pliometrico"] },
    { name: "Plyo push ups", tags: ["pliometrico"] },
    { name: "Remo con trap bar", tags: ["fuerza"] },
    { name: "Curl nórdico sin materiales", tags: ["fuerza"] },
    { name: "Dead bug con disco brazos", tags: ["core"] },
    { name: "Sidelying hip con mini band", tags: ["fuerza"] },
    { name: "Sentadilla con barra", tags: ["fuerza"] },
    { name: "Press mancuerna banco plano", tags: ["fuerza"] },
    { name: "Salto vertical con barra", tags: ["pliometrico"] },
    { name: "Saltos al cajón 60cm", tags: ["pliometrico"] },
    { name: "Cosaco squat", tags: ["fuerza"] },
    { name: "Espinales en maquina", tags: ["fuerza"] },
    { name: "Pallof", tags: ["core"] },
    { name: "Rotacion tronco", tags: ["movilidad"] },
    { name: "Estiramiento psoas dinamico", tags: ["movilidad"] },
    { name: "Flexión de tobillo dinámico desde altura", tags: ["movilidad"] },
    { name: "Apertura de pecho contra pared o cajón", tags: ["movilidad"] },
    { name: "Parabrisas con piernas", tags: ["movilidad"] },
  ];

  for (const { name, tags } of exercises) {
    const exercise = await prisma.exercise.create({
      data: {
        name,
        hasWeight:
          name.toLowerCase().includes("kg") ||
          name.toLowerCase().includes("peso") ||
          name.toLowerCase().includes("barra") ||
          name.toLowerCase().includes("mancuerna"),
        tags,
      },
    });
    exerciseMap.set(name, exercise);
  }

  console.log("✅ Created exercises");

  // Helper function to create workout day with exercises
  async function createWorkoutDay(
    dayIndex: number,
    weekNumber: number,
    notes: string | null,
    exercises: Array<{
      block: BlockType;
      order: number;
      exerciseName: string;
      sets: Array<{
        weightKg: number | null;
        reps: number;
        repsPerSide?: boolean;
      }>;
      comment: string | null;
      variants?: string[];
    }>,
    blockComments?: Partial<Record<BlockType, string>>
  ) {
    const workoutDay = await prisma.workoutDay.create({
      data: {
        trainerId: trainer.id,
        athleteId: athlete.id,
        weekNumber,
        dayIndex,
        label: `Día ${dayIndex}`,
        notes,
      },
    });

    // Create block comments if provided
    if (blockComments) {
      for (const [block, comment] of Object.entries(blockComments)) {
        if (comment) {
          await prisma.workoutDayBlockComment.create({
            data: {
              workoutDayId: workoutDay.id,
              block,
              comment,
            },
          });
        }
      }
    }

    for (const ex of exercises) {
      const exercise = exerciseMap.get(ex.exerciseName);
      if (!exercise) {
        console.warn(`⚠️  Exercise "${ex.exerciseName}" not found`);
        continue;
      }

      const workoutDayExercise = await prisma.workoutDayExercise.create({
        data: {
          exerciseId: exercise.id,
          workoutDayId: workoutDay.id,
          block: ex.block,
          order: ex.order,
          comment: ex.comment,
          variants: ex.variants || [],
        },
      });

      for (const [index, set] of ex.sets.entries()) {
        await prisma.set.create({
          data: {
            workoutDayExerciseId: workoutDayExercise.id,
            setIndex: index + 1,
            reps: set.reps,
            weightKg: set.weightKg,
            repsPerSide: set.repsPerSide ?? false,
          },
        });
      }
    }

    return workoutDay;
  }

  // Día 1, Semana 10
  await createWorkoutDay(
    1,
    10,
    null,
    [
      // Warmup exercises
      {
        block: BlockType.warmup,
        order: 1,
        exerciseName: "Rotacion tronco",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.warmup,
        order: 2,
        exerciseName: "Estiramiento psoas dinamico",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.warmup,
        order: 3,
        exerciseName: "Flexión de tobillo dinámico desde altura",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.warmup,
        order: 4,
        exerciseName: "Apertura de pecho contra pared o cajón",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.warmup,
        order: 5,
        exerciseName: "Parabrisas con piernas",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.a,
        order: 1,
        exerciseName: "Sentadilla bulgara",
        sets: [
          { weightKg: 15, reps: 6, repsPerSide: true },
          { weightKg: 25, reps: 5, repsPerSide: true },
          { weightKg: 35, reps: 2, repsPerSide: true },
          { weightKg: 35, reps: 2, repsPerSide: true },
        ],
        comment: "Reps por lado y peso total",
      },
      {
        block: BlockType.a,
        order: 2,
        exerciseName: "Press de hombros (sentado)",
        sets: [
          { weightKg: 10, reps: 5 },
          { weightKg: 15, reps: 5 },
          { weightKg: 20, reps: 5 },
          { weightKg: 20, reps: 5 },
        ],
        comment:
          "El peso equivale por mancuerna, TONI HACELO ASI PERO ARRODILLADO EN EL PISO",
        variants: ["core_activo"],
      },
      {
        block: BlockType.a,
        order: 3,
        exerciseName: "Dominada",
        sets: [
          { weightKg: 0, reps: 5 },
          { weightKg: 5, reps: 4 },
          { weightKg: 12.2, reps: 3 },
          { weightKg: 12.2, reps: 3 },
        ],
        comment: "Agarre prono (dominada normal)",
      },
      {
        block: BlockType.b,
        order: 1,
        exerciseName: "Salto unilateral con cajón",
        sets: [{ weightKg: null, reps: 4 }],
        comment:
          "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
      },
      {
        block: BlockType.b,
        order: 2,
        exerciseName: "Slam ball",
        sets: [{ weightKg: null, reps: 4 }],
        comment: null,
      },
      {
        block: BlockType.c,
        order: 1,
        exerciseName: "Hip Thrust",
        sets: [
          { weightKg: 100, reps: 4 },
          { weightKg: 100, reps: 4 },
          { weightKg: 100, reps: 4 },
        ],
        comment:
          "Kg sumando barra. CONCÉNTRICO: LA FASE EN CONTRA DE LA GRAVEDAD, cuando sube la barra",
        variants: ["concentrica_explosiva"],
      },
      {
        block: BlockType.c,
        order: 2,
        exerciseName: "Vuelta al mundo kb",
        sets: [
          { weightKg: 20, reps: 5, repsPerSide: true },
          { weightKg: 20, reps: 5, repsPerSide: true },
          { weightKg: 20, reps: 5, repsPerSide: true },
        ],
        comment:
          "Hacerlo con una rodilla elevada y mantener equilibrio. NO SE DEBE MOVER LA CADERA EN ABSOLUTO, y mantener costillas cerradas (ombligo metido para adentro)",
        variants: ["cadera_fija", "costillas_cerradas"],
      },
    ],
    {
      [BlockType.a]: "Enfocate en control y buena técnica.",
      [BlockType.b]: "Descanso 30–60s · súper fresco.",
      [BlockType.c]: "Controlá core y cadera.",
    }
  );

  // Día 2, Semana 10
  await createWorkoutDay(
    2,
    10,
    null,
    [
      // Warmup exercises
      {
        block: BlockType.warmup,
        order: 1,
        exerciseName: "Rotacion tronco",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.warmup,
        order: 2,
        exerciseName: "Estiramiento psoas dinamico",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.warmup,
        order: 3,
        exerciseName: "Flexión de tobillo dinámico desde altura",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.warmup,
        order: 4,
        exerciseName: "Apertura de pecho contra pared o cajón",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.warmup,
        order: 5,
        exerciseName: "Parabrisas con piernas",
        sets: [
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
          { weightKg: null, reps: 5, repsPerSide: true },
        ],
        comment: null,
      },
      {
        block: BlockType.a,
        order: 1,
        exerciseName: "Peso muerto trap bar",
        sets: [
          { weightKg: 50, reps: 5 },
          { weightKg: 65, reps: 4 },
          { weightKg: 90, reps: 3 },
          { weightKg: 90, reps: 3 },
        ],
        comment:
          'Mira el video para activar dorsales, en la bajada sólo acompaña la caída hasta la tibia, dsp la "dejas caer" / Kg sumando barra  / CONCÉNTRICO: LA FASE EN CONTRA DE LA GRAVEDAD, cuando sube la barra',
        variants: ["concentrica_explosiva"],
      },
      {
        block: BlockType.a,
        order: 2,
        exerciseName: "Press inclinado a un brazo",
        sets: [
          { weightKg: 10, reps: 6 },
          { weightKg: 15, reps: 5 },
          { weightKg: 20, reps: 3 },
          { weightKg: 20, reps: 3 },
        ],
        comment: null,
      },
      {
        block: BlockType.b,
        order: 1,
        exerciseName: "Salto vertical sin contramovimiento",
        sets: [{ weightKg: null, reps: 0 }],
        comment:
          "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
        variants: ["explosivo"],
      },
      {
        block: BlockType.b,
        order: 2,
        exerciseName: "Desplazamiento lateral explosivo",
        sets: [{ weightKg: null, reps: 0 }],
        comment: null,
      },
      {
        block: BlockType.b,
        order: 3,
        exerciseName: "Plyo push ups",
        sets: [{ weightKg: null, reps: 0 }],
        comment: null,
      },
      {
        block: BlockType.c,
        order: 1,
        exerciseName: "Remo con trap bar",
        sets: [
          { weightKg: 40, reps: 5 },
          { weightKg: 40, reps: 5 },
          { weightKg: 40, reps: 5 },
        ],
        comment: null,
      },
      {
        block: BlockType.c,
        order: 2,
        exerciseName: "Curl nórdico sin materiales",
        sets: [{ weightKg: null, reps: 0 }],
        comment: "Frenar la caída sin quebrar lumbar",
      },
      {
        block: BlockType.c,
        order: 3,
        exerciseName: "Dead bug con disco brazos",
        sets: [
          { weightKg: 15, reps: 12 },
          { weightKg: 15, reps: 12 },
          { weightKg: 15, reps: 12 },
        ],
        comment:
          "Alejá piernas y brazos en 2-3seg y volves lento también. La columna tiene que estar NEUTRA! Como si durmieras boca arriba.",
      },
      {
        block: BlockType.c,
        order: 4,
        exerciseName: "Sidelying hip con mini band",
        sets: [{ weightKg: null, reps: 0 }],
        comment: null,
      },
    ],
    {
      [BlockType.a]: "Enfocate en control y buena técnica.",
      [BlockType.b]: "Descanso 30–60s · súper fresco.",
      [BlockType.c]: "Controlá core y cadera.",
    }
  );

  // Día 3, Semana 10
  await createWorkoutDay(
    3,
    10,
    null,
    [
      {
        block: BlockType.a,
        order: 1,
        exerciseName: "Sentadilla con barra",
        sets: [
          { weightKg: 40, reps: 5 },
          { weightKg: 50, reps: 4 },
          { weightKg: 65, reps: 2 },
          { weightKg: 65, reps: 2 },
        ],
        comment:
          "Kg sumando barra TONI BUSCÁ LA MAX VELOCIDAD EN LA SUBIDA CONCÉNTRICO: LA FASE EN CONTRA DE LA GRAVEDAD, cuando sube la barra",
        variants: ["concentrica_explosiva"],
      },
      {
        block: BlockType.a,
        order: 2,
        exerciseName: "Press mancuerna banco plano",
        sets: [
          { weightKg: 10, reps: 5 },
          { weightKg: 15, reps: 4 },
          { weightKg: 20, reps: 4 },
          { weightKg: 20, reps: 4 },
        ],
        comment: "El peso equivale por mancuerna",
      },
      {
        block: BlockType.b,
        order: 1,
        exerciseName: "Salto vertical con barra",
        sets: [{ weightKg: null, reps: 0 }],
        comment:
          "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
        variants: ["explosivo"],
      },
      {
        block: BlockType.b,
        order: 2,
        exerciseName: "Saltos al cajón 60cm",
        sets: [{ weightKg: null, reps: 0 }],
        comment: null,
      },
      {
        block: BlockType.c,
        order: 1,
        exerciseName: "Cosaco squat",
        sets: [{ weightKg: null, reps: 0 }],
        comment: "Reps por lado y peso total",
      },
      {
        block: BlockType.c,
        order: 2,
        exerciseName: "Espinales en maquina",
        sets: [
          { weightKg: 15, reps: 8 },
          { weightKg: 15, reps: 8 },
          { weightKg: 15, reps: 8 },
        ],
        comment: null,
      },
      {
        block: BlockType.c,
        order: 3,
        exerciseName: "Pallof",
        sets: [
          { weightKg: null, reps: 10, repsPerSide: true },
          { weightKg: null, reps: 10, repsPerSide: true },
          { weightKg: null, reps: 10, repsPerSide: true },
        ],
        comment: "Si puedo hago con la pierna de arriba elevada",
      },
    ],
    {
      [BlockType.a]: "Enfocate en control y buena técnica.",
      [BlockType.b]: "Descanso 30–60s · súper fresco.",
      [BlockType.c]: "Controlá core y cadera.",
    }
  );

  console.log("✅ Seeding completed!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
