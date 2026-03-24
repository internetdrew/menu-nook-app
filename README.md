# MenuNook

![MenuNook Banner](./public/og.png)

A simple menu platform for publishing clean, mobile-friendly menus that are easy to update and easy to browse by link or QR code.

## Why MenuNook?

Many menu tools feel heavier than they need to be. They either turn a simple menu into a bloated product experience, or they make basic updates harder than they should be.

MenuNook is built around a simpler idea:

- Menus should be easy to publish
- Menus should be easy to update
- Menus should be easy to open and browse on a phone

The goal is not to turn menus into a complicated media product. The goal is to give businesses a clean menu they can manage without friction.

## The Challenge

Even simple menu software can get messy quickly. The challenge here is building something that stays fast, clear, and easy to maintain while still handling real business needs like categories, item updates, link sharing, and QR access.

Performance still matters. A menu should load quickly, feel obvious on a phone, and stay usable even in less-than-ideal network conditions.

A few things I'm considering as I build:

- Keeping the public menu lightweight and mobile-friendly
- Making updates feel immediate and low-friction for operators
- Using caching and efficient fetching so menus stay responsive
- Preserving a clear editing model as menus grow
- Making link and QR sharing feel automatic, not bolted on

In all, the overall experience I want to build treats:

- Text as primary
- Optional visuals as an enhancement
- Speed and clarity as core product features

## Features

- Build and manage menus with categories, item names, descriptions, and prices.
- Publish clean public menu pages that work well on phones.
- Share each menu by direct link or printable QR code.
- Update menu content quickly from a phone or laptop.
- Keep menus clear, fast, and easy to browse.

## Screenshots

![MenuNook dashboard](public/menu-nook-screenshot-0.png)
![MenuNook dashboard - Create menu](public/menu-nook-screenshot-1.png)
![MenuNook dashboard - Categories page](public/menu-nook-screenshot-2.png)
![MenuNook dashboard - Dynamic Category page](public/menu-nook-screenshot-3.png)
![MenuNook dashboard - Public menu page](public/menu-nook-screenshot-4.png)
![MenuNook feedback dialog](public/menu-nook-screenshot-5.png)
![MenuNook add item dialog](public/menu-nook-screenshot-6.png)
![MenuNook collapsing sidebar view ](public/menu-nook-screenshot-7.png)
![MenuNook category deletion dialog ](public/menu-nook-screenshot-8.png)

## Tech Stack

- Frontend: Vite + React 19 with TypeScript, React Router 7, shadcn/ui (Radix), Tailwind CSS, and dnd-kit for drag-and-drop ordering.
- Data layer: tRPC (client + server) paired with TanStack Query for caching and mutations.
- Backend: Express with tRPC handlers, Supabase for auth/database/storage, and Stripe for billing.
- Testing: Vitest with Testing Library (React, DOM, user-event), jsdom test environment, and MSW for API mocking.
- Tooling: ESLint, Prettier, tsx, nodemon, concurrently, and Tailwind merge utilities.
