import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import truncateDb from "test/helpers/test-helpers";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  // Truncate database to make seed idempotent
  console.log("🗑️  Truncating database...");
  await truncateDb();
  console.log("✅ Database truncated");

  // Hash the shared password
  const passwordHash = await bcrypt.hash("todobien", 12);

  // Create trainer
  const trainer = await prisma.user.create({
    data: {
      email: "trainer@example.com",
      name: "Solange",
      role: UserRole.trainer,
      passwordHash,
    },
  });

  // Create athletes with passwords
  const toni = await prisma.user.create({
    data: {
      email: "atralice@gmail.com",
      name: "Toni",
      role: UserRole.athlete,
      passwordHash,
    },
  });

  const amani = await prisma.user.create({
    data: {
      email: "amanijuanagustin@gmail.com",
      name: "Amani",
      role: UserRole.athlete,
      passwordHash,
    },
  });

  const athletes = [toni, amani];

  // Link trainer to athletes
  for (const athlete of athletes) {
    await prisma.trainerAthlete.create({
      data: {
        trainerId: trainer.id,
        athleteId: athlete.id,
      },
    });
  }

  console.log("✅ Created trainer and athletes");

  // Create exercises (exercise library)
  const exerciseMap = new Map<string, { id: string }>();

  const exercises = [
    {
      name: "Sentadilla bulgara",
      tags: ["fuerza", "piernas", "unilateral"],
      videoUrl: "https://youtu.be/IE3ZJezh-wc?t=41",
    },
    { name: "Press de hombros (sentado)", tags: ["fuerza", "hombros"] },
    {
      name: "Dominada",
      tags: ["fuerza", "espalda", "pull"],
      videoUrl: "https://youtu.be/637SzIkGrIg?t=111",
    },
    { name: "Salto unilateral con cajón", tags: ["pliometrico", "piernas"] },
    {
      name: "Slam ball",
      tags: ["pliometrico", "full body"],
      videoUrl: "https://www.youtube.com/watch?v=ePo39a3mSfk",
    },
    {
      name: "Hip Thrust",
      tags: ["fuerza", "gluteos"],
      videoUrl: "https://youtu.be/1lNuXVeJ1X8?t=2",
    },
    { name: "Vuelta al mundo kb", tags: ["core", "estabilidad"] },
    {
      name: "Peso muerto trap bar",
      tags: ["fuerza", "piernas", "espalda"],
      videoUrl: "https://youtu.be/FcMwHOyaZYU?si=CGrCVbLLsGjQ9Rtl&t=35",
    },
    {
      name: "Press inclinado a un brazo",
      tags: ["fuerza", "pecho", "unilateral"],
      videoUrl:
        "https://www.tiktok.com/@arielcouceirogo0/video/7139529903854079237",
    },
    {
      name: "Salto vertical sin contramovimiento",
      tags: ["pliometrico"],
      videoUrl: "https://www.instagram.com/reel/CVAycwAgEZ6/",
    },
    {
      name: "Desplazamiento lateral explosivo",
      tags: ["pliometrico", "agilidad"],
      videoUrl: "https://www.youtube.com/watch?v=TH83JG97ddg",
    },
    { name: "Plyo push ups", tags: ["pliometrico", "pecho"] },
    { name: "Remo con trap bar", tags: ["fuerza", "espalda"] },
    {
      name: "Curl nórdico sin materiales",
      tags: ["fuerza", "isquiotibiales"],
      videoUrl: "https://youtu.be/7NYAaiWRkcE?si=b5zzRCXWOR1TwtyD&t=1",
    },
    {
      name: "Dead bug con disco brazos",
      tags: ["core"],
      videoUrl: "https://youtu.be/0qumyQw0IZg?si=YZlZlI2EeHXe1qKN",
    },
    {
      name: "Sidelying hip con mini band",
      tags: ["fuerza", "gluteos", "activacion"],
    },
    {
      name: "Sentadilla con barra",
      tags: ["fuerza", "piernas"],
      videoUrl: "https://youtu.be/dsCuiccYNGs?si=lE-vf1ODG6bFo5MZ&t=3",
    },
    {
      name: "Press mancuerna banco plano",
      tags: ["fuerza", "pecho"],
      videoUrl: "https://youtu.be/2XtuyTKBU5A?si=1vcxLyQbgFX-Omsi&t=60",
    },
    { name: "Salto vertical con barra", tags: ["pliometrico", "potencia"] },
    { name: "Saltos al cajón 60cm", tags: ["pliometrico"] },
    { name: "Saltos al cajón 70cm", tags: ["pliometrico"] },
    {
      name: "Cosaco squat",
      tags: ["fuerza", "movilidad", "piernas"],
      videoUrl: "https://youtu.be/6TcJFYY-Ohw?si=OzckHaOjcbFlamvG&t=4",
    },
    { name: "Espinales en maquina", tags: ["fuerza", "espalda baja"] },
    {
      name: "Pallof",
      tags: ["core", "anti-rotacion"],
      videoUrl: "https://www.youtube.com/shorts/93Zi2TlxWb0",
    },
    {
      name: "Rotacion tronco",
      tags: ["movilidad", "warmup"],
      videoUrl: "https://youtu.be/PbibrM21A5Y?t=394",
    },
    {
      name: "Estiramiento psoas dinamico",
      tags: ["movilidad", "warmup"],
      videoUrl: "https://youtu.be/NrGKox43q9Y?t=111",
    },
    {
      name: "Flexión de tobillo dinámico desde altura",
      tags: ["movilidad", "warmup"],
      videoUrl: "https://youtu.be/y34-lmVu9h4?t=90",
    },
    {
      name: "Apertura de pecho contra pared o cajón",
      tags: ["movilidad", "warmup"],
      videoUrl: "https://youtu.be/vGDRKIMoBVk?t=222",
    },
    {
      name: "Parabrisas con piernas",
      tags: ["movilidad", "warmup"],
      videoUrl: "https://youtu.be/cxm4pEa4CxI?t=217",
    },
    {
      name: "Dorsiflexión con banda",
      tags: ["movilidad", "warmup"],
      videoUrl: "https://youtu.be/U1jT82VwURg?si=6IMlCrFY2PQ-YFwH&t=330",
    },
    {
      name: "Peso muerto a 1 pierna c/ peso",
      tags: ["fuerza", "piernas", "unilateral"],
      videoUrl: "https://youtu.be/WRmlDXgHT30?si=1WrHC-Zl-3bJBjDV&t=3",
    },
    {
      name: "Remo a un brazo",
      tags: ["fuerza", "espalda", "unilateral"],
      videoUrl:
        "https://www.tiktok.com/@arielcouceirogo0/video/7141456062862855430",
    },
    {
      name: "Hiperextensiones",
      tags: ["fuerza", "espalda baja"],
      videoUrl: "https://www.youtube.com/shorts/cffBuDsjxU8",
    },
    {
      name: "Revolver la olla c/ pelota",
      tags: ["core"],
      videoUrl: "https://www.youtube.com/watch?v=nrtepyadQyY",
    },
  ];

  for (const { name, tags, videoUrl } of exercises) {
    const exercise = await prisma.exercise.create({
      data: { name, tags, videoUrl },
    });
    exerciseMap.set(name, exercise);
  }

  console.log("✅ Created exercises");

  // Types for seed data structure
  type SetData = {
    weightKg?: number | null;
    reps?: number | null;
    durationSeconds?: number | null;
    repsPerSide?: boolean;
  };

  type ExerciseData = {
    name: string;
    sets: SetData[];
    comment?: string | null;
    variants?: string[];
  };

  type BlockData = {
    label: string;
    comment?: string | null;
    exercises: ExerciseData[];
  };

  type WorkoutDayData = {
    dayIndex: number;
    weekNumber: number;
    weekStartDate: Date;
    notes?: string | null;
    blocks: BlockData[];
  };

  // Helper function to create a complete workout day for a specific athlete
  async function createWorkoutDay(
    data: WorkoutDayData,
    athleteId: string,
    trainerId: string
  ) {
    const workoutDay = await prisma.workoutDay.create({
      data: {
        trainerId,
        athleteId,
        weekNumber: data.weekNumber,
        weekStartDate: data.weekStartDate,
        dayIndex: data.dayIndex,
        label: `Día ${data.dayIndex}`,
        notes: data.notes,
      },
    });

    for (const [blockIndex, blockData] of data.blocks.entries()) {
      const block = await prisma.workoutBlock.create({
        data: {
          workoutDayId: workoutDay.id,
          order: blockIndex,
          label: blockData.label,
          comment: blockData.comment,
        },
      });

      for (const [
        exerciseIndex,
        exerciseData,
      ] of blockData.exercises.entries()) {
        const exercise = exerciseMap.get(exerciseData.name);
        if (!exercise) {
          console.warn(`⚠️  Exercise "${exerciseData.name}" not found`);
          continue;
        }

        const workoutBlockExercise = await prisma.workoutBlockExercise.create({
          data: {
            workoutBlockId: block.id,
            exerciseId: exercise.id,
            order: exerciseIndex + 1,
            comment: exerciseData.comment,
            variants: exerciseData.variants || [],
          },
        });

        for (const [setIndex, setData] of exerciseData.sets.entries()) {
          await prisma.set.create({
            data: {
              workoutBlockExerciseId: workoutBlockExercise.id,
              setIndex: setIndex + 1,
              reps: setData.reps,
              weightKg: setData.weightKg,
              durationSeconds: setData.durationSeconds,
              repsPerSide: setData.repsPerSide ?? false,
            },
          });
        }
      }
    }

    return workoutDay;
  }

  // ============================================
  // WORKOUT DATA - will be created for all athletes
  // ============================================

  const workoutDays: WorkoutDayData[] = [
    // ============================================
    // SEMANA 3 (starts 2025-01-19)
    // ============================================

    // Día 1, Semana 3
    {
      dayIndex: 1,
      weekNumber: 3,
      weekStartDate: new Date("2025-01-19"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment:
            "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
          exercises: [
            {
              name: "Saltos al cajón 70cm",
              sets: [{ reps: 3 }, { reps: 3 }, { reps: 3 }],
              comment: null,
            },
            {
              name: "Slam ball",
              sets: [{ reps: 4 }, { reps: 4 }, { reps: 4 }],
              comment: "Pelota de 5kg crossfit",
            },
          ],
        },
        {
          label: "B",
          comment: null,
          exercises: [
            {
              name: "Peso muerto trap bar",
              sets: [
                { weightKg: 60, reps: 5 },
                { weightKg: 85, reps: 4 },
                { weightKg: 100, reps: 2 },
                { weightKg: 100, reps: 2 },
                { weightKg: 100, reps: 2 },
              ],
              comment:
                "Activar dorsales y NO BALANCEAR LA TRAP, subo y bajo en bloque (no tengo que desarmarme)",
            },
            {
              name: "Sentadilla bulgara",
              sets: [
                { weightKg: 15, reps: 6, repsPerSide: true },
                { weightKg: 25, reps: 5, repsPerSide: true },
                { weightKg: 35, reps: 4, repsPerSide: true },
                { weightKg: 35, reps: 4, repsPerSide: true },
                { weightKg: 35, reps: 4, repsPerSide: true },
              ],
              comment:
                "Reps por lado y peso total (SI NO HAY MANCUERNAS HACELO CON BARRA)",
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Curl nórdico sin materiales",
              sets: [{ reps: 10 }, { reps: 8 }, { reps: 8 }],
              comment: "Frenar la caída sin quebrar lumbar",
            },
            {
              name: "Pallof",
              sets: [
                { reps: 8, repsPerSide: true },
                { reps: 8, repsPerSide: true },
                { reps: 6, repsPerSide: true },
              ],
              comment: null,
            },
          ],
        },
      ],
    },

    // Día 2, Semana 3
    {
      dayIndex: 2,
      weekNumber: 3,
      weekStartDate: new Date("2025-01-19"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment: null,
          exercises: [
            {
              name: "Sentadilla con barra",
              sets: [
                { weightKg: 40, reps: 5 },
                { weightKg: 50, reps: 4 },
                { weightKg: 60, reps: 3 },
                { weightKg: 60, reps: 3 },
                { weightKg: 60, reps: 3 },
              ],
              comment:
                "Kg sumando barra. Bajo en 2-3 seg, me quedo 1 seg y subo. NO HAGO REBOTE. APRETO GLÚTEO ARRIBA",
              variants: ["tempo_3_1_0"],
            },
            {
              name: "Press inclinado a un brazo",
              sets: [
                { weightKg: 10, reps: 6 },
                { weightKg: 15, reps: 5 },
                { weightKg: 20, reps: 4 },
                { weightKg: 20, reps: 4 },
                { weightKg: 20, reps: 3 },
              ],
              comment: "Acordate del leg drive (pies atrás de las rodillas)",
            },
          ],
        },
        {
          label: "B",
          comment:
            "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
          exercises: [
            {
              name: "Salto vertical sin contramovimiento",
              sets: [{ reps: 4 }, { reps: 4 }, { reps: 4 }],
              comment: null,
            },
            {
              name: "Desplazamiento lateral explosivo",
              sets: [
                { reps: 4, repsPerSide: true },
                { reps: 4, repsPerSide: true },
                { reps: 4, repsPerSide: true },
              ],
              comment: null,
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Hip Thrust",
              sets: [
                { weightKg: 100, reps: 6 },
                { weightKg: 100, reps: 6 },
                { weightKg: 100, reps: 6 },
              ],
              comment: "Kg sumando barra",
            },
            {
              name: "Remo a un brazo",
              sets: [
                { weightKg: 25, reps: 6, repsPerSide: true },
                { weightKg: 25, reps: 6, repsPerSide: true },
                { weightKg: 25, reps: 6, repsPerSide: true },
              ],
              comment: "Llevar la mancuerna hacia la cadera",
            },
            {
              name: "Dead bug con disco brazos",
              sets: [
                { weightKg: 10, reps: 8 },
                { weightKg: 10, reps: 6 },
                { weightKg: 10, reps: 6 },
              ],
              comment:
                "Con disco de 5kg en las tibias y otro sosteniendo con los brazos, alejo los discos extendiendo piernas y brazos. Columna NEUTRA (a penas retracción pélvica). Extiendo y vuelvo",
            },
          ],
        },
      ],
    },

    // Día 3, Semana 3
    {
      dayIndex: 3,
      weekNumber: 3,
      weekStartDate: new Date("2025-01-19"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment: null,
          exercises: [
            {
              name: "Cosaco squat",
              sets: [
                { weightKg: 15, reps: 8, repsPerSide: true },
                { weightKg: 15, reps: 8, repsPerSide: true },
                { weightKg: 15, reps: 6, repsPerSide: true },
              ],
              comment: "Uso una sola mancuerna",
            },
            {
              name: "Dominada",
              sets: [
                { weightKg: 0, reps: 5 },
                { weightKg: 5, reps: 4 },
                { weightKg: 12.2, reps: 4 },
                { weightKg: 12.2, reps: 4 },
                { weightKg: 12.2, reps: 4 },
              ],
              comment: "Subir explosivo, bajar en 2 o 3 seg",
            },
          ],
        },
        {
          label: "B",
          comment: null,
          exercises: [
            {
              name: "Peso muerto a 1 pierna c/ peso",
              sets: [
                { weightKg: 15, reps: 6, repsPerSide: true },
                { weightKg: 15, reps: 6, repsPerSide: true },
                { weightKg: 15, reps: 6, repsPerSide: true },
              ],
              comment: null,
            },
            {
              name: "Press mancuerna banco plano",
              sets: [
                { weightKg: 17.5, reps: 4 },
                { weightKg: 17.5, reps: 4 },
                { weightKg: 17.5, reps: 4 },
              ],
              comment: null,
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Hiperextensiones",
              sets: [
                { weightKg: 15, reps: 10 },
                { weightKg: 15, reps: 8 },
                { weightKg: 15, reps: 8 },
              ],
              comment: "Redondeando espalda",
            },
            {
              name: "Revolver la olla c/ pelota",
              sets: [
                { durationSeconds: 40 },
                { durationSeconds: 40 },
                { durationSeconds: 40 },
              ],
              comment: null,
            },
          ],
        },
      ],
    },

    // ============================================
    // SEMANA 4 (starts 2025-01-26)
    // ============================================

    // Día 1, Semana 4
    {
      dayIndex: 1,
      weekNumber: 4,
      weekStartDate: new Date("2025-01-26"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment:
            "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
          exercises: [
            {
              name: "Saltos al cajón 70cm",
              sets: [{ reps: 3 }, { reps: 3 }, { reps: 3 }],
              comment: null,
            },
            {
              name: "Slam ball",
              sets: [{ reps: 4 }, { reps: 4 }, { reps: 4 }],
              comment: "Pelota de 5kg crossfit",
            },
          ],
        },
        {
          label: "B",
          comment: null,
          exercises: [
            {
              name: "Peso muerto trap bar",
              sets: [
                { weightKg: 60, reps: 5 },
                { weightKg: 85, reps: 4 },
                { weightKg: 100, reps: 3 },
                { weightKg: 100, reps: 2 },
                { weightKg: 100, reps: 2 },
              ],
              comment:
                "Activar dorsales y NO BALANCEAR LA TRAP, subo y bajo en bloque (no tengo que desarmarme)",
            },
            {
              name: "Sentadilla bulgara",
              sets: [
                { weightKg: 15, reps: 6, repsPerSide: true },
                { weightKg: 25, reps: 5, repsPerSide: true },
                { weightKg: 35, reps: 6, repsPerSide: true },
                { weightKg: 35, reps: 4, repsPerSide: true },
                { weightKg: 35, reps: 4, repsPerSide: true },
              ],
              comment:
                "Reps por lado y peso total (SI NO HAY MANCUERNAS HACELO CON BARRA)",
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Curl nórdico sin materiales",
              sets: [{ reps: 10 }, { reps: 10 }, { reps: 8 }],
              comment: "Frenar la caída sin quebrar lumbar",
            },
            {
              name: "Pallof",
              sets: [
                { reps: 8, repsPerSide: true },
                { reps: 8, repsPerSide: true },
                { reps: 8, repsPerSide: true },
              ],
              comment: null,
            },
          ],
        },
      ],
    },

    // Día 2, Semana 4
    {
      dayIndex: 2,
      weekNumber: 4,
      weekStartDate: new Date("2025-01-26"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment: null,
          exercises: [
            {
              name: "Sentadilla con barra",
              sets: [
                { weightKg: 40, reps: 5 },
                { weightKg: 50, reps: 4 },
                { weightKg: 65, reps: 1 },
                { weightKg: 65, reps: 1 },
                { weightKg: 65, reps: 1 },
              ],
              comment:
                "Kg sumando barra. Bajo en 2-3 seg, me quedo 1 seg y subo. NO HAGO REBOTE. APRETO GLÚTEO ARRIBA",
              variants: ["tempo_3_1_0"],
            },
            {
              name: "Press inclinado a un brazo",
              sets: [
                { weightKg: 10, reps: 6 },
                { weightKg: 15, reps: 5 },
                { weightKg: 20, reps: 4 },
                { weightKg: 20, reps: 4 },
                { weightKg: 20, reps: 4 },
              ],
              comment: "Acordate del leg drive (pies atrás de las rodillas)",
            },
          ],
        },
        {
          label: "B",
          comment:
            "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
          exercises: [
            {
              name: "Salto vertical sin contramovimiento",
              sets: [{ reps: 4 }, { reps: 4 }, { reps: 4 }],
              comment: null,
            },
            {
              name: "Desplazamiento lateral explosivo",
              sets: [
                { reps: 4, repsPerSide: true },
                { reps: 4, repsPerSide: true },
                { reps: 4, repsPerSide: true },
              ],
              comment: null,
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Hip Thrust",
              sets: [
                { weightKg: 100, reps: 8 },
                { weightKg: 100, reps: 6 },
                { weightKg: 100, reps: 6 },
              ],
              comment: "Kg sumando barra",
            },
            {
              name: "Remo a un brazo",
              sets: [
                { weightKg: 25, reps: 8, repsPerSide: true },
                { weightKg: 25, reps: 6, repsPerSide: true },
                { weightKg: 25, reps: 6, repsPerSide: true },
              ],
              comment: "Llevar la mancuerna hacia la cadera",
            },
            {
              name: "Dead bug con disco brazos",
              sets: [
                { weightKg: 10, reps: 8 },
                { weightKg: 10, reps: 8 },
                { weightKg: 10, reps: 6 },
              ],
              comment:
                "Con disco de 5kg en las tibias y otro sosteniendo con los brazos, alejo los discos extendiendo piernas y brazos. Columna NEUTRA (a penas retracción pélvica). Extiendo y vuelvo",
            },
          ],
        },
      ],
    },

    // Día 3, Semana 4
    {
      dayIndex: 3,
      weekNumber: 4,
      weekStartDate: new Date("2025-01-26"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment: null,
          exercises: [
            {
              name: "Cosaco squat",
              sets: [
                { weightKg: 15, reps: 8, repsPerSide: true },
                { weightKg: 15, reps: 8, repsPerSide: true },
                { weightKg: 15, reps: 6, repsPerSide: true },
              ],
              comment: "Uso una sola mancuerna",
            },
            {
              name: "Dominada",
              sets: [
                { weightKg: 0, reps: 5 },
                { weightKg: 5, reps: 4 },
                { weightKg: 12.2, reps: 4 },
                { weightKg: 12.2, reps: 4 },
                { weightKg: 12.2, reps: 4 },
              ],
              comment: "Subir explosivo, bajar en 2 o 3 seg",
            },
          ],
        },
        {
          label: "B",
          comment: null,
          exercises: [
            {
              name: "Peso muerto a 1 pierna c/ peso",
              sets: [
                { weightKg: 15, reps: 6, repsPerSide: true },
                { weightKg: 15, reps: 6, repsPerSide: true },
                { weightKg: 15, reps: 6, repsPerSide: true },
              ],
              comment: null,
            },
            {
              name: "Press mancuerna banco plano",
              sets: [
                { weightKg: 17.5, reps: 4 },
                { weightKg: 17.5, reps: 4 },
                { weightKg: 17.5, reps: 4 },
              ],
              comment: null,
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Hiperextensiones",
              sets: [
                { weightKg: 15, reps: 10 },
                { weightKg: 15, reps: 8 },
                { weightKg: 15, reps: 8 },
              ],
              comment: "Redondeando espalda",
            },
            {
              name: "Revolver la olla c/ pelota",
              sets: [
                { durationSeconds: 40 },
                { durationSeconds: 40 },
                { durationSeconds: 40 },
              ],
              comment: null,
            },
          ],
        },
      ],
    },

    // ============================================
    // SEMANA 5 (starts 2025-02-02)
    // ============================================

    // Día 1, Semana 5
    {
      dayIndex: 1,
      weekNumber: 5,
      weekStartDate: new Date("2025-02-02"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment:
            "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
          exercises: [
            {
              name: "Saltos al cajón 70cm",
              sets: [{ reps: 4 }, { reps: 4 }, { reps: 4 }],
              comment: null,
            },
            {
              name: "Slam ball",
              sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }],
              comment: "Pelota de 5kg crossfit",
            },
          ],
        },
        {
          label: "B",
          comment: null,
          exercises: [
            {
              name: "Peso muerto trap bar",
              sets: [
                { weightKg: 60, reps: 5 },
                { weightKg: 85, reps: 4 },
                { weightKg: 100, reps: 3 },
                { weightKg: 100, reps: 3 },
                { weightKg: 100, reps: 2 },
              ],
              comment:
                "Activar dorsales y NO BALANCEAR LA TRAP, subo y bajo en bloque (no tengo que desarmarme)",
            },
            {
              name: "Sentadilla bulgara",
              sets: [
                { weightKg: 15, reps: 6, repsPerSide: true },
                { weightKg: 25, reps: 5, repsPerSide: true },
                { weightKg: 35, reps: 6, repsPerSide: true },
                { weightKg: 35, reps: 6, repsPerSide: true },
                { weightKg: 35, reps: 4, repsPerSide: true },
              ],
              comment:
                "Reps por lado y peso total (SI NO HAY MANCUERNAS HACELO CON BARRA)",
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Curl nórdico sin materiales",
              sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }],
              comment: "Frenar la caída sin quebrar lumbar",
            },
            {
              name: "Pallof",
              sets: [
                { reps: 10, repsPerSide: true },
                { reps: 8, repsPerSide: true },
                { reps: 8, repsPerSide: true },
              ],
              comment: null,
            },
          ],
        },
      ],
    },

    // Día 2, Semana 5
    {
      dayIndex: 2,
      weekNumber: 5,
      weekStartDate: new Date("2025-02-02"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment: null,
          exercises: [
            {
              name: "Sentadilla con barra",
              sets: [
                { weightKg: 40, reps: 5 },
                { weightKg: 50, reps: 4 },
                { weightKg: 65, reps: 2 },
                { weightKg: 65, reps: 2 },
                { weightKg: 65, reps: 2 },
              ],
              comment:
                "Kg sumando barra. Bajo en 2-3 seg, me quedo 1 seg y subo. NO HAGO REBOTE. APRETO GLÚTEO ARRIBA",
              variants: ["tempo_3_1_0"],
            },
            {
              name: "Press inclinado a un brazo",
              sets: [
                { weightKg: 10, reps: 6 },
                { weightKg: 15, reps: 5 },
                { weightKg: 20, reps: 6 },
                { weightKg: 20, reps: 4 },
                { weightKg: 20, reps: 4 },
              ],
              comment: "Acordate del leg drive (pies atrás de las rodillas)",
            },
          ],
        },
        {
          label: "B",
          comment:
            "Bloque pliométrico: Descanso entre serie de 30 seg a 1 min según lo requiera (tenes que estar súper fresco en cada serie)",
          exercises: [
            {
              name: "Salto vertical sin contramovimiento",
              sets: [{ reps: 4 }, { reps: 4 }, { reps: 4 }],
              comment: null,
            },
            {
              name: "Desplazamiento lateral explosivo",
              sets: [
                { reps: 4, repsPerSide: true },
                { reps: 4, repsPerSide: true },
                { reps: 4, repsPerSide: true },
              ],
              comment: null,
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Hip Thrust",
              sets: [
                { weightKg: 100, reps: 8 },
                { weightKg: 100, reps: 8 },
                { weightKg: 100, reps: 6 },
              ],
              comment: "Kg sumando barra",
            },
            {
              name: "Remo a un brazo",
              sets: [
                { weightKg: 25, reps: 8, repsPerSide: true },
                { weightKg: 25, reps: 8, repsPerSide: true },
                { weightKg: 25, reps: 6, repsPerSide: true },
              ],
              comment: "Llevar la mancuerna hacia la cadera",
            },
            {
              name: "Dead bug con disco brazos",
              sets: [
                { weightKg: 10, reps: 8 },
                { weightKg: 10, reps: 8 },
                { weightKg: 10, reps: 8 },
              ],
              comment:
                "Con disco de 5kg en las tibias y otro sosteniendo con los brazos, alejo los discos extendiendo piernas y brazos. Columna NEUTRA (a penas retracción pélvica). Extiendo y vuelvo",
            },
          ],
        },
      ],
    },

    // Día 3, Semana 5
    {
      dayIndex: 3,
      weekNumber: 5,
      weekStartDate: new Date("2025-02-02"),
      notes: "Entrada en calor: Movilidad A o B",
      blocks: [
        {
          label: "A",
          comment: null,
          exercises: [
            {
              name: "Cosaco squat",
              sets: [
                { weightKg: 15, reps: 8, repsPerSide: true },
                { weightKg: 15, reps: 8, repsPerSide: true },
                { weightKg: 15, reps: 8, repsPerSide: true },
              ],
              comment: "Uso una sola mancuerna",
            },
            {
              name: "Dominada",
              sets: [
                { weightKg: 0, reps: 5 },
                { weightKg: 5, reps: 4 },
                { weightKg: 12.2, reps: 5 },
                { weightKg: 12.2, reps: 4 },
                { weightKg: 12.2, reps: 4 },
              ],
              comment: "Subir explosivo, bajar en 2 o 3 seg",
            },
          ],
        },
        {
          label: "B",
          comment: null,
          exercises: [
            {
              name: "Peso muerto a 1 pierna c/ peso",
              sets: [
                { weightKg: 15, reps: 8, repsPerSide: true },
                { weightKg: 15, reps: 6, repsPerSide: true },
                { weightKg: 15, reps: 6, repsPerSide: true },
              ],
              comment: null,
            },
            {
              name: "Press mancuerna banco plano",
              sets: [
                { weightKg: 17.5, reps: 6 },
                { weightKg: 17.5, reps: 4 },
                { weightKg: 17.5, reps: 4 },
              ],
              comment: null,
            },
          ],
        },
        {
          label: "C",
          comment: null,
          exercises: [
            {
              name: "Hiperextensiones",
              sets: [
                { weightKg: 15, reps: 10 },
                { weightKg: 15, reps: 10 },
                { weightKg: 15, reps: 8 },
              ],
              comment: "Redondeando espalda",
            },
            {
              name: "Revolver la olla c/ pelota",
              sets: [
                { durationSeconds: 50 },
                { durationSeconds: 50 },
                { durationSeconds: 50 },
              ],
              comment: null,
            },
          ],
        },
      ],
    },
  ];

  // Create workout days for all athletes
  for (const athlete of athletes) {
    for (const workoutDayData of workoutDays) {
      await createWorkoutDay(workoutDayData, athlete.id, trainer.id);
    }
    console.log(`✅ Created workouts for ${athlete.name}`);
  }

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
