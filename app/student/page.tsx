"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

export default function StudentPage() {
  const [user, setUser] =
    useState<any>(null);

  const [health, setHealth] =
    useState("よかった");

  const [mental, setMental] =
    useState("元気");

  const [comment, setComment] =
    useState("");

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
  }, []);

  const submit = async () => {
    if (!user) return;

    await fetch("/api/diary", {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        studentId: user.id,

        targetDate: new Date(),

        physicalCondition: health,

        mentalCondition: mental,

        comment,
      }),
    });

    alert("提出しました");
  };

  return (
    <div>
      <Link href="/">
        ← トップへ戻る
      </Link>

      <h1>生徒画面</h1>

      <div>
        <p>
          ログイン中:
          {user?.name}
        </p>

        <div>
          <p>体調</p>

          <input
            value={health}
            onChange={(e) =>
              setHealth(
                e.target.value
              )
            }
          />
        </div>

        <div>
          <p>メンタル</p>

          <input
            value={mental}
            onChange={(e) =>
              setMental(
                e.target.value
              )
            }
          />
        </div>

        <div>
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
        >
          提出
        </button>
      </div>
    </div>
  );
}