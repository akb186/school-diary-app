# ER図

## User

| Column | Type |
|---|---|
| id | Int |
| name | String |
| role | String |
| classRoomId | Int |

---

## Diary

| Column | Type |
|---|---|
| id | Int |
| studentId | Int |
| targetDate | DateTime |
| physicalCondition | String |
| mentalCondition | String |
| comment | String |
| checked | Boolean |

---

## ClassRoom

| Column | Type |
|---|---|
| id | Int |
| name | String |

---

## Relation

- ClassRoom 1 --- N User
- User 1 --- N Diary
