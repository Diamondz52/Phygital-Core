# FSD: Phygital Core v17

## Слои и границы

```text
app/                          Next.js App Router: только адаптеры, layouts, boundaries
pages/README.md               Не содержит Pages Router маршрутов
src/
  app/                        Providers, styles, composition of layouts
  pages/<screen>/              Композиция экрана, публичный index.ts
  widgets/<block>/             Крупные блоки UI
  features/<action>/           Пользовательские действия и формы
  entities/<entity>/           Единые типы, domain services и модели
  shared/                     UI, storage, API, hooks, config, utilities
```

Зависимости: `app → pages → widgets → features → entities → shared`. Можно пропускать слои вниз. Внутри slice используются относительные импорты. Между slices — только public API. Features и widgets не импортируют соседние slices своего слоя. При необходимости совместной композиции взаимодействие передаётся через callbacks/render props.

`entities/platform` — агрегат синхронизированного mock-документа, а не второй источник команд/пользователей. Он потребляет явные `@x/platform` API сущностей. `feedbackService` потребляет только необходимые `@x/feedback` типы. Runtime-циклы запрещены. `app/` отделён от FSD-слоя `src/app`, чтобы буквальный `src/pages` не стал маршрутизатором фреймворка; в root `pages/` нет исполняемых файлов. Все 16 маршрутов остаются App Router маршрутами. Совместимость FSD и Next.js требует учитывать их конфликтующие имена каталогов: [официальное руководство FSD](https://feature-sliced.design/docs/guides/tech/with-nextjs).

## Данные

- `entities/user`: User, AuthUser (расширение User), authService, AuthProvider, нормализация поиска.
- `entities/team`: Team, TeamMember и presentation helpers.
- `entities/tournament`: Tournament и автоматически рассчитанный статус.
- `entities/tournament-application`: только заявки команд на турниры.
- `entities/team-invitation`: pending/accepted/declined/cancelled.
- `entities/notification`: уведомления участников и капитанов.
- `entities/feedback`: обращения и их сервис.
- `entities/admin-log`: журнал операций.
- `entities/platform`: один PlatformState, подписки и атомарные операции по доменам.

`createPlatformActions` только собирает user/team/invitation/notification/tournament operations. Общие проверки капитанских/админских прав и журналирование находятся в `actionContext`. Все платформенные изменения сохраняются в одном IndexedDB-документе; событие и BroadcastChannel обновляют экраны после успешного commit. Приглашение принимается вместе с изменением состава и уведомлениями, не отдельными массивами на страницах.

Аккаунты и сессия сохраняются через `shared/api/localDataSource` и `shared/storage/browserStorage`. Настройки языка/темы используют тот же storageService. Только storage-модуль обращается к localStorage напрямую. Это локальная demo-авторизация, не защищённый backend: demo-пароли в браузере нельзя применять для реальных пользователей.

## Три разные механики

1. Создание команды — немедленное добавление Team; пользователь становится капитаном. Модерации и сущности TeamApplication нет.
2. Приглашение — ответ получателя; состав изменяется только при принятии.
3. Турнирная заявка — капитан выбирает свою команду; решение принимает администратор.

При загрузке старого платформенного документа неизвестные поля не попадают в актуальный PlatformState. Существующие команды, приглашения, уведомления, обращения и турнирные заявки не сбрасываются. Следующий commit сохраняет документ без устаревшего поля.

## UI и разработка

Общие Button/Modal/Select/ConfirmDialog находятся в `shared/ui`. Модальные окна используют один portal, блокировку фона, focus trap, Escape и стабильные зоны header/content/footer. Форма профиля и смена пароля — отдельные features; страницы не содержат их бизнес-логику. Расчёты периодов/метрик/графика вынесены из dashboard в чистые функции.

```bash
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run check:architecture
npm run test:feedback
npm run build
npm run dev
```

Архитектурный checker читает AST и проверяет разрешение alias, направления слоёв, public API, отсутствие runtime-циклов. Тесты исполняют реальный TypeScript сервисов с изолированным storage и минимальным React hook-host; они не меняют пользовательские браузерные данные. Browser smoke-проверки описаны в аудите.
