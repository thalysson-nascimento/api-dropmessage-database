import { addDays, addHours, addMinutes } from "date-fns";

export type ExpirationTimer =
  | "addThirtyMin"
  | "addOneHour"
  | "addOneday"
  | "addOneWeek";

type ExpirationConfig = {
  add: (date: Date) => Date;
  seconds: number;
  amount: number;
  unit: "minute" | "hour" | "day";
};

export const expirationMap: Record<ExpirationTimer, ExpirationConfig> = {
  addThirtyMin: {
    add: (date) => addMinutes(date, 30),
    seconds: 30 * 60,
    amount: 30,
    unit: "minute",
  },
  addOneHour: {
    add: (date) => addHours(date, 1),
    seconds: 60 * 60,
    amount: 1,
    unit: "hour",
  },
  addOneday: {
    add: (date) => addDays(date, 1),
    seconds: 24 * 60 * 60,
    amount: 1,
    unit: "day",
  },
  addOneWeek: {
    add: (date) => addDays(date, 7),
    seconds: 7 * 24 * 60 * 60,
    amount: 7,
    unit: "day",
  },
};

export function buildExpirationData(
  expirationTimer: ExpirationTimer,
  baseDate: Date = new Date(),
) {
  const config = expirationMap[expirationTimer];

  if (!config) {
    throw new Error("Timer inválido");
  }

  const expirationDate = config.add(baseDate);

  return {
    expirationDate,
    expirationInSeconds: config.seconds,
    expirationAmount: config.amount,
    expirationUnit: config.unit,
  };
}
