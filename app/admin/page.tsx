"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

type Notification = {
  message: string;
  type: "success" | "error";
};

export default function AdminPage() {
  const [adminUser, setAdminUser] =
    useState<any>(null);

  const [classes, setClasses] =
    useState<any[]>([]);

  const [users, setUsers] =
    useState<any[]>([]);

  const [className, setClassName] =
    useState("");

  const [name, setName] =
    useState("");

  const [loginId, setLoginId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("STUDENT");

  const [classRoomId, setClassRoomId] =
    useState("");

  const [
    editingUserId,
    setEditingUserId,
  ] = useState("");

  const [editName, setEditName] =
    useState("");

  const [
    editClassRoomId,
    setEditClassRoomId,
  ] = useState("");

  const [userSortKey, setUserSortKey] =
    useState("id");

  const [userSortOrder, setUserSortOrder] =
    useState<"asc" | "desc">("asc");

  const [userSearch, setUserSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("");

  const [
    classRoomFilter,
    setClassRoomFilter,
  ] = useState("");

  const [
    notification,
    setNotification,
  ] = useState<Notification | null>(
    null
  );

  const [
    isCreatingUser,
    setIsCreatingUser,
  ] = useState(false);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setNotification(null);
      }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notification]);

  const showNotification = (
    message: string,
    type: Notification["type"] =
      "success"
  ) => {
    setNotification({
      message,
      type,
    });
  };

  const sortUsers = (key: string) => {
    if (userSortKey === key) {
      setUserSortOrder(
        userSortOrder === "asc"
          ? "desc"
          : "asc"
      );
      return;
    }

    setUserSortKey(key);
    setUserSortOrder("asc");
  };

  const getUserSortLabel = (
    key: string
  ) => {
    if (userSortKey !== key) {
      return "↕";
    }

    return userSortOrder === "asc"
      ? "↑"
      : "↓";
  };

  const getUserSortValue = (
    user: any,
    key: string
  ) => {
    if (key === "classRoom") {
      return (
        user.classRoom?.name ?? ""
      );
    }

    return user[key] ?? "";
  };

  const filteredUsers = users.filter(
    (user) => {
      const keyword =
        userSearch.trim().toLowerCase();
      const classRoomName =
        user.classRoom?.name ?? "";
      const matchesKeyword =
        !keyword ||
        [
          user.name,
          user.loginId,
          user.role,
          classRoomName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesRole =
        !roleFilter ||
        user.role === roleFilter;

      const matchesClassRoom =
        !classRoomFilter ||
        String(user.classRoomId ?? "") ===
          classRoomFilter;

      return (
        matchesKeyword &&
        matchesRole &&
        matchesClassRoom
      );
    }
  );

  const sortedUsers = [...filteredUsers].sort(
    (a, b) => {
      const aValue = getUserSortValue(
        a,
        userSortKey
      );
      const bValue = getUserSortValue(
        b,
        userSortKey
      );

      if (
        typeof aValue === "number" &&
        typeof bValue === "number"
      ) {
        return userSortOrder === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      const result = String(
        aValue
      ).localeCompare(
        String(bValue),
        "ja"
      );

      return userSortOrder === "asc"
        ? result
        : -result;
    }
  );

  const fetchUsers = async () => {
    const res = await fetch(
      "/api/users/list",
      {
        cache: "no-store",
      }
    );

    const data = await res.json();

    setUsers(data);
  };

  const fetchClasses = async () => {
    const res = await fetch(
      "/api/users/classes",
      {
        cache: "no-store",
      }
    );

    const data = await res.json();

    setClasses(data);

    if (
      data.length > 0 &&
      !classRoomId
    ) {
      setClassRoomId(
        String(data[0].id)
      );
    }
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
      parsed.role !== "ADMIN"
    ) {
      location.href = "/";
      return;
    }

    setAdminUser(parsed);

    fetchUsers();
    fetchClasses();
  }, []);

  const createClass = async () => {
    const res = await fetch(
      "/api/users/classes",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          name: className,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setClassName("");
    setClassRoomId(String(data.id));

    await fetchClasses();
  };

  const deleteClass = async (
    classRoom: any
  ) => {
    const assignedUserCount =
      users.filter(
        (user) =>
          user.classRoomId ===
          classRoom.id
      ).length;

    const message =
      assignedUserCount > 0
        ? `${classRoom.name} を削除しますか？所属ユーザー ${assignedUserCount} 名のクラス情報は未設定になります。`
        : `${classRoom.name} を削除しますか？`;

    if (!confirm(message)) {
      return;
    }

    const res = await fetch(
      "/api/users/classes",
      {
        method: "DELETE",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          id: classRoom.id,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    if (
      classRoomId ===
      String(classRoom.id)
    ) {
      setClassRoomId("");
    }

    if (
      editClassRoomId ===
      String(classRoom.id)
    ) {
      setEditClassRoomId("");
    }

    await fetchClasses();
    await fetchUsers();
  };

  const createUser = async () => {
    if (isCreatingUser) {
      return;
    }

    setIsCreatingUser(true);

    try {
      const res = await fetch(
        "/api/users",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            loginId,
            password,
            role,
            classRoomId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        showNotification(
          data.error ??
            "ユーザー作成に失敗しました",
          "error"
        );
        return;
      }

      setName("");
      setLoginId("");
      setPassword("");

      await fetchUsers();

      showNotification(
        `${data.name} を作成しました`
      );
    } catch {
      showNotification(
        "ユーザー作成に失敗しました",
        "error"
      );
    } finally {
      setIsCreatingUser(false);
    }
  };

  const startEditUser = (user: any) => {
    setEditingUserId(String(user.id));
    setEditName(user.name);
    setEditClassRoomId(
      user.classRoomId
        ? String(user.classRoomId)
        : ""
    );
  };

  const cancelEditUser = () => {
    setEditingUserId("");
    setEditName("");
    setEditClassRoomId("");
  };

  const updateUser = async (
    user: any
  ) => {
    const res = await fetch("/api/users", {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        id: user.id,
        name: editName,
        classRoomId: editClassRoomId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    cancelEditUser();

    await fetchUsers();
  };

  const deleteUser = async (
    user: any
  ) => {
    if (
      user.role !== "TEACHER" &&
      user.role !== "STUDENT"
    ) {
      alert(
        "先生または生徒のみ削除できます"
      );
      return;
    }

    if (
      !confirm(
        `${user.name} を削除しますか？`
      )
    ) {
      return;
    }

    const res = await fetch("/api/users", {
      method: "DELETE",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        id: user.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    if (
      editingUserId ===
      String(user.id)
    ) {
      cancelEditUser();
    }

    await fetchUsers();
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
      {notification && (
        <div
          className={`toast-notification ${notification.type}`}
          role="status"
          aria-live="polite"
        >
          {notification.message}
        </div>
      )}

      {!adminUser && (
        <p>確認中...</p>
      )}

      {adminUser && (
        <>
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

      <h1>管理者画面</h1>

      <div className="summary-row">
        <span>
          ログイン中: {adminUser.name}
        </span>
      </div>

      <h2>クラス管理</h2>

      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>クラス名</th>
            <th>所属人数</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          {classes.map((classRoom) => {
            const assignedUserCount =
              users.filter(
                (user) =>
                  user.classRoomId ===
                  classRoom.id
              ).length;

            return (
              <tr key={classRoom.id}>
                <td>{classRoom.id}</td>

                <td>{classRoom.name}</td>

                <td>
                  {assignedUserCount}
                </td>

                <td>
                  <button
                    className="danger-button"
                    onClick={() =>
                      deleteClass(
                        classRoom
                      )
                    }
                  >
                    削除
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="form-row class-create-row">
        <input
          placeholder="新規クラス名 例: 1-A"
          value={className}
          onChange={(e) =>
            setClassName(e.target.value)
          }
        />

        <button
          onClick={createClass}
        >
          作成
        </button>
      </div>

      <h2
        style={{
          marginTop: "30px",
        }}
      >
        ユーザー管理
      </h2>

      <h3>新規ユーザー作成</h3>

      <div className="form-grid">
        <input
          placeholder="名前"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <input
          placeholder="ログインID"
          value={loginId}
          onChange={(e) =>
            setLoginId(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
        >
          <option value="STUDENT">
            生徒
          </option>

          <option value="TEACHER">
            先生
          </option>
        </select>

        <select
          value={classRoomId}
          onChange={(e) =>
            setClassRoomId(e.target.value)
          }
        >
          <option value="">
            クラスを選択
          </option>

          {classes.map((classRoom) => (
            <option
              key={classRoom.id}
              value={classRoom.id}
            >
              {classRoom.name}
            </option>
          ))}
        </select>

        <button
          onClick={createUser}
          disabled={isCreatingUser}
        >
          {isCreatingUser
            ? "作成中..."
            : "作成"}
        </button>
      </div>

      <h3
        style={{
          marginTop: "20px",
        }}
      >
        ユーザー一覧
      </h3>

      <div className="filter-row">
        <input
          placeholder="名前・ログインID・Role・クラスで検索"
          value={userSearch}
          onChange={(e) =>
            setUserSearch(e.target.value)
          }
        />

        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value)
          }
        >
          <option value="">
            Roleすべて
          </option>

          <option value="STUDENT">
            生徒
          </option>

          <option value="TEACHER">
            先生
          </option>

          <option value="ADMIN">
            管理者
          </option>
        </select>

        <select
          value={classRoomFilter}
          onChange={(e) =>
            setClassRoomFilter(
              e.target.value
            )
          }
        >
          <option value="">
            クラスすべて
          </option>

          {classes.map((classRoom) => (
            <option
              key={classRoom.id}
              value={classRoom.id}
            >
              {classRoom.name}
            </option>
          ))}
        </select>

        <button
          className="secondary-button"
          onClick={() => {
            setUserSearch("");
            setRoleFilter("");
            setClassRoomFilter("");
          }}
          disabled={
            !userSearch &&
            !roleFilter &&
            !classRoomFilter
          }
        >
          クリア
        </button>
      </div>

      <p className="muted-text">
        表示件数: {sortedUsers.length} /{" "}
        {users.length}
      </p>

      <div className="user-table-area">
        <table border={1}>
          <thead>
            <tr>
              <th>
                <button
                  className="sort-button"
                  onClick={() =>
                    sortUsers("id")
                  }
                >
                  ID {getUserSortLabel("id")}
                </button>
              </th>
              <th>
                <button
                  className="sort-button"
                  onClick={() =>
                    sortUsers("name")
                  }
                >
                  名前{" "}
                  {getUserSortLabel("name")}
                </button>
              </th>
              <th>
                <button
                  className="sort-button"
                  onClick={() =>
                    sortUsers("loginId")
                  }
                >
                  ログインID{" "}
                  {getUserSortLabel(
                    "loginId"
                  )}
                </button>
              </th>
              <th>
                <button
                  className="sort-button"
                  onClick={() =>
                    sortUsers("role")
                  }
                >
                  Role{" "}
                  {getUserSortLabel("role")}
                </button>
              </th>
              <th>
                <button
                  className="sort-button"
                  onClick={() =>
                    sortUsers("classRoom")
                  }
                >
                  クラス{" "}
                  {getUserSortLabel(
                    "classRoom"
                  )}
                </button>
              </th>
              <th>操作</th>
            </tr>
          </thead>

          <tbody>
            {sortedUsers.map((user) => {
              const canManage =
                user.role === "TEACHER" ||
                user.role === "STUDENT";
              const isEditing =
                editingUserId ===
                String(user.id);

              return (
                <tr key={user.id}>
                  <td>{user.id}</td>

                  <td>
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) =>
                          setEditName(
                            e.target.value
                          )
                        }
                      />
                    ) : (
                      user.name
                    )}
                  </td>

                  <td>{user.loginId}</td>

                  <td>{user.role}</td>

                  <td>
                    {isEditing ? (
                      <select
                        value={
                          editClassRoomId
                        }
                        onChange={(e) =>
                          setEditClassRoomId(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          クラス未設定
                        </option>

                        {classes.map(
                          (classRoom) => (
                            <option
                              key={
                                classRoom.id
                              }
                              value={
                                classRoom.id
                              }
                            >
                              {
                                classRoom.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      user.classRoom?.name ??
                      "未設定"
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() =>
                            updateUser(user)
                          }
                        >
                          保存
                        </button>

                        <button
                          className="secondary-button"
                          onClick={
                            cancelEditUser
                          }
                          style={{
                            marginLeft:
                              "6px",
                          }}
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            startEditUser(
                              user
                            )
                          }
                          disabled={!canManage}
                        >
                          編集
                        </button>

                        <button
                          className="danger-button"
                          onClick={() =>
                            deleteUser(user)
                          }
                          disabled={!canManage}
                          style={{
                            marginLeft:
                              "6px",
                          }}
                        >
                          削除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}
