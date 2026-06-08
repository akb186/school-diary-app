"use client";

import {
  useEffect,
  useState,
} from "react";

export default function TeacherPage() {
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

  const [diaries, setDiaries] =
    useState<any[]>([]);

  const [dateFilter, setDateFilter] =
    useState("today");

  const [diarySearch, setDiarySearch] =
    useState("");

  const [
    readStateFilter,
    setReadStateFilter,
  ] = useState("unread");

  const [diarySortKey, setDiarySortKey] =
    useState("targetDate");

  const [
    diarySortOrder,
    setDiarySortOrder,
  ] = useState<"asc" | "desc">(
    "desc"
  );

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

  const getConditionScore = (
    value: string
  ) => Number(value?.split("：")[0]) || 0;

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

  const sortDiaries = (key: string) => {
    if (diarySortKey === key) {
      setDiarySortOrder(
        diarySortOrder === "asc"
          ? "desc"
          : "asc"
      );
      return;
    }

    setDiarySortKey(key);
    setDiarySortOrder(
      key === "targetDate"
        ? "desc"
        : "asc"
    );
  };

  const getDiarySortLabel = (
    key: string
  ) => {
    if (diarySortKey !== key) {
      return "↕";
    }

    return diarySortOrder === "asc"
      ? "↑"
      : "↓";
  };

  const getDiarySortValue = (
    diary: any,
    key: string
  ) => {
    if (key === "targetDate") {
      return new Date(
        diary.targetDate
      ).getTime();
    }

    if (key === "student") {
      return diary.student?.name ?? "";
    }

    if (key === "physicalCondition") {
      return getConditionScore(
        diary.physicalCondition
      );
    }

    if (key === "mentalCondition") {
      return getConditionScore(
        diary.mentalCondition
      );
    }

    return "";
  };

  const filteredDiaries =
    diaries.filter((diary) => {
      const keyword =
        diarySearch
          .trim()
          .toLowerCase();
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

      const matchesKeyword =
        !keyword ||
        [
          formatDate(diary.targetDate),
          diary.student?.name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesReadState =
        !readStateFilter ||
        (readStateFilter === "unread" &&
          !diary.readAt) ||
        (readStateFilter === "read" &&
          diary.readAt);

      return (
        matchesKeyword &&
        matchesDate &&
        matchesReadState
      );
    });

  const sortedDiaries = [
    ...filteredDiaries,
  ].sort((a, b) => {
    const aValue = getDiarySortValue(
      a,
      diarySortKey
    );
    const bValue = getDiarySortValue(
      b,
      diarySortKey
    );

    if (
      typeof aValue === "number" &&
      typeof bValue === "number"
    ) {
      return diarySortOrder === "asc"
        ? aValue - bValue
        : bValue - aValue;
    }

    const result = String(
      aValue
    ).localeCompare(
      String(bValue),
      "ja"
    );

    return diarySortOrder === "asc"
      ? result
      : -result;
  });

  const selectedDiary =
    sortedDiaries.find(
      (diary) =>
        diary.id === selectedDiaryId
    ) ?? sortedDiaries[0];

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
        <h1>先生画面</h1>

        <div className="page-actions">
          <div className="account-summary">
            <span className="account-name">
              ログイン中: {user?.name}
            </span>

            <span className="account-meta">
              所属クラス:{" "}
              {user?.classRoom?.name ??
                user?.classRoomId}
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

      <h2>
        提出一覧
      </h2>

      <div className="filter-row">
        <input
          placeholder="日付・生徒で検索"
          value={diarySearch}
          onChange={(e) =>
            setDiarySearch(e.target.value)
          }
        />

        <select
          value={dateFilter}
          onChange={(e) =>
            setDateFilter(e.target.value)
          }
        >
          <option value="today">
            今日
          </option>

          <option value="yesterday">
            昨日
          </option>

          <option value="all">
            日付すべて
          </option>
        </select>

        <select
          value={readStateFilter}
          onChange={(e) =>
            setReadStateFilter(
              e.target.value
            )
          }
        >
          <option value="">
            状態すべて
          </option>

          <option value="unread">
            未読
          </option>

          <option value="read">
            既読
          </option>
        </select>

        <button
          className="secondary-button"
          onClick={() => {
            setDiarySearch("");
            setDateFilter("today");
            setReadStateFilter("unread");
          }}
          disabled={
            !diarySearch &&
            dateFilter === "today" &&
            readStateFilter === "unread"
          }
        >
          クリア
        </button>
      </div>

      <p className="muted-text">
        表示件数: {filteredDiaries.length} /{" "}
        {diaries.length}
        （{getDateFilterLabel()}）
      </p>

      {sortedDiaries.length === 0 && (
        <p>
          提出された日報はありません
        </p>
      )}

      {sortedDiaries.length > 0 && (
        <div className="split-layout">
          <table border={1}>
            <thead>
              <tr>
                <th>
                  <button
                    className="sort-button"
                    onClick={() =>
                      sortDiaries(
                        "targetDate"
                      )
                    }
                  >
                    日付{" "}
                    {getDiarySortLabel(
                      "targetDate"
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-button"
                    onClick={() =>
                      sortDiaries("student")
                    }
                  >
                    生徒{" "}
                    {getDiarySortLabel(
                      "student"
                    )}
                  </button>
                </th>
                <th>作成時クラス</th>
                <th>
                  <button
                    className="sort-button"
                    onClick={() =>
                      sortDiaries(
                        "physicalCondition"
                      )
                    }
                  >
                    体調{" "}
                    {getDiarySortLabel(
                      "physicalCondition"
                    )}
                  </button>
                </th>
                <th>
                  <button
                    className="sort-button"
                    onClick={() =>
                      sortDiaries(
                        "mentalCondition"
                      )
                    }
                  >
                    メンタル{" "}
                    {getDiarySortLabel(
                      "mentalCondition"
                    )}
                  </button>
                </th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {sortedDiaries.map(
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

                    <td className="name-cell">
                      <span className="name-text">
                        {diary.student?.name}
                      </span>
                    </td>

                    <td>
                      {getDiaryClassRoomName(
                        diary
                      )}
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
                <span className="name-text">
                  {
                    selectedDiary.student
                      ?.name
                  }
                </span>
              </p>

              <p>
                作成時クラス:{" "}
                {getDiaryClassRoomName(
                  selectedDiary
                )}
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
