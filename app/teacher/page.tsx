"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

export default function TeacherPage() {
  const [user, setUser] =
    useState<any>(null);

  const [diaries, setDiaries] =
    useState<any[]>([]);

  const fetchDiaries =
    async () => {
      const res = await fetch(
        "/api/diary"
      );

      const data =
        await res.json();

      setDiaries(data);
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

    setUser(parsed);

    fetchDiaries();
  }, []);

  const markAsRead =
    async (id: number) => {
      await fetch(
        `/api/diary/${id}`,
        {
          method: "PATCH",
        }
      );

      fetchDiaries();
    };

  return (
    <div>
      <Link href="/">
        ← トップへ戻る
      </Link>

      <h1>担任画面</h1>

      <p>
        ログイン中:
        {user?.name}
      </p>

      <h2>
        提出一覧
      </h2>

      {diaries.map((d) => (
        <div
          key={d.id}
          style={{
            border:
              "1px solid gray",

            padding: "10px",

            marginBottom:
              "10px",
          }}
        >
          <p>
            生徒:
            {
              d.student
                ?.name
            }
          </p>

          <p>
            体調:
            {
              d.physicalCondition
            }
          </p>

          <p>
            メンタル:
            {
              d.mentalCondition
            }
          </p>

          <p>
            コメント:
            {d.comment}
          </p>

          <p>
            状態:
            {d.readAt
              ? "既読"
              : "未読"}
          </p>

          {!d.readAt && (
            <button
              onClick={() =>
                markAsRead(
                  d.id
                )
              }
            >
              既読にする
            </button>
          )}
        </div>
      ))}
    </div>
  );
}