"use client";

import { useRouter } from "next/navigation";
import WeekTable from "@/components/trainer/WeekTable";
import type { AthleteWeekData } from "@/lib/trainer/getAthleteWeek";

type AthleteWeekClientProps = {
  weekData: AthleteWeekData;
  weekNumber: number;
};

export default function AthleteWeekClient({
  weekData,
  weekNumber,
}: AthleteWeekClientProps) {
  const router = useRouter();

  const handleDayClick = (dayIndex: number) => {
    router.push(`/${weekNumber}/${dayIndex}`);
  };

  return (
    <WeekTable data={weekData} mode="readonly" onDayClick={handleDayClick} />
  );
}
