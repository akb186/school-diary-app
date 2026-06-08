"use client";

import { useState } from "react";

export default function Home() {
  const [loginId, setLoginId] =
    useState("");

  const [password, setPassword] =
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
          loginId,
          password,
        }),
      }
    );

    if (!res.ok) {
      alert(
        "IDまたはパスワードが違います"
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
    <div className="login-page">
      <main className="login-panel">
        <h1>
          連絡帳管理システム PoC
        </h1>

        <div className="login-form">
          <input
            placeholder="ログインID"
            value={loginId}
            onChange={(e) =>
              setLoginId(
                e.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

          <button onClick={login}>
            ログイン
          </button>
        </div>
      </main>
    </div>
  );
}
