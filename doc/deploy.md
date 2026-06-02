# デプロイ・起動手順

## Vercel デプロイ

### 1. Neon PostgreSQL を用意する

Neon で Project を作成し、Connection string を2種類取得します。

- `Pooled connection`: アプリ実行時に使う
- `Direct connection`: Prisma migration に使う

```txt
DATABASE_URL=postgresql://USER:PASSWORD@POOLED_HOST/DATABASE?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@DIRECT_HOST/DATABASE?sslmode=require
```

Prisma は `DATABASE_URL` を通常の接続に使い、`DIRECT_URL` を migration などの direct access に使います。

### 2. Vercel に環境変数を設定する

Vercel の Project Settings > Environment Variables に以下を設定します。

```txt
DATABASE_URL=postgresql://USER:PASSWORD@POOLED_HOST/DATABASE?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@DIRECT_HOST/DATABASE?sslmode=require
SESSION_SECRET=十分に長いランダム文字列
```

`SESSION_SECRET` はログインセッションの署名に使います。本番では `.env.example` の値をそのまま使わないでください。

### 3. GitHub リポジトリを Import する

Vercel ダッシュボードで `Add New... > Project` を選び、GitHub リポジトリを Import します。

このリポジトリには `vercel.json` があり、Vercel の Build Command は以下になります。

```bash
npm run db:deploy && npm run build
```

そのため、デプロイ時に Prisma migration が自動適用されます。

### 4. seed データを投入する

初回デプロイ後、本番 DB にテストデータを入れる場合は、Vercel CLI で環境変数を取得してから seed を実行します。

```bash
npm install
npx vercel link
npx vercel env pull .env.production.local
npm run db:seed
```

seed 後は以下のアカウントでログインできます。

```txt
admin / pass
teacher001 / pass
student001 / pass
```

## ローカル起動

### 1. パッケージインストール

```bash
npm install
```

### 2. 環境変数

`.env.example` を参考に `.env` を作成します。

```txt
DATABASE_URL="postgresql://USER:PASSWORD@POOLED_HOST/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@DIRECT_HOST/DATABASE?sslmode=require"
SESSION_SECRET="replace-with-a-long-random-secret"
```

### 3. Prisma migration

```bash
npx prisma migrate dev --name init
```

### 4. seed データ投入

```bash
npm run db:seed
```

### 5. アプリ起動

```bash
npm run dev
```

アクセス先:

```txt
http://localhost:3000
```
