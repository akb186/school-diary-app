"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] =
    useState("");

  const login = async () => {
    const res = await fetch(
      "/api/login",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          name,
        }),
      }
    );

    if (!res.ok) {
      alert(
        "ユーザーが存在しません"
      );

      return;
    }

    const user =
      await res.json();

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    if (
      user.role === "STUDENT"
    ) {
      location.href = "/student";
    }

    if (
      user.role === "TEACHER"
    ) {
      location.href = "/teacher";
    }

    if (
      user.role === "ADMIN"
    ) {
      location.href = "/admin";
    }
  };

  return (
    <div>
      <h1>
        連絡帳管理システム PoC
      </h1>

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <input
          placeholder="名前を入力"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
        />

        <button
          onClick={login}
          style={{
            marginLeft: "10px",
          }}
        >
          ログイン
        </button>
      </div>

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <p>
          テストユーザー
        </p>

        <ul>
          <li>管理者</li>

          <li>
            田中先生
          </li>

          <li>A君</li>
        </ul>
      </div>
    </div>
  );
}