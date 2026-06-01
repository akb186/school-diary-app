"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

export default function TeacherPage() {
  const conditionOptions = [
    {
      value: "5",
      label: "5：非常に良好",
    },
    {
      value: "4",
      label: "4：良好",
    },
    {
      value: "3",
      label: "3：普通",
    },
    {
      value: "2",
      label: "2：やや低い",
    },
    {
      value: "1",
      label: "1：低い",
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

  const [diaries, setDiaries] =
    useState<any[]>([]);

  const [dateFilter, setDateFilter] =
    useState("today");

  const [unreadOnly, setUnreadOnly] =
    useState(false);

  const [
    selectedDiaryId,
    setSelectedDiaryId,
  ] = useState<number | null>(null);

  const isSameDate = (
    value: string,
    baseDate: Date
  ) => {
    const date = new Date(value);

    return (
      date.getFullYear() ===
        baseDate.getFullYear() &&
      date.getMonth() ===
        baseDate.getMonth() &&
      date.getDate() ===
        baseDate.getDate()
    );
  };

  const filteredDiaries =
    diaries.filter((diary) => {
      const today = new Date();
      const yesterday = new Date(
        today
      );

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" &&
          isSameDate(
            diary.targetDate,
            today
          )) ||
        (dateFilter === "yesterday" &&
          isSameDate(
            diary.targetDate,
            yesterday
          ));

      const matchesReadState =
        !unreadOnly || !diary.readAt;

      return (
        matchesDate && matchesReadState
      );
    });

  const selectedDiary =
    filteredDiaries.find(
      (diary) =>
        diary.id === selectedDiaryId
    ) ?? filteredDiaries[0];

  const formatDate = (value: string) => {
    const date = new Date(value);

    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(date.getDate()).padStart(
        2,
        "0"
      ),
    ].join("-");
  };

  const getDateFilterLabel = () => {
    if (dateFilter === "today") {
      return "今日";
    }

    if (dateFilter === "yesterday") {
      return "昨日";
    }

    return "すべての日付";
  };

  const fetchDiaries =
    async (classRoomId: number) => {
      const res = await fetch(
        `/api/diary?classRoomId=${classRoomId}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        setDiaries([]);
        setSelectedDiaryId(null);

        alert(
          data.error ??
            "日報の取得に失敗しました"
        );

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
        setDiaries([]);
        setSelectedDiaryId(null);
        alert(
          "日報データの形式が正しくありません"
        );
        return;
      }

      setDiaries(data);
      setSelectedDiaryId(
        data[0]?.id ?? null
      );
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
      "TEACHER"
    ) {
      location.href = "/";
      return;
    }

    if (!parsed.classRoomId) {
      alert(
        "担当クラスが設定されていません"
      );
      location.href = "/";
      return;
    }

    setUser(parsed);

    fetchDiaries(
      parsed.classRoomId
    );
  }, []);

  const markAsRead =
    async (id: number) => {
      const res = await fetch(
        `/api/diary/${id}`,
        {
          method: "PATCH",
        }
      );

      if (!res.ok) {
        const data =
          await res.json();
        alert(data.error);
        return;
      }

      const updatedDiary =
        await res.json();

      setDiaries((current) =>
        current.map((diary) =>
          diary.id === id
            ? {
                ...diary,
                ...updatedDiary,
              }
            : diary
        )
      );
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
        <Link href="/">
          ← トップへ戻る
        </Link>

        <button
          className="secondary-button"
          onClick={logout}
        >
          ログアウト
        </button>
      </div>

      <h1>先生画面</h1>

      <div className="summary-row">
        <span>
          ログイン中: {user?.name}
        </span>

        <span>
          担当クラス:{" "}
          {user?.classRoom?.name ??
            user?.classRoomId}
        </span>
      </div>

      <h2>
        提出一覧
      </h2>

      <div className="toolbar">
        <button
          className={
            dateFilter === "today"
              ? ""
              : "secondary-button"
          }
          onClick={() =>
            setDateFilter("today")
          }
          disabled={
            dateFilter === "today"
          }
        >
          今日
        </button>

        <button
          className={
            dateFilter ===
            "yesterday"
              ? ""
              : "secondary-button"
          }
          onClick={() =>
            setDateFilter("yesterday")
          }
          disabled={
            dateFilter ===
            "yesterday"
          }
        >
          昨日
        </button>

        <button
          className={
            dateFilter === "all"
              ? ""
              : "secondary-button"
          }
          onClick={() =>
            setDateFilter("all")
          }
          disabled={
            dateFilter === "all"
          }
        >
          すべて
        </button>

        <label>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) =>
              setUnreadOnly(
                e.target.checked
              )
            }
          />
          未読のみ
        </label>
      </div>

      <p className="muted-text">
        {getDateFilterLabel()}の日報:
        {filteredDiaries.length}件
      </p>

      {filteredDiaries.length === 0 && (
        <p>
          提出された日報はありません
        </p>
      )}

      {filteredDiaries.length > 0 && (
        <div className="split-layout">
          <table border={1}>
            <thead>
              <tr>
                <th>日付</th>
                <th>生徒</th>
                <th>体調</th>
                <th>メンタル</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {filteredDiaries.map(
                (diary) => (
                  <tr
                    key={diary.id}
                    className={
                      diary.id ===
                      selectedDiary?.id
                        ? "active-row"
                        : ""
                    }
                  >
                    <td>
                      {formatDate(
                        diary.targetDate
                      )}
                    </td>

                    <td>
                      {diary.student?.name}
                    </td>

                    <td>
                      {getConditionLabel(
                        diary.physicalCondition
                      )}
                    </td>

                    <td>
                      {getConditionLabel(
                        diary.mentalCondition
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          diary.readAt
                            ? "status-badge"
                            : "status-badge unread"
                        }
                      >
                        {diary.readAt
                          ? "既読"
                          : "未読"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          setSelectedDiaryId(
                            diary.id
                          )
                        }
                      >
                        表示
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {selectedDiary && (
            <div className="detail-panel">
              <h3>
                {formatDate(
                  selectedDiary.targetDate
                )}
                の日報
              </h3>

              <p>
                生徒:{" "}
                {
                  selectedDiary.student
                    ?.name
                }
              </p>

              <p>
                体調:{" "}
                {getConditionLabel(
                  selectedDiary.physicalCondition
                )}
              </p>

              <p>
                メンタル:{" "}
                {getConditionLabel(
                  selectedDiary.mentalCondition
                )}
              </p>

              <p>
                コメント:
              </p>

              <p className="comment-box">
                {selectedDiary.comment ||
                  "未入力"}
              </p>

              <p>
                状態:{" "}
                {selectedDiary.readAt
                  ? "既読"
                  : "未読"}
              </p>

              {!selectedDiary.readAt && (
                <button
                  onClick={() =>
                    markAsRead(
                      selectedDiary.id
                    )
                  }
                >
                  既読にする
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
