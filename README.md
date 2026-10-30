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

Har bir modul bir xil tuzilgan: `api/` (endpoint, DTO, so'rovlar), `lib/` (mapper va sof funksiyalar), `model/`
(TanStack Query hook'lari, Zustand store'lar), `ui/` (komponentlar) va tashqariga ochiq `index.ts`. Boshqa qatlamlar
modulning faqat `index.ts` idan import qiladi.

Qatlamlar tartibi: `app → pages → widgets → modules → shared`. Pastki qatlam yuqoridagisini import qilmaydi
(ESLint `no-restricted-imports` tekshiradi).

Qoidalar:
- `any`, `@ts-ignore`, `console.log` ishlatilmaydi.
- `zod` faqat `@/shared/lib/zod` orqali import qilinadi: u `jitless` rejimini yoqadi (CSP `unsafe-eval` siz ishlashi uchun).
  ESLint to'g'ridan-to'g'ri `import ... from "zod"` ni taqiqlaydi.
- Yangi mantiq (mapper, hook, yordamchi funksiya) yoniga `*.test.ts` qo'shiladi. Mapperlar bo'sh yoki chala javobda
  yiqilmasligi `src/test/mappers-robustness.test.ts` da tekshiriladi: yangi mapper qo'shsangiz shu ro'yxatga qo'shing.
- Serverdan kelgan HTML faqat `sanitizeHtml` (DOMPurify) orqali ko'rsatiladi (`shared/lib/sanitize-html.ts`).
- Yangi matnlar `src/shared/i18n/locales/{uz,ru,en}/*.json` ga **uch tilda** qo'shiladi (uch tildagi kalitlar bir xil bo'lishi kerak).
- Dizayn-tizim sahifasi (`/design-system`) faqat `npm run dev` da ochiladi, production'ga kirmaydi.

## Tarjimalar va birinchi yuklanish

- Darhol faqat o'zbekcha `common`, `auth`, `nav` yuklanadi. Qolgan namespace'lar (`chat`, `lesson`, ...) va boshqa tillar
  talab bo'yicha (`src/shared/i18n/i18n.ts` dagi backend), foydalanuvchi kirgandan keyin esa fonda oldindan yuklanadi.
  `useTranslation("chat")` namespace hali kelmagan bo'lsa eng yaqin `Suspense` skeletini ko'rsatadi.
- Komponentdan tashqarida `i18n.t("ns:key")` ishlatsangiz, o'sha namespace komponent ichida ham ishlatilganiga ishonch hosil qiling.
- `package.json` dagi `sideEffects` ro'yxati bundler'ga ishlatilmagan modullarni tashlab ketishga ruxsat beradi. Faqat
  import qilinishining o'zi ish bajaradigan (side effect) yangi fayl qo'shsangiz, uni shu ro'yxatga yozing.
- Login sahifasida yuklanadigan JS ~200 KB (gzip). Login'dan keyin kerak bo'ladigan narsalarni `lazy()` / dinamik `import()` bilan yuklang.

## Real vaqt

- Har bir ochiq chat o'z `ws/chat/<room>/` ulanishiga ega (`modules/message/lib/chat-socket-manager.ts`).
- O'qituvchi va o'quvchida butun ilova uchun bitta `ws/notifications/` ulanishi (`app/router/realtime-sync.tsx`):
  bildirishnomalar, chat ro'yxati uchun `chat_activity` va `chat_typing`. Ulanish yo'q paytda chat ro'yxati 10 soniyada qayta so'raladi.

## Dars yozuvi (o'qituvchi brauzerida)

Yozuv serverda emas, o'qituvchining brauzerida olinadi: ekran (video) va barcha ovozlar aralashmasi (audio) alohida
`MediaRecorder` bilan 30 soniyalik bo'laklarga bo'linib yuboriladi (`src/modules/lesson/lib/`).

- Bo'laklar tartib raqami va sessiya id bilan yuboriladi, qayta yuborilsa server ikki marta yozmaydi.
- Yuklanmagan bo'laklar IndexedDB da ham saqlanadi: sahifa yopilib/yangilansa, keyingi sessiya ularni **yangi bo'laklardan oldin** yuboradi
  (`recording-upload-queue.ts`).
- Brauzerning "Ulashishni to'xtatish" tugmasi bosilsa video yozuv to'xtaydi; o'qituvchiga ogohlantirish chiqadi.
  Ekran qayta ulashilsa yangi sessiya boshlanadi, serverda oradagi tanaffus to'ldiriladi.

## Xavfsizlik

- Tokenlar `localStorage`/`sessionStorage` da. `vercel.json` da `Content-Security-Policy-Report-Only` sarlavhasi bor.
  Production build'da hamma rollar va asosiy sahifalar (doska formulasi, PDF, jonli dars ham) shu siyosat bilan
  tekshirilgan: buzilish yo'q. Bir kun report-only'da kuzatilgach qat'iy (enforce) rejimga o'tkaziladi.
- Backend hujjatlari backend repo'da (`krv006/Education-Tech-Platform`).
