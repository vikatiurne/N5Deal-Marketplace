# Architecture — N5Deal Marketplace

Документ постепенно дополняется по мере выполнения задач (`docs/tasks/`).
Правило: если решение принято и влияет на модель данных или структуру кода —
оно здесь.

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

| Критерий | `Inquiry` + `initiatorRole` | Отдельная `SellerMessage` |
| --- | --- | --- |
| Смысл домена | Совпадает с CONTEXT: «contact request between buyer and seller about an asset» — направление не часть определения | Второй тип сообщения с той же семантикой |
| Метаданные | Один `readAt`, одно место для аудита и badge-ов | Две колонки прочтения, две модели в UI |
| Ответ продавца | `initiatorRole = SELLER` по тому же `(asset, buyer)` не конфликтует с уникальным индексом | Отдельная таблица |
| Миграция на Postgres | Одна таблица | Две таблицы + join для «диалога» |
| Ограничения | Нельзя отправить два сообщения в одну сторону по одной паре | Можно, но тогда нужен thread-модель |

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