"use client";

import { useState } from "react";

export default function Home() {
  const [loginId, setLoginId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const login = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
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

        setIsLoading(false);
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
        return;
      }

      if (
        user.role === "TEACHER"
      ) {
        location.href = "/teacher";
        return;
      }

      if (
        user.role === "ADMIN"
      ) {
        location.href = "/admin";
        return;
      }

      setIsLoading(false);
    } catch {
      alert(
        "ログイン処理に失敗しました。時間をおいて再度お試しください"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <main className="login-panel">
        <h1>
          連絡帳管理システム PoC
        </h1>

        <form
          className="login-form"
          onSubmit={login}
          aria-busy={isLoading}
        >
          <input
            placeholder="ログインID"
            value={loginId}
            disabled={isLoading}
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
            disabled={isLoading}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

          <button
            type="submit"
            disabled={isLoading}
          >
            {isLoading && (
              <span
                className="login-spinner"
                aria-hidden="true"
              />
            )}
            {isLoading
              ? "ログイン中…"
              : "ログイン"}
          </button>
        </form>
      </main>
    </div>
  );
}
