"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

export default function AdminPage() {
  const [name, setName] =
    useState("");

  const [role, setRole] =
    useState("STUDENT");

  const [users, setUsers] =
    useState<any[]>([]);

  const fetchUsers = async () => {
    const res = await fetch(
      "/api/users/list"
    );

    const data = await res.json();

    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const submit = async () => {
    await fetch("/api/users", {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        name,
        role,

        classRoomId: 1,
      }),
    });

    alert(
      "ユーザーを作成しました"
    );

    setName("");

    fetchUsers();
  };

  return (
    <div>
      <Link href="/">
        ← トップへ戻る
      </Link>

      <h1>管理者画面</h1>

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <input
          placeholder="名前"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
          style={{
            marginLeft: "10px",
          }}
        >
          <option value="STUDENT">
            生徒
          </option>

          <option value="TEACHER">
            担任
          </option>
        </select>

        <button
          onClick={submit}
          style={{
            marginLeft: "10px",
          }}
        >
          作成
        </button>
      </div>

      <h2
        style={{
          marginTop: "30px",
        }}
      >
        ユーザー一覧
      </h2>

      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>名前</th>
            <th>Role</th>
            <th>クラス</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>

              <td>{user.name}</td>

              <td>{user.role}</td>

              <td>
                {user.classRoom?.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}