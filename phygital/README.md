# Phygital Core

Адаптивный демонстрационный frontend платформы фиджитал-турниров, выполненный по предоставленным макетам и ТЗ. Проект сохраняет исходный стек: React 19, TypeScript 5.9, Next.js App Router API через Vinext, Vite 8 и Cloudflare Workers.

## Требования

- Node.js 22.13 или новее;
- npm 10 или новее.

## Установка и запуск

```bash
npm install
npm run dev
```

Локальный адрес по умолчанию: `http://localhost:5173`.

Проверка production-сборки и качества кода:

```bash
npm run build
npm run lint
npm run start
```

## Маршруты

Публичные: `/`, `/tournaments`, `/tournaments/[id]`, `/teams`, `/rules`, `/faq`, `/contacts`, `/privacy`, `/profile`.

Административные: `/admin`, `/admin/users`, `/admin/teams`, `/admin/teams/applications`, `/admin/tournaments`, `/admin/tournament-applications`, `/admin/logs`.

Вход в демонстрационном режиме открывается по кнопке профиля. После входа активируется роль администратора, поэтому доступны и личный кабинет, и защищённая админ-панель. Выход возвращает гостевую роль. Состояние сессии, тема и язык сохраняются локально.

## Данные и конфигурация

- типизированные модели: `types/`;
- начальные данные: `lib/data/mock.ts`;
- демонстрационное сохранение заявок: `lib/storage/repository.ts` (IndexedDB);
- язык: `lib/i18n/dictionary.ts`;
- единые контакты: `lib/config.ts`;
- дизайн-система и адаптивность: `app/globals.css`.

Проект не содержит production API и реальной аутентификации. Формы и административные действия демонстрируют сценарии интерфейса и локальное сохранение там, где оно требуется.

## OpenAI Sites и локальный fallback

Официальные файлы `.openai/hosting.json` и `build/sites-vite-plugin.ts` включены в исходники. В `vite.config.ts` они подключаются условно: если один или оба файла отсутствуют до регистрации сайта, локальные `dev` и `build` продолжают работать без D1/R2. Фиктивные идентификаторы проектов не используются; Vinext и Cloudflare Worker-конфигурация сохранены.

## Изображения

`public/hero.png` — специально созданная для этого прототипа декоративная hero-иллюстрация. Остальная графика интерфейса построена CSS и иконками Lucide.
