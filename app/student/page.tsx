"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  formatDiaryDate,
  getTodayDiaryDate,
  isFutureDiaryDate,
} from "@/lib/diary-date";

export default function StudentPage() {
  const conditionOptions = [
    {
      value: "5",
      label: "5（非常に良好）",
    },
    {
      value: "4",
      label: "4（良好）",
    },
    {
      value: "3",
      label: "3（普通）",
    },
    {
      value: "2",
      label: "2（やや低い）",
    },
    {
      value: "1",
      label: "1（低い）",
    },
  ];

  const getConditionLabel = (
    value: string
  ) => {
    const score = value?.split("：")[0];

    return (
      conditionOptions.find(
        (option) =>
          option.value === score
      )?.label ?? value
    );
  };

  const [user, setUser] =
    useState<any>(null);

  const [health, setHealth] =
    useState("3");

  const [mental, setMental] =
    useState("3");

  const [comment, setComment] =
    useState("");

  const [targetDate, setTargetDate] =
    useState(getTodayDiaryDate());

  const [submitted, setSubmitted] =
    useState(false);

  const [submittedDiary, setSubmittedDiary] =
    useState<any>(null);

  const [diaryHistory, setDiaryHistory] =
    useState<any[]>([]);

  const formatDate = (value: string) => {
    const date = new Date(value);

    return formatDiaryDate(date);
  };

  const getClassRoomName = (
    classRoom: any
  ) => {
    if (!classRoom) {
      return "";
    }

    if (
      classRoom.grade !== null &&
      classRoom.grade !== undefined &&
      classRoom.class
    ) {
      return `${classRoom.grade}-${classRoom.class}`;
    }

    return classRoom.name ?? "";
  };

  const getDiaryClassRoomName = (
    diary: any
  ) =>
    getClassRoomName(
      diary?.classRoom
    ) ||
    getClassRoomName(
      diary?.student?.classRoom
    ) ||
    "未設定";

  const fetchDiaryHistory =
    async (studentId: number) => {
      const res = await fetch(
        `/api/diary?studentId=${studentId}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        setDiaryHistory([]);

        if (
          res.status === 401 ||
          res.status === 403
        ) {
          localStorage.removeItem("user");
          location.href = "/";
        }

        return;
      }

      if (!Array.isArray(data)) {
        setDiaryHistory([]);
        return;
      }

      setDiaryHistory(data);
    };

  const checkSubmitted =
    async (
      studentId: number,
      date: string
    ) => {
      const res = await fetch(
        `/api/diary?studentId=${studentId}&date=${date}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        setSubmitted(false);
        setSubmittedDiary(null);

        if (
          res.status === 401 ||
          res.status === 403
        ) {
          localStorage.removeItem("user");
          location.href = "/";
        }

        return;
      }

      if (!Array.isArray(data)) {
        setSubmitted(false);
        setSubmittedDiary(null);
        return;
      }

      setSubmitted(data.length > 0);
      setSubmittedDiary(data[0] ?? null);
    };

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "user"
      );

    if (!saved) {
      location.href = "/";
      return;
    }

    const parsed =
      JSON.parse(saved);

    if (
      parsed.role !==
      "STUDENT"
    ) {
      location.href = "/";
      return;
    }

    setUser(parsed);

    checkSubmitted(
      parsed.id,
      targetDate
    );

    fetchDiaryHistory(parsed.id);
  }, []);

  const changeTargetDate = (
    value: string
  ) => {
    setTargetDate(value);
    setHealth("3");
    setMental("3");
    setComment("");
    setSubmitted(false);
    setSubmittedDiary(null);

    if (isFutureDiaryDate(value)) {
      alert(
        "未来の日付の日報は作成できません"
      );
      return;
    }

    if (user) {
      checkSubmitted(user.id, value);
    }
  };

  const showHistoryDiary = (
    diary: any
  ) => {
    const diaryDate = formatDate(
      diary.targetDate
    );

    setTargetDate(diaryDate);
    setSubmitted(true);
    setSubmittedDiary(diary);
  };

  const submit = async () => {
    if (!user) return;

    if (submitted) return;

    if (isFutureDiaryDate(targetDate)) {
      alert(
        "未来の日付の日報は作成できません"
      );
      return;
    }

    const res = await fetch("/api/diary", {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        studentId: user.id,

        targetDate,

        physicalCondition: health,

        mentalCondition: mental,

        comment,
      }),
    });

    if (!res.ok) {
      const data =
        await res.json();

      alert(data.error);

      if (res.status === 409) {
        setSubmitted(true);
      }

      return;
    }

    const diary =
      await res.json();

    setSubmitted(true);
    setSubmittedDiary(diary);

    await fetchDiaryHistory(user.id);

    alert("提出しました");
  };

  const logout = async () => {
    await fetch("/api/logout", {
      method: "POST",
    });

    localStorage.removeItem("user");
    location.href = "/";
  };

  return (
    <div>
      <div className="page-header">
        <h1>生徒画面</h1>

        <div className="page-actions">
          <div className="account-summary">
            <span className="account-name">
              ログイン中: {user?.name}
            </span>

            <span className="account-meta">
              所属クラス:{" "}
              {user?.classRoom?.name ??
                user?.classRoomId ??
                "未設定"}
            </span>
          </div>

          <button
            className="secondary-button"
            onClick={logout}
          >
            ログアウト
          </button>
        </div>
      </div>

      <div className="detail-panel">
        <h2>
          {targetDate} の振り返り
        </h2>

        <div className="form-row">
          <p>日付</p>

          <input
            type="date"
            value={targetDate}
            max={getTodayDiaryDate()}
            onChange={(e) =>
              changeTargetDate(
                e.target.value
              )
            }
          />
        </div>

        {submitted &&
        submittedDiary ? (
          <div>
            <p>
              状態:{" "}
              <span className="status-badge">
                提出済み
              </span>
            </p>

            <p>
              作成時クラス:
              {getDiaryClassRoomName(
                submittedDiary
              )}
            </p>

            <p>
              体調:
              {
                getConditionLabel(
                  submittedDiary.physicalCondition
                )
              }
            </p>

            <p>
              メンタル:
              {
                getConditionLabel(
                  submittedDiary.mentalCondition
                )
              }
            </p>

            <p>
              コメント:
              {submittedDiary.comment}
            </p>
          </div>
        ) : (
          <>
            <div>
              <p>体調</p>

              <select
                value={health}
                onChange={(e) =>
                  setHealth(
                    e.target.value
                  )
                }
              >
                {conditionOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <p>メンタル</p>

              <select
                value={mental}
                onChange={(e) =>
                  setMental(
                    e.target.value
                  )
                }
              >
                {conditionOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="reflection-field">
              <p>
                今日の振り返り
              </p>

              <textarea
                value={comment}
                onChange={(e) =>
                  setComment(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              onClick={submit}
              disabled={!user}
            >
              提出
            </button>
          </>
        )}
      </div>

      <h2>過去の記録</h2>

      {diaryHistory.length === 0 && (
        <p>
          記録はまだありません
        </p>
      )}

      {diaryHistory.length > 0 && (
        <table border={1}>
          <thead>
            <tr>
              <th>日付</th>
              <th>作成時クラス</th>
              <th>体調</th>
              <th>メンタル</th>
              <th>コメント</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>

          <tbody>
            {diaryHistory.map((diary) => {
              const diaryDate =
                formatDate(
                  diary.targetDate
                );

              return (
                <tr
                  key={diary.id}
                  className={
                    diaryDate === targetDate
                      ? "active-row"
                      : ""
                  }
                >
                  <td>{diaryDate}</td>

                  <td>
                    {getDiaryClassRoomName(
                      diary
                    )}
                  </td>

                  <td>
                    {
                      getConditionLabel(
                        diary.physicalCondition
                      )
                    }
                  </td>

                  <td>
                    {
                      getConditionLabel(
                        diary.mentalCondition
                      )
                    }
                  </td>

                  <td>{diary.comment}</td>

                  <td>
                    {diary.readAt
                      ? "既読"
                      : "未読"}
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        showHistoryDiary(diary)
                      }
                    >
                      表示
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
