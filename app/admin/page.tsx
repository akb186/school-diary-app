"use client";

import {
  useEffect,
  useState,
} from "react";

type Notification = {
  message: string;
  type: "success" | "error";
};

const getDefaultSchoolYear = () => {
  const date = new Date();

  return date.getMonth() >= 3
    ? date.getFullYear()
    : date.getFullYear() - 1;
};

const formatReiwaSchoolYear = (
  schoolYear: number
) => {
  const reiwaYear = schoolYear - 2018;
  const displayYear =
    reiwaYear === 1
      ? "元"
      : String(reiwaYear);

  return `令和${displayYear}年度（${schoolYear}年度）`;
};

export default function AdminPage() {
  const targetPromotionSchoolYear =
    getDefaultSchoolYear() + 1;

  const [adminUser, setAdminUser] =
    useState<any>(null);

  const [classes, setClasses] =
    useState<any[]>([]);

  const [users, setUsers] =
    useState<any[]>([]);

  const [classGrade, setClassGrade] =
    useState("");

  const [classValue, setClassValue] =
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

  const [
    promotionPreview,
    setPromotionPreview,
  ] = useState<any>(null);

  const [
    isLoadingPromotion,
    setIsLoadingPromotion,
  ] = useState(false);

  const [
    isExecutingPromotion,
    setIsExecutingPromotion,
  ] = useState(false);

  const [
    promotionProgress,
    setPromotionProgress,
  ] = useState(0);

  const [
    isPromotionOpen,
    setIsPromotionOpen,
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

  const getUserClassLabel = (
    user: any
  ) => {
    if (
      user.studentStatus ===
      "GRADUATED"
    ) {
      return "卒業";
    }

    return (
      getClassRoomName(
        user.classRoom
      ) || "未設定"
    );
  };

  const getUserSortValue = (
    user: any,
    key: string
  ) => {
    if (key === "classRoom") {
      return getUserClassLabel(user);
    }

    return user[key] ?? "";
  };

  const filteredUsers = users.filter(
    (user) => {
      const keyword =
        userSearch.trim().toLowerCase();
      const classRoomName =
        getUserClassLabel(user);
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
          grade: classGrade,
          class: classValue,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setClassGrade("");
    setClassValue("");
    setClassRoomId(String(data.id));

    await fetchClasses();
  };

  const deleteClass = async (
    classRoom: any
  ) => {
    const studentCount =
      users.filter(
        (user) =>
          user.classRoomId ===
            classRoom.id &&
          user.role === "STUDENT"
      ).length;

    const message =
      studentCount > 0
        ? `${getClassRoomName(classRoom)} を削除しますか？所属生徒 ${studentCount} 名のクラス情報は未設定になります。`
        : `${getClassRoomName(classRoom)} を削除しますか？`;

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

  const previewPromotion = async () => {
    setIsLoadingPromotion(true);

    try {
      const res = await fetch(
        "/api/users/promotions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            dryRun: true,
            schoolYear:
              targetPromotionSchoolYear,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        showNotification(
          data.error ??
            "進級プレビューに失敗しました",
          "error"
        );
        return;
      }

      setPromotionPreview(data);
    } catch {
      showNotification(
        "進級プレビューに失敗しました",
        "error"
      );
    } finally {
      setIsLoadingPromotion(false);
    }
  };

  const executePromotion = async () => {
    if (
      !promotionPreview ||
      isExecutingPromotion
    ) {
      return;
    }

    const confirmed = confirm(
      `${promotionPreview.promotedStudents} 名を進級し、${promotionPreview.graduatedStudents} 名を卒業扱いにします。過去の日報とクラス履歴は保持されます。実行しますか？`
    );

    if (!confirmed) {
      return;
    }

    setIsExecutingPromotion(true);
    setPromotionProgress(8);

    let completed = false;
    const progressTimer =
      window.setInterval(() => {
        setPromotionProgress((current) =>
          current >= 90
            ? current
            : current + 8
        );
      }, 500);

    try {
      const res = await fetch(
        "/api/users/promotions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            dryRun: false,
            schoolYear:
              targetPromotionSchoolYear,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        showNotification(
          data.error ??
            "進級処理に失敗しました",
          "error"
        );
        return;
      }

      setPromotionProgress(92);
      setPromotionPreview(data);

      await fetchClasses();
      await fetchUsers();

      completed = true;
      setPromotionProgress(100);

      showNotification(
        `進級処理を実行しました: 進級 ${data.promotedStudents} 名 / 卒業扱い ${data.graduatedStudents} 名`
      );
    } catch {
      showNotification(
        "進級処理に失敗しました",
        "error"
      );
    } finally {
      window.clearInterval(progressTimer);
      setIsExecutingPromotion(false);

      if (completed) {
        window.setTimeout(() => {
          setPromotionProgress(0);
        }, 1800);
      } else {
        setPromotionProgress(0);
      }
    }
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
        <h1>管理者画面</h1>

        <div className="page-actions">
          <div className="account-summary">
            <span className="account-name">
              ログイン中: {adminUser.name}
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

      <h2>クラス管理</h2>

      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>学年</th>
            <th>組</th>
            <th>クラス</th>
            <th>生徒人数</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          {classes.map((classRoom) => {
            const studentCount =
              users.filter(
                (user) =>
                  user.classRoomId ===
                    classRoom.id &&
                  user.role === "STUDENT"
              ).length;

            return (
              <tr key={classRoom.id}>
                <td>{classRoom.id}</td>

                <td>{classRoom.grade}</td>

                <td>{classRoom.class}</td>

                <td>
                  {getClassRoomName(
                    classRoom
                  )}
                </td>

                <td>
                  {studentCount}
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
          type="number"
          min="1"
          placeholder="学年 例: 1"
          value={classGrade}
          onChange={(e) =>
            setClassGrade(
              e.target.value
            )
          }
        />

        <input
          placeholder="組 例: A"
          value={classValue}
          onChange={(e) =>
            setClassValue(
              e.target.value
            )
          }
        />

        <button
          onClick={createClass}
        >
          作成
        </button>
      </div>

      <div className="detail-panel promotion-panel">
        <div className="collapsible-header">
          <div>
            <h2>進級処理</h2>
          </div>

          <button
            className="secondary-button"
            type="button"
            aria-expanded={isPromotionOpen}
            onClick={() =>
              setIsPromotionOpen(
                (current) => !current
              )
            }
          >
            {isPromotionOpen
              ? "閉じる"
              : "開く"}
          </button>
        </div>

        {isPromotionOpen && (
          <div className="collapsible-content">
            <p className="muted-text">
              中学校設定: 1年生は2年生へ、2年生は3年生へ、3年生は卒業になります。
            </p>

            <div className="form-row">
              <button
                className="secondary-button"
                onClick={previewPromotion}
                disabled={isLoadingPromotion}
              >
                {isLoadingPromotion
                  ? "確認中..."
                  : "プレビュー"}
              </button>

              <button
                onClick={executePromotion}
                disabled={
                  !promotionPreview ||
                  promotionPreview.dryRun ===
                    false ||
                  isExecutingPromotion
                }
              >
                {isExecutingPromotion
                  ? "実行中..."
                  : "進級を実行"}
              </button>
            </div>

            {(isExecutingPromotion ||
              promotionProgress > 0) && (
              <div
                className="progress-area"
                role="status"
                aria-live="polite"
              >
                <div className="progress-header">
                  <span>
                    進級処理を実行中
                  </span>

                  <span>
                    {promotionProgress}%
                  </span>
                </div>

                <progress
                  className="progress-meter"
                  value={promotionProgress}
                  max="100"
                  aria-label="進級処理の進捗"
                />
              </div>
            )}

            {promotionPreview && (
              <>
                <p className="muted-text">
                  対象:{" "}
                  {
                    promotionPreview.totalStudents
                  }{" "}
                  名 / 進級:{" "}
                  {
                    promotionPreview.promotedStudents
                  }{" "}
                  名 / 卒業扱い:{" "}
                  {
                    promotionPreview.graduatedStudents
                  }{" "}
                  名
                </p>

                {promotionPreview.classesToCreate
                  ?.length > 0 && (
                  <p className="muted-text">
                    自動作成されるクラス:{" "}
                    {promotionPreview.classesToCreate
                      .map(
                        (classRoom: any) =>
                          classRoom.name
                      )
                      .join(", ")}
                  </p>
                )}

                <table border={1}>
                  <thead>
                    <tr>
                      <th>現在クラス</th>
                      <th>進級先</th>
                      <th>人数</th>
                    </tr>
                  </thead>

                  <tbody>
                    {promotionPreview.moves.map(
                      (move: any) => (
                        <tr
                          key={`${move.fromClassRoomId}-${move.toClassName ?? "graduate"}`}
                        >
                          <td>
                            {move.fromClassName}
                          </td>

                          <td>
                            {move.toClassName
                              ? `${move.toClassName}${move.willCreateClass ? "（新規作成）" : ""}`
                              : "卒業扱い"}
                          </td>

                          <td>
                            {move.studentCount}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
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
              {getClassRoomName(
                classRoom
              )}
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
              {getClassRoomName(
                classRoom
              )}
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

                  <td className="name-cell">
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
                      <span className="name-text">
                        {user.name}
                      </span>
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
                              {getClassRoomName(
                                classRoom
                              )}
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      getUserClassLabel(user)
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
