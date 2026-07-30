export const DIARY_TIME_ZONE =
  "Asia/Tokyo";

const DATE_ONLY_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})$/;

export const formatDiaryDate = (
  date: Date
) => {
  const parts =
    new Intl.DateTimeFormat("en-US", {
      timeZone: DIARY_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

  const getPart = (type: string) =>
    parts.find(
      (part) => part.type === type
    )?.value ?? "";

  return [
    getPart("year"),
    getPart("month"),
    getPart("day"),
  ].join("-");
};

export const getTodayDiaryDate = (
  now = new Date()
) => formatDiaryDate(now);

export const parseDiaryDate = (
  value: string
) => {
  const match =
    DATE_ONLY_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day)
    )
  );

  if (
    date.getUTCFullYear() !==
      Number(year) ||
    date.getUTCMonth() !==
      Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
};

export const isFutureDiaryDate = (
  value: string,
  now = new Date()
) =>
  DATE_ONLY_PATTERN.test(value) &&
  value > getTodayDiaryDate(now);

export const getDiaryDateRange = (
  value = getTodayDiaryDate()
) => {
  const start = parseDiaryDate(value);

  if (!start) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start,
    end,
  };
};
