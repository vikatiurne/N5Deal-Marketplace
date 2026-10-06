/** manager zone strings (uk): nav, overview, members, listings, audit, moderation. */
export const managerUk = {
  // Navigation
  "manager.nav.overview": "Огляд",
  "manager.nav.users": "Учасники",
  "manager.nav.assets": "Оголошення",
  "manager.nav.audit": "Журнал аудиту",
  "manager.nav.seeMarketplace": "Переглянути публічний маркетплейс →",

  // Zone metadata
  "manager.home.meta.title": "Огляд менеджера",
  "manager.users.meta.title": "Учасники · Менеджер",
  "manager.assets.meta.title": "Оголошення · Менеджер",
  "manager.audit.meta.title": "Журнал аудиту · Менеджер",

  // Loading skeleton
  "manager.loading.overview": "Завантаження огляду платформи",

  // Shared moderation controls
  "manager.moderate": "Модерувати",
  "manager.moderation": "Модерація",
  "manager.filters.apply": "Застосувати",
  "manager.filters.reset": "Скинути",
  "manager.filters.resetAll": "Скинути фільтри",
  "manager.filters.allStatuses": "Усі статуси",
  "manager.toast.failed": "Дію не виконано",

  // Moderation outcome names — reused as toast titles and audit entries
  "manager.action.userSuspended": "Учасника призупинено",
  "manager.action.userReactivated": "Учасника активовано",
  "manager.action.userSoftDeleted": "Учасника м’яко видалено",
  "manager.action.assetPublished": "Оголошення опубліковано",
  "manager.action.assetPaused": "Оголошення призупинено",
  "manager.action.assetRemoved": "Оголошення видалено",

  // Overview
  "manager.home.title": "Огляд платформи",
  "manager.home.subtitle":
    "Модеруєте {email} · кожна дія нижче потрапляє до журналу аудиту.",
  "manager.home.membersCard": "Учасники",
  "manager.home.listingsCard": "Оголошення",
  "manager.home.inquiriesCard": "Запити",
  "manager.home.attentionCard": "Потребує уваги",
  "manager.home.membersCardNote":
    "{sellers} активних продавців · {buyers} активних покупців",
  "manager.home.listingsCardNote":
    "{published} опублікованих · {draft} чернеток · {paused} призупинених · {removed} видалених",
  "manager.home.inquiriesCardNote":
    "{fromBuyers} покупець → продавець · {fromSellers} продавець → покупець",
  "manager.home.attentionCardNote":
    "призупинених або м’яко видалених учасників",
  "manager.home.matrixTitle": "Учасники за роллю та статусом",
  "manager.home.matrixDescription":
    "Натисніть на число, щоб відкрити фільтровану таблицю модерації.",
  "manager.home.manageMembers": "Керувати учасниками",
  "manager.home.total": "Разом",
  "manager.home.assetMatrixTitle": "Оголошення за статусом",
  "manager.home.assetMatrixDescription":
    "Видалення оголошення ховає його з маркетплейсу, але воно залишається видимим тут.",
  "manager.home.manageListings": "Керувати оголошеннями",
  "manager.home.recentMembersTitle": "Останні реєстрації",
  "manager.home.recentMembersDescription": "Останні {limit} акаунтів.",
  "manager.home.recentListingsTitle": "Останні оголошення",
  "manager.home.recentListingsDescription": "Останні {limit} активів.",
  "manager.home.inquiriesFooter":
    "Усього запитів: {total} · {unread} ще не прочитані продавцями.",

  // Members
  "manager.users.title": "Учасники",
  "manager.users.subtitle":
    "{count} акаунтів · призупинюйте або м’яко видаляйте учасників, що порушують правила. Кожна дія фіксується.",
  "manager.users.subtitle_one":
    "{count} акаунт · призупинюйте або м’яко видаляйте учасників, що порушують правила. Кожна дія фіксується.",
  "manager.users.subtitle_few":
    "{count} акаунти · призупинюйте або м’яко видаляйте учасників, що порушують правила. Кожна дія фіксується.",
  "manager.users.subtitle_many":
    "{count} акаунтів · призупинюйте або м’яко видаляйте учасників, що порушують правила. Кожна дія фіксується.",
  "manager.users.emptyTitle": "Жоден учасник не відповідає цим фільтрам",
  "manager.users.emptyDescription":
    "Очистіть текст пошуку або розширте фільтри за роллю та статусом.",
  "manager.users.caption":
    "Усі користувачі платформи — дії записуються до журналу аудиту.",
  "manager.users.company": "Компанія",
  "manager.users.joined": "Дата реєстрації",

  // Listings
  "manager.assets.title": "Оголошення",
  "manager.assets.subtitle":
    "{count} активів від усіх продавців · видалення оголошення ховає його з маркетплейсу, але не видаляє.",
  "manager.assets.subtitle_one":
    "{count} актив від усіх продавців · видалення оголошення ховає його з маркетплейсу, але не видаляє.",
  "manager.assets.subtitle_few":
    "{count} активи від усіх продавців · видалення оголошення ховає його з маркетплейсу, але не видаляє.",
  "manager.assets.subtitle_many":
    "{count} активів від усіх продавців · видалення оголошення ховає його з маркетплейсу, але не видаляє.",
  "manager.assets.emptyTitle": "Жодне оголошення не відповідає цим фільтрам",
  "manager.assets.emptyDescription":
    "Очистіть текст пошуку або розширте фільтри за ліцензією, юрисдикцією та статусом.",
  "manager.assets.caption":
    "Кожне оголошення, зокрема чернетки та неопубліковані активи.",
  "manager.assets.titleColumn": "Назва",
  "manager.assets.seller": "Продавець",
  "manager.assets.license": "Ліцензія",
  "manager.assets.jurisdiction": "Юрисдикція",
  "manager.assets.listed": "Дата розміщення",

  // Audit log
  "manager.audit.title": "Журнал аудиту",
  "manager.audit.subtitle":
    "{count} зафіксованих дій · записи лише додаються — їх ніколи не редагують і не видаляють.",
  "manager.audit.subtitle_one":
    "{count} зафіксована дія · записи лише додаються — їх ніколи не редагують і не видаляють.",
  "manager.audit.subtitle_few":
    "{count} зафіксовані дії · записи лише додаються — їх ніколи не редагують і не видаляють.",
  "manager.audit.subtitle_many":
    "{count} зафіксованих дій · записи лише додаються — їх ніколи не редагують і не видаляють.",
  "manager.audit.actionLabel": "Дія",
  "manager.audit.allActions": "Усі дії",
  "manager.audit.targetLabel": "Ціль",
  "manager.audit.allTargets": "Усі цілі",
  "manager.audit.targetUser": "Учасник",
  "manager.audit.targetAsset": "Оголошення",
  "manager.audit.memberActions": "Дії з учасниками",
  "manager.audit.listingActions": "Дії з оголошеннями",
  "manager.audit.emptyTitle": "Записів журналу аудиту ще немає",
  "manager.audit.emptyDescription":
    "Помодеруйте учасника або оголошення — запис з’явиться тут одразу.",
  "manager.audit.byActor": "виконав {email}",
  "manager.audit.totalsNav": "Підсумки дій",

  // Member row actions
  "manager.userActions.aria": "Дії для {email}",
  "manager.userActions.reactivate": "Активувати",
  "manager.userActions.suspend": "Призупинити",
  "manager.userActions.softDelete": "М’яко видалити",
  "manager.userActions.locked": "Заблоковано",
  "manager.userActions.lockedHint":
    "Акаунти менеджерів не можна призупиняти або видаляти",
  "manager.userActions.suspendTitle": "Призупинити {email}?",
  "manager.userActions.suspendDescription":
    "Користувача негайно завершить сеанс, і акаунт не зможе увійти знову, доки менеджер його не активує. Його оголошення та запити збережено.",
  "manager.userActions.suspendConfirm": "Призупинити учасника",
  "manager.userActions.deleteTitle": "М’яко видалити {email}?",
  "manager.userActions.deleteDescription":
    "Акаунт більше не зможе увійти й зникне з каталогу покупців та підбору. Нічого не видаляється: оголошення й запити залишаються в базі даних, їх можна відновити.",
  "manager.userActions.deleteConfirm": "М’яко видалити учасника",
  "manager.userActions.reactivateTitle": "Активувати {email}?",
  "manager.userActions.reactivateDescription":
    "Акаунт знову отримує повний доступ, зокрема до каталогу покупців.",
  "manager.userActions.reactivateConfirm": "Активувати учасника",

  // Listing row actions
  "manager.assetActions.view": "Переглянути",
  "manager.assetActions.aria": "Модерувати {title}",
  "manager.assetActions.publish": "Опублікувати",
  "manager.assetActions.reinstatePublish": "Відновити й опублікувати",
  "manager.assetActions.pause": "Призупинити",
  "manager.assetActions.removeSoft": "Видалити (м’яко)",
  "manager.assetActions.removeTitle": "Видалити «{title}»?",
  "manager.assetActions.removeDescription":
    "Оголошення зникає з публічного маркетплейсу, але залишається в цій таблиці та в кабінеті продавця. Його можна відновити пізніше.",
  "manager.assetActions.removeConfirm": "Видалити оголошення",
  "manager.assetActions.pauseTitle": "Призупинити «{title}»?",
  "manager.assetActions.pauseDescription":
    "Під час призупинення оголошення не опубліковане. Продавець будь-коли може відновити його самостійно.",
  "manager.assetActions.pauseConfirm": "Призупинити оголошення",

  // Filters
  "manager.userFilter.placeholder": "Email, компанія чи ім’я…",
  "manager.userFilter.allRoles": "Усі ролі",
  "manager.assetFilter.placeholder": "Назва або опис…",
  "manager.assetFilter.licenseType": "Тип ліцензії",
  "manager.assetFilter.jurisdiction": "Юрисдикція",
};
