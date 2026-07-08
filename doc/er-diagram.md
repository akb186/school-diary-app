# ER図

## User

| Column | Type |
|---|---|
| id | Int |
| name | String |
| role | String |
| studentStatus | String? |
| graduatedAt | DateTime? |
| graduatedSchoolYear | Int? |
| classRoomId | Int |

---

## Diary

| Column | Type |
|---|---|
| id | Int |
| studentId | Int |
| classRoomId | Int? |
| targetDate | DateTime |
| physicalCondition | String |
| mentalCondition | String |
| comment | String |
| submittedAt | DateTime |
| readAt | DateTime? |
| stampType | String? |

---

## ClassRoom

| Column | Type |
|---|---|
| id | Int |
| name | String |
| grade | Int |
| class | String |

---

## ClassRoomHistory

| Column | Type |
|---|---|
| id | Int |
| userId | Int |
| classRoomId | Int |
| schoolYear | Int |
| startedAt | DateTime |
| endedAt | DateTime? |
| createdAt | DateTime |

---

## Relation

- ClassRoom 1 --- N User
- User 1 --- N Diary
- ClassRoom 1 --- N Diary
- User 1 --- N ClassRoomHistory
- ClassRoom 1 --- N ClassRoomHistory
