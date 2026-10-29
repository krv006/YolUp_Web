# YolUp (Fokus) — frontend

Onlayn ta'lim platformasining veb-ilovasi: jonli video darslar (LiveKit), chat, doska, uy vazifalari, testlar, imtihonlar,
davomat va ota-ona paneli. Uch til: o'zbekcha, ruscha, inglizcha.

- **Stack:** React 19, TypeScript (strict), Vite 8, TanStack Query, Zustand, React Router 7, Tailwind CSS 4, LiveKit, i18next.
- **Backend:** alohida repo (`krv006/Education-Tech-Platform`). Bu ilova uning API va WebSocket'larini chaqiradi.
- **Hosting:** Vercel (`main` ga push qilinsa avtomatik deploy bo'ladi).

## Ishga tushirish

```bash
npm ci
cp .env.example .env     # qiymatlarni to'ldiring
npm run dev              # http://localhost:5173
```

| Buyruq | Nima qiladi |
|---|---|
| `npm run dev` | Ishlab chiqish serveri (`/api` so'rovlari `VITE_API_PROXY_TARGET` ga yo'naltiriladi) |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm test` | Vitest (birlik testlar) |
| `npm run build` | `tsc -b` + production build (`dist/`) |

PR ochishdan oldin `typecheck`, `lint`, `test` va `build` o'tishi kerak (GitHub Actions ham shuni tekshiradi).

## Muhit o'zgaruvchilari (`.env`)

Namuna: [`.env.example`](.env.example). Vercel'da ham xuddi shu nomlar bilan beriladi.

| O'zgaruvchi | Ma'nosi |
|---|---|
| `VITE_API_URL` | `/` (Vercel `/api` proksisi orqali) yoki API'ning to'liq manzili. Domen `VITE_WS_URL` dan olinadi, shuning uchun amalda so'rovlar to'g'ridan-to'g'ri API domeniga ketadi |
| `VITE_WS_URL` | WebSocket manzili, masalan `wss://edu.thesofmebel.uz` |
| `VITE_API_PROXY_TARGET` | Faqat `npm run dev` uchun: `/api` qaysi serverga proksi qilinadi |
| `VITE_REQUEST_TIMEOUT` | So'rov muddati, ms (standart 15000) |
| `VITE_APP_NAME`, `VITE_APP_ENV` | Ilova nomi va muhit (ixtiyoriy) |

## Tuzilma

```
src/
  app/        marshrutlar, providerlar, layoutlar, himoyalangan marshrutlar (ProtectedRoute / RoleRoute)
  modules/    sohalar: auth, lesson, live, message, conversation, homework, quiz, exam, board, ... (api / model / lib / ui)
  pages/      sahifalar (rol bo'yicha: teacher, student, parent, admin)
  widgets/    katta qismlar: live-room, group-workspace, chat-shell, ...
  shared/     api klient, i18n, ui, hooks, uslublar, konfiguratsiya
```

Qoidalar:
- `any`, `@ts-ignore`, `console.log` ishlatilmaydi.
- Serverdan kelgan HTML faqat `sanitizeHtml` (DOMPurify) orqali ko'rsatiladi (`shared/lib/sanitize-html.ts`).
- Yangi matnlar `src/shared/i18n/locales/{uz,ru,en}/*.json` ga **uch tilda** qo'shiladi.
- Dizayn-tizim sahifasi (`/design-system`) faqat `npm run dev` da ochiladi, production'ga kirmaydi.

## Dars yozuvi (o'qituvchi brauzerida)

Yozuv serverda emas, o'qituvchining brauzerida olinadi: ekran (video) va barcha ovozlar aralashmasi (audio) alohida
`MediaRecorder` bilan 30 soniyalik bo'laklarga bo'linib yuboriladi (`src/modules/lesson/lib/`).

- Bo'laklar tartib raqami va sessiya id bilan yuboriladi, qayta yuborilsa server ikki marta yozmaydi.
- Yuklanmagan bo'laklar IndexedDB da ham saqlanadi: sahifa yopilib/yangilansa, keyingi sessiya ularni **yangi bo'laklardan oldin** yuboradi
  (`recording-upload-queue.ts`).
- Brauzerning "Ulashishni to'xtatish" tugmasi bosilsa video yozuv to'xtaydi; o'qituvchiga ogohlantirish chiqadi.
  Ekran qayta ulashilsa yangi sessiya boshlanadi, serverda oradagi tanaffus to'ldiriladi.

## Xavfsizlik

- Tokenlar `localStorage`/`sessionStorage` da. `vercel.json` da `Content-Security-Policy-Report-Only` sarlavhasi bor:
  brauzer konsolida buzilishlar ko'rinadi; ularni tuzatgach `Report-Only` ni olib tashlab qat'iy (enforce) rejimga o'tkazing.
- `docs/` papkasi backend hujjatlarining nusxasi (eskirgan bo'lishi mumkin). Asosiy manba: backend repo.
