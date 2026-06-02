# 連絡帳管理システム PoC

## 起動方法

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## デプロイ

Vercel へのデプロイ手順は [doc/deploy.md](doc/deploy.md) を参照してください。

## URL

http://localhost:3000
