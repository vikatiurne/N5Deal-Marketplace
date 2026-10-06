# Architecture — N5Deal Marketplace

B2B marketplace for licensed financial products (EMI, PI, MiCA/CASP, VASP,
banking licences). Buyer posts what it is looking for and what budget it has,
seller posts a concrete asset, the two exchange inquiries **without ever seeing
each other's contacts**, and a manager moderates both sides.

Документ постепенно дополняется по мере выполнения задач (`docs/tasks/`).
Правило: если решение принято и влияет на модель данных или структуру кода —
оно здесь.

---

## Problem, roles, and boundaries

**Problem.** The market for regulated-entity licences is reached through brokers
and warm introductions. Buyers cannot see who is selling, sellers cannot see who
is buying, and neither side can filter by jurisdiction/licence/price. The
product replaces the "who do you know" channel with a searchable catalogue plus
a blind two-sided inquiry flow.

**Roles and what each one may touch.**

| Role    | Reads                                   | Writes                                                                | Cannot                                                                |
| ------- | --------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Guest   | `/`, `/assets`, asset card, seller name | —                                                                     | contact form, dashboards, smart-search rate limit keyed by IP only    |
| Buyer   | catalogue, buyer cards, own inquiries   | buyer profile, inquiries `initiatorRole = BUYER`                      | seller contact data (only `displayName` + `company`), asset editing   |
| Seller  | own assets + their inquiries, buyers    | assets (`DRAFT/PUBLISHED/PAUSED`), inquiries `initiatorRole = SELLER` | other sellers' assets, own asset deletion, moderation, buyer profiles |
| Manager | everything, incl. audit log             | user status, asset status, audit entries                              | own account moderation, `DRAFT` (not a moderation state)              |

Two invariants shape the whole codebase:

1. **Contacts are never exchanged.** A seller sees buyers as `UserSummary`
   (`displayName`, `company`, budget) — no email, no phone. Same in reverse.
2. **The public catalogue only ever contains `PUBLISHED` assets owned by
   `ACTIVE` users.** Enforced in the repository (`listAssets`), not in the UI.

## Stack

| Concern    | Choice                               | Why                                                                                                                                            |
| ---------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js 15 App Router, RSC           | server-first by default; mutations are server actions so the client never holds write logic; `revalidatePath` is one line                      |
| Language   | TypeScript `strict`                  | `exactOptionalPropertyTypes`/`noUncheckedIndexedAccess` catch the two bug classes this app is prone to (filters, nullable rows)                |
| Data       | Prisma + SQLite                      | relational domain (assets↔inquiries↔users) with zero infrastructure for a demo that must `npm i && npm run dev`; Postgres is a datasource swap |
| Auth       | Auth.js v5 Credentials, JWT session  | no email provider, no OAuth app registration; JWT keeps server actions cheap, DB status re-checked on every request for instant suspension     |
| Styling    | Tailwind v4 + `radix-ui` + shadcn    | tokens in CSS, primitives copied into `components/ui`, no second UI kit; `radix-ui` unified package already provides Dialog/Sheet/Table        |
| Validation | Zod                                  | every input (query string, form, AI output, server action) parsed at the boundary before any write                                             |
| AI         | OpenAI Chat Completions over `fetch` | `response_format: json_object` + injected `LlmClient` interface; see [AI smart search](#ai-smart-search-task-08)                               |
| Tests      | Vitest + real SQLite fixture DB      | filters/query-builder logic is only trustworthy when run against the real engine; Zod schemas need no DOM                                      |
| Money      | integer `price`, 3-letter `currency` | no float rounding; EUR/USD/GBP only, so no FX column in the demo                                                                               |

## Data model

```
User ──────────────┬──< Asset >──────────────┬─── Inquiry >────┐
│ id               │   id                   │    id           │
│ role/status      │   sellerId             │    assetId ─────┘
│ displayName      │   title/description    │    buyerId ──┐
│ passwordHash ────┼──< BuyerProfile         │    initiatorRole
│ (never exposed)  │   (1:1, buyer only)    │    message   │
│                  │                        │    readAt    │
│ AuditLog         │                        └──────────────┘
│ actorId, action, targetType, targetId, meta
└──< AuditLog      │
```

Relations, all with `onDelete: Cascade` from the owning side:

- `User 1—N Asset` — seller owns listings. Deleting a user row would cascade,
  which is why moderation never deletes: it flips `status` (see
  [Moderation](#moderation-task-07)).
- `User 1—1 BuyerProfile` — only for `role = BUYER`; carries
  `jurisdictions`/`licenseTypes`/budget/description used for seller↔buyer
  matching.
- `Asset 1—N Inquiry`, `User 1—N Inquiry` — an inquiry is
  `(assetId, buyerId, initiatorRole)` unique: one message per direction per pair.
- `User 1—N AuditLog` — `actorId`; `targetType/targetId` is polymorphic
  (`USER | ASSET`), which SQLite cannot express as a real FK, so referential
  integrity for the target is enforced in `lib/auth/permissions.ts` and the
  repository.

Enums are deliberately closed (`Role`, `AssetStatus`, `LicenseType`, `Role`-
adjacent `AuditAction`, `AuditTargetType`): a typo in a UI button must fail
validation, not create a new category.

---

## Data model decisions

### 1. `Inquiry` — одна таблица, направление в `initiatorRole` (Task 06)

**Контекст.** Покупатель пишет продавцу (`/assets/[id]` → «Contact seller»),
продавец хочет написать покупателю (`/seller/buyers/[id]` → «Contact buyer»).
Задача 06 предлагала два варианта: отдельная модель `SellerMessage` или
direction-agnostic `Inquiry`.

**Решение:** одна модель `Inquiry` с полем `initiatorRole`
(`BUYER` | `SELLER`, default `BUYER`) и `readAt`.

```prisma
model Inquiry {
  assetId       String
  buyerId       String
  initiatorRole Role    @default(BUYER)
  message       String
  readAt        DateTime?

  @@unique([assetId, buyerId, initiatorRole])
}
```

**Почему так:**

| Критерий             | `Inquiry` + `initiatorRole`                                                                                       | Отдельная `SellerMessage`                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Смысл домена         | Совпадает с CONTEXT: «contact request between buyer and seller about an asset» — направление не часть определения | Второй тип сообщения с той же семантикой |
| Метаданные           | Один `readAt`, одно место для аудита и badge-ов                                                                   | Две колонки прочтения, две модели в UI   |
| Ответ продавца       | `initiatorRole = SELLER` по тому же `(asset, buyer)` не конфликтует с уникальным индексом                         | Отдельная таблица                        |
| Миграция на Postgres | Одна таблица                                                                                                      | Две таблицы + join для «диалога»         |
| Ограничения          | Нельзя отправить два сообщения в одну сторону по одной паре                                                       | Можно, но тогда нужен thread-модель      |

**Чем платим:** один инвайт на пару `(asset, buyer)` в каждом направлении —
повторное сообщение «уже отправлено». Это осознанный компромисс: полноценных
тредов с ответами в рамках задачи нет, а unlimited-сообщения без модели
переписки только создают шум в данных.

**Следствия в коде:**

- репозиторий: `findInquiry(assetId, buyerId, initiatorRole)`,
  `listIncomingInquiries({ sellerId, ... })` — только `initiatorRole = BUYER`;
- «мои inquiry» покупателя фильтруются по `initiatorRole = BUYER`, поэтому
  сообщения продавца не попадают в исходящие;
- `readAt` проставляется только получателем (продавцом) и только по инбайксерам,
  принадлежащим его активам (`markInquiriesRead` фильтрует по `asset.sellerId`);
- покупатель никогда не видит контактов продавца: наружу отдаются только
  `displayName` и `company` (`UserSummary`).

### 2. SQLite: массивы как JSON-строки (Task 02)

`BuyerProfile.jurisdictions` и `licenseTypes` — `String` с `JSON.stringify`,
парсятся в репозитории (`parseJsonArray`) и существуют в домене как `string[]`.
Причина — SQLite без типа массива; trade-off зафиксирован здесь, при переезде на
Postgres эти колонки становятся `text[]` без изменения кода домена и UI.

Поиск по ним — `LIKE` (`contains`) прямо по JSON-строке: для демо-набора это
достаточно и не требует триггеров.

### 3. Ownership проверяется в репозитории и в экшене (Task 06)

`findOwnedAsset(assetId, sellerId)` возвращает `null` вместо исключения:

- страница `/seller/assets/[id]/edit` → `notFound()` (404, нет утечки факта
  существования чужого актива);
- server action → `{ ok: false, error }` без записи и без 500.

Серверные экшены Next.js не умеют отдавать 403 (все ответы — 200 + RSC-payload),
поэтому «403 semantics» выражены типизированным результатом, а не HTTP-кодом.

### 4. Server actions вместо REST (CONTEXT, правило 5)

Мутации живут в `src/server/<role>.ts` и возвращают общий
`ActionResult { ok, error?, redirectTo? }`. UI читает его один раз: тост +
`router.refresh()`. `revalidatePath` вызывается на каждый затронутый путь
(`/seller`, `/seller/assets`, `/assets`, карточка актива).

Валидация — Zod (`src/lib/validation/*`) на входе экшена, до любой записи;
уникальные констрейнты БД (`P2002`) ловятся и превращаются в понятный текст,
а не в 500.

---

## Moderation (Task 07)

### 4. Auth: хост и статус аккаунта

- `trustHost: true` в конфиге NextAuth — приложение self-hosted, и без этого
  флага Auth.js в `next start` отвечает `UntrustedHost` на `/api/auth/*`
  (в `next dev` это не воспроизводится).
- Правила доступа живут в `lib/auth/*`, а не в страницах: `requireUser()` и
  `requireRole()` — единственный способ зайти в закрытый раздел, они же
  стоят в каждом server action. Бизнес-правило «менеджера нельзя заблокировать»
  вынесено в чистую функцию `memberModerationError()` (`lib/auth/permissions.ts`),
  поэтому тестируется без HTTP.

### 5. Модерация — только смена статуса, никогда `delete`

`moderateUser` и `moderateAsset` не удаляют строки:

- soft-delete участника = `User.status = DELETED`, поэтому его объявления
  (каскад не срабатывает — статус, не удаление) и все inquiry обеих сторон
  остаются в базе, видны менеджеру и продавцу в инбоксе;
- `Asset.status = REMOVED` убирает объявление из `/assets`, но оставляет его в
  `/manager/assets` и в кабинете продавца, откуда его можно восстановить
  (`Reinstate & publish`);
- `SUSPENDED` участника не может войти (Credentials provider бросает
  `account_suspended`), а уже выданный JWT перестаёт работать: `requireUser()`
  перечитывает `role`/`status` из БД на каждом запросе (`findAccountAccess`),
  а не доверяет клеймам токена, minted в момент логина.

Следствие для покупателя: «профиль помечен неактивным» = пользователь выпадает
из каталога покупателей (`listBuyers` фильтрует `status: ACTIVE`) и из
подбора совпадений, но его inquiry по-прежнему виден продавцу.

**Осознанное решение:** suspension участника не трогает его объявления. Это два
независимых рычага — модерация аккаунта и модерация листинга; в таблице
`/manager/assets` у продавца с не-ACTIVE статусом показан бейдж, а скрыть
конкретное объявление можно отдельно (`Pause` / `Remove`). Автоматическое
снятие всех листингов сделало бы восстановление аккаунта необратимым.

### 6. `AuditLog` — append-only, закрытый набор действий

```prisma
model AuditLog {
  actorId    String
  action     AuditAction      // USER_SUSPENDED | … | ASSET_REMOVED
  targetType AuditTargetType  // USER | ASSET
  targetId   String
  meta       String?          // JSON: { label, from, to, reason }
  createdAt  DateTime
}
```

- `action` и `targetType` — enum'ы, а не строки: в лог нельзя попасть мусор из
  UI или из опечатки в вызывающем коде; набор действий известен заранее.
- `meta.label` — снимок читаемого имени цели на момент действия. Если цель
  потом переименуют, запись в логе останется понятной; живой fallback
  (`resolveTargetLabels`) подхватывает текущее имя, если снимка нет.
- Пишет только `createAuditLog` из `src/server/manager.ts`; обновления и
  удаления в репозитории не предусмотрены.

### 7. Менеджеры неприкосновенны

`target.role === "MANAGER" && status !== "ACTIVE"` → `{ ok: false }` с текстом
«Manager accounts cannot be suspended or deleted», запись в лог не создаётся.
Это закрывает и «заблокировать себя», и «выкинуть другого админа»: восстановление
(`ACTIVE`) при этом разрешено. Guard продублирован в UI — кнопки заблокированы.

Менеджер также не может перевести объявление в `DRAFT`: приватный черновик —
это состояние продавца, а не модерации (`moderationStatusValues`).

---

## Layers

```
app/ (routes)  →  server/<role>.ts (server actions)  →  lib/db/repositories/*
                                          ↘  lib/validation/*  (Zod)
                                  ↘  lib/auth/guards.ts  (requireUser / requireRole)
```

- Компоненты и страницы **никогда** не импортируют `prisma` напрямую.
- Репозитории возвращают plain domain-объекты из `src/types`, а не Prisma rows:
  `toDomain` отсекает `passwordHash` и любые Prisma-специфичные типы.
- Guards стоят и в layout (`/seller/layout.tsx`, `/buyer/layout.tsx`), и в
  каждой странице, и в каждом экшене — middleware не является единственной
  линией обороны.

---

## AI smart search (Task 08)

```
SmartSearchBar (client)  →  POST /api/smart-search  →  parseQuery()
                                                           ↘ createLlmClient() (fetch)
```

- **Провайдер — OpenAI Chat Completions через `fetch`, не Anthropic.** Задача
  сводится к извлечению JSON из текста: у OpenAI есть `response_format:
{"type":"json_object"}`, который убирает большую часть промпт-инжиниринга
  («верни только JSON» в system prompt остаётся как страховка). Anthropic
  потребовал бы того же Zod-guard плюс лишний round-trip на tool call без
  выигрыша. Провайдер меняется одной функцией `createLlmClient()`.
- **Почему `fetch`, а не SDK `openai`:** SDK стал бы единственной новой
  runtime-зависимостью проекта, а REST-вызов — это ~30 строк и тривиальный
  mock в тестах через `LlmClient`. `OPENAI_BASE_URL` позволяет подменить
  endpoint (Azure-совместимый шлюз, локальный mock в E2E-проверках).
- **LLM — недоверенный источник.** Ответ проходит `smartFiltersSchema`
  (`.strict()` — лишние ключи отбрасываются целиком, поэтому модель не может
  дописать в URL своё), `JSON.parse` с очисткой code fences и проверкой
  `priceMin <= priceMax`. Любой сбой, мусор или пустой объект даёт
  **degraded fallback**: исходная фраза идёт в `q` как обычный keyword-поиск,
  клиент показывает toast. Приложение не падает никогда.
- **`explanation` собирается локально** из уже провалидированных фильтров
  (`describeFilters`), а не генерируется моделью: текст обязан совпадать с
  реальным URL, иначе баннер будет врать пользователю.
- **Rate limit** — `lib/ai/rateLimit.ts`, 10 запросов/мин на пользователя
  (session id) или на IP для анонимов, in-memory Map с окном в 60 секунд.
  Это грубая защита от злоупотреблений, а не жёсткая квота: состояние живёт в
  процессе, сбрасывается при деплое и не разделяется между инстансами.
  Реальный потолок расходов — 15-секундный таймаут запроса к LLM в
  `llmClient.ts`.
- **Приватность:** наружу уходит только строка, которую пользователь сам
  ввёл в поле поиска — никаких записей, email или профилей. Сырой ответ
  модели логируется только при `NODE_ENV !== "production"`, API key читается
  исключительно на сервере и никогда не попадает в клиентский бандл.
- **`/api/smart-search` — единственный REST-эндпоинт проекта** (CONTEXT,
  правило 5): клиентский компонент не может вызвать server action, а
  `ai=1`/`exp=` в URL нужны, чтобы объяснение переживало refresh и шаринг
  ссылки.

## UI polish (Task 09)

### 8. Дизайн-токены: контраст важнее палитры

Цвета статусов и лицензий вынесены в `lib/badgeStyles.ts` и в
`globals.css`, потому что инлайн-Tailwind-классы расходятся между
страницами, а `--destructive` в дефолтной теме **не проходит AA** на
собственных тонах:

| Токен                                                      | Значение                   | Где применяется                                       |
| ---------------------------------------------------------- | -------------------------- | ----------------------------------------------------- |
| `--warning`                                                | `#fbbf24`                  | `PENDING`/`SUSPENDED`, amber уходит статусным смыслам |
| `--warning-foreground`                                     | `#0a0a0a`                  | текст на solid `--warning`                            |
| `--destructive-text`                                       | `#f87171`                  | текст/иконки на `*-tint` подложке                     |
| `--destructive-solid`                                      | `#dc2626`                  | solid-заливка с белым текстом                         |
| `--shadow-card`, `--shadow-card-hover`, `--shadow-popover` | oklch                      | глубина без колебания яркости                         |
| `--ease-soft`                                              | `cubic-bezier(.2,.8,.2,1)` | один easing для hover/появления                       |

Измеренные отношения контраста (текст на соответствующей 10% подложке,
AA требует 4.5:1):

| Элемент                   | Цвет                    | Контраст                 |
| ------------------------- | ----------------------- | ------------------------ |
| EMI                       | `sky-400` `#38bdf8`     | 7.24:1                   |
| PI                        | `violet-400` `#a78bfa`  | 5.82:1                   |
| MICA / CASP               | `fuchsia-400` `#e879f9` | 6.44:1                   |
| VASP                      | `rose-400` `#fb7185`    | 5.97:1                   |
| BANK                      | `cyan-400` `#22d3ee`    | 8.46:1                   |
| OTHER                     | `slate-400` `#94a3b8`   | 6.15:1                   |
| warning badge             | `#fbbf24` на 10%        | 9.07:1                   |
| destructive на 10% (было) | `#ef4444`               | 4.44:1 — **провал AA**   |
| destructive-text на 10%   | `#f87171`               | 5.82:1 (на 20% — 4.92:1) |
| solid destructive (было)  | белый на `#ef4444`      | 3.76:1 — **провал AA**   |
| solid-destructive         | белый на `#dc2626`      | 4.83:1                   |

Оба «провала» остались бы незаметными визуально, но ломают AA в
`Badge`/`Button`/`Toast`, поэтому исправлены в самих примитивах, а не в
call-site'ах. Лицензии намеренно не используют amber/emerald: эти цвета
заняты под `PENDING`/`SUSPENDED`/`PUBLISHED`.

### 9. Тёмная тема — единственная

`layout.tsx` всегда ставит `<html className="dark">`, поэтому в
`globals.css` нет отдельного `.dark`-блока: он был побайтно равен `:root`
и только создавал ложное впечатление, что тему можно переключить. Тёмная
тема — источник истины, `:root` совпадает с ней.

### 10. Мобильная навигация: Sheet, а не новый пакет

`ui/sheet.tsx` собран на `Dialog` из уже установленного `radix-ui` v1.6.7
(в этом пакете Dialog входит в unified-модуль), поэтому новая зависимость
не понадобилась. Ниже `md` горизонтальный nav скрывается, в шапке остаются
brand + кнопка меню; drawer фокусируется, ставит `aria-hidden` на `<main>`,
блокирует скролл body и закрывается через Escape, оверлей, кнопку закрытия
или переход по ссылке. На десктопе сессия видна явно: dropdown с email и
badge роли — раньше единственным признаком входа был текст кнопки Logout.

### 11. Ролевые nav — сетка, а не горизонтальный скролл

Полоса из 5 пунктов не помещалась в 375px и прятала пункты в невидимом
скролле. Ниже `sm` это 2-колоночная сетка (все пункты видны, скролла нет),
`sm..lg` — горизонтальная полоса, `lg` — sticky-колонка.

### 12. Таблицы: скролл вместо коллапса

Таблицы менеджера (8 колонок, 806–994px) не сворачиваются в карточки:
данные сравниваются по столбцам, и потеря колонки ломает задачу. Вместо
этого обёртка `Table` получила `role="region"`, `tabIndex={0}` и focus-ring
— обычный `overflow-x-auto` недоступен с клавиатуры (WCAG 2.1.1), а с
`tabIndex` стрелки панорамируют область. Замер: фокус на контейнере,
`scrollLeft` 0 → 120 за три `ArrowRight`. У каждой таблицы появился
`<caption>`: скринридер теперь слышит, что сравнивает.

### 13. Мелкие a11y-правки, найденные при прогоне

- Валидационные сообщения под textarea были видны, но не объявлялись:
  добавлены `aria-invalid` + `aria-describedby` с id (3 формы).
- `MarkReadButton` в icon-варианте объявлял счётчик дважды
  («Mark as read» + «Mark 3 inquiries as read») — теперь sr-only текст
  только там, где нет видимой подписи.
- Toast на каждую мутацию: `createAsset` возвращал `redirectTo` **до**
  `toast()`, поэтому публикация листинга была единственной мутацией без
  подтверждения; `signIn`/`registerAction` показывали ошибку только inline.

### 14. Что проверено и как

`npm test`, `tsc --noEmit`, `eslint`, `prettier --check`, `next build` — без
ошибок и предупреждений. Плюс headless-Chrome прогон через CDP (без новых
зависимостей) по 17 маршрутам в 375px и 1280px: 0 ошибок и 0 предупреждений в
консоли, 0 горизонтальных переполнений страницы. Отдельный прогон
входа-в-роль для трёх ролей. Известное ограничение Next.js: `notFound()`
отдаёт 200 с `<meta name="robots" content="noindex">` (корневой layout
стримит шапку, поэтому статус не успевает зафиксироваться) — сам 404-экран при
этом полноценный.

---

## Testing (Task 10)

```
test/globalSetup.ts          prisma db push --skip-generate --force-reset  (DATABASE_URL=file:./test.db)
        ↓
src/lib/db/repositories/assets.test.ts   45 tests — real SQLite, real Prisma
src/lib/validation/*.test.ts            127 tests — pure Zod
src/lib/ai/smartSearch.test.ts           17 tests — injected LlmClient
```

Три правила, которые определили структуру:

- **Тесты фильтров идут против настоящей БД, а не мока репозитория.** Мок
  повторяет ровно ту логику, которую мы хотим проверить, и всегда «зелёный»:
  опечатку в `where`/`orderBy` он не поймает. `assets.test.ts` создаёт 7
  активов, 2 продавцов и 2 покупателей, прогоняет каждый фильтр и комбинации,
  проверяет пагинацию вместе с `total`, сортировку, ownership (`findOwnedAsset`
  на чужом активе → `null`), счётчики инбокса продавца и входящие/исходящие
  inquiry. Тестовая БД — отдельный файл `prisma/test.db`, пересоздаётся перед
  прогоном; `fileParallelism: false`, потому что файлы делят одну схему.
- **AI не тестируется сетью.** `createLlmClient()` — единственная точка выхода,
  подменяется `LlmClient` в 17 тестах `parseQuery`, включая code fences, мусор,
  лишние ключи и таймаут.
- **Zod-тесты — это тесты контракта URL и форм**, а не покрытие строк: query string
  приходит с повторяющимися параметрами, CSV-списками, пустыми строками от
  сброшенных фильтров и мусором от ручного ввода. Каждый такой случай
  зафиксирован явно, включая `priceMin > priceMax` (ошибка указывает на поле
  `priceMin`) и запрет `MANAGER` при саморегистрации.

Тесты поймали два реальных бага, а не только подтвердили реализацию:

1. `markReadSchema`/`Inquiry` uniqueness — два сообщения от одного покупателя
   по одному активу падали на `P2002`; тест теперь требует двух покупателей и
   тем самым фиксирует ограничение «одно сообщение в направление».
2. `assetFiltersSchema` принимал `?jurisdiction=12`: проверка `length(2)` считала
   две цифры кодом страны. Заменено на `/^[A-Z]{2}$/` — и это **намеренно**
   оставляет возможность добавить новую страну без деплоя, в отличие от
   закрытого enum на пишущем пути (`JURISDICTIONS`).

## Known limitations

| #   | Ограничение                                                                  | Почему так                                        | Что делать при росте                                                                         |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | SQLite: один файл, нет конкурентных записей в проде, `LIKE` по JSON-массивам | Демо должно запускаться без инфраструктуры        | Перенос в Postgres: `text[]` + GIN/trgm, один скрипт миграции (ниже)                         |
| 2   | `%` и `_` в поиске работают как LIKE-метасимволы                             | SQLite не экранирует их внутри bind-параметра     | Для публичного поиска — raw-запрос с `ESCAPE '\'`; сейчас зафиксировано тестом как поведение |
| 3   | Rate limit AI — in-memory Map                                                | Нет Redis в демо; сбрасывается на рестарте/деплое | Upstash/Redis, ключ по userId                                                                |
| 4   | Один инвайт на пару `(asset, buyer)` в каждом направлении, без тредов        | Полноценная переписка — отдельная модель          | `InquiryThread` + `InquiryMessage`, миграция по `initiatorRole`                              |
| 5   | `notFound()` отдаёт HTTP 200 + `noindex` (streaming root layout)             | Поведение Next.js, не наш код                     | Вынесить 404-страницы в route group без стримащего layout                                    |
| 6   | Фильтрация по JSON-массивам идёт `LIKE` — медленно и не индексируется        | Для 20 демо-активов индекса не нужно              | Postgres `text[]` + GIN, либо join-таблицы                                                   |
| 7   | Нет e-mail подтверждения и восстановления пароля                             | Credentials provider без почты                    | Resend/Postmark + verify-token в `User`                                                      |
| 8   | Upload файлов (лицензии, аудит) отсутствует                                  | Файлы — вне scope демо                            | S3-compatible storage + подписанные URL                                                      |

## SQLite → Postgres: точная последовательность

Замена datasource в этом проекте — одна миграция схемы плюс две правки в
репозиториях, потому что доменный слой не знает про SQLite:

1. Создать базу (managed Postgres) и заменить `DATABASE_URL` на
   `postgresql://…?sslmode=require`. Больше ничего в коде править не нужно:
   Prisma-клиент абстрагирует драйвер.
2. `npx prisma migrate dev --name postgres-baseline` — миграция создаст
   таблицы заново. Данные из SQLite переносятся вручную (dump + `INSERT`), в
   демо их нет.
3. `BuyerProfile.jurisdictions` / `licenseTypes`: `String` → `String[]`
   (`text[]`). Доменный тип не меняется, но `parseJsonArray`/`JSON.stringify`
   в `repositories/users.ts` становятся лишними — удалить вместе с тестами на
   них.
4. Фильтры по массивам: `contains` → `array_contains` (Prisma) или GIN-индекс.
   До этого LIKE работать не будет.
5. `AuditLog` получил бы настоящий FK на полиморфную цель — либо две таблицы,
   либо nullable `targetUserId`/`targetAssetId` с `CHECK`.
6. Проверить `prisma/test.db` → на CI оставить `file:` (быстро) или
   поднять `postgres` сервис для честного покрытия `array_contains`.

## Что бы я сделал иначе

- **Массивы как join-таблицы с первого дня.** JSON-строка была сознательным
  упрощением ради SQLite, но `BuyerProfile` — это по сути many-to-many
  (`jurisdictions`, `licenseTypes`), и на Postgres `text[]` лучше не превращать
  обратно. Если бы модель проектировалась заново, я бы сразу сделал
  `BuyerJurisdiction(buyerId, code)` — это же и индекс, и нормализованный
  фильтр, и никакого `LIKE` по JSON.
- **Inquiries как тред с первого дня.** Ограничение «одно сообщение в
  направление» — это не экономия, а запрет переписки, который мы потом будем
  ломать миграцией. Правильнее было `InquiryThread(assetId, buyerId)` +
  `InquiryMessage(threadId, authorRole, body, readAt)`.
- **Деньги как `Decimal`, а не `Int`.** `Int` в копейках хватает до ~90 млн
  единиц, но добавление валют с двумя знаками (JPY) или дробных ставок потребует
  миграции типа. Для демо `Int` честнее, для прода — нет.
- **`auth.ts` без самописной VASP-логики.** `trustHost: true` и повторный
  запрос статуса пользователя на каждый запрос — правильно для демо, но в
  проде это два лишних запроса к БД на страницу; кэш статуса в edge-совместимом
  хранилище с TTL 60с дал бы тот же эффект при меньшей нагрузке.
- **E2E на Playwright сразу.** CDP-прогон закрыл визуальные и a11y-проверки
  дёшево, но его пришлось писать вручную (`CDP` + `fetch` + скрипты в `/tmp`).
  Playwright дал бы те же проверки декларативно и с трассировкой, ценой одной
  dev-зависимости.
