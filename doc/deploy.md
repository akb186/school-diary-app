# デプロイ・起動手順

## 動作環境

- Ubuntu 24.04 LTS
- Node.js 20系
- npm 10系

---

## ソースコード取得

```bash
git clone <repository-url>

cd school-diary-poc
```

---

## パッケージインストール

```bash
npm install
```

---

## Prisma migration

```bash
npx prisma migrate dev --name init
```

---

## seedデータ投入

```bash
npm run seed
```

---

## アプリ起動

```bash
npm run dev
```

---

## アクセス

```txt
http://localhost:3000
```
