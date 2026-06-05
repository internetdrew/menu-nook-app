# MenuNook

![MenuNook Banner](./public/og.png)

A simple live menu for local food sellers who need a clean, shareable menu page without building a full website or online checkout.

MenuNook helps sellers create a mobile-friendly menu with items, prices, photos, categories, availability, ordering info, and QR sharing.

Menus are easy to update, easy to share, and easy for customers to browse from a phone.

## Why MenuNook?

Many small food sellers do not need a full ecommerce store. They just need one reliable place where customers can see what they sell, what it costs, what is available, and how to order.

Without that, menus often end up scattered across PDFs, screenshots, social posts, DMs, or outdated links. That creates friction for both sellers and customers.

MenuNook is built around a around the idea that a public menu page should be useful without becoming a full website or checkout system.

So...

- Sellers should be able to publish a clean menu in minutes
- Customers should have one place to see what's current
- Updates should be fast enough to make anytime
- Sharing should work naturally by link or QR code

The goal is not to turn a simple menu into a complicated product. The goal is to help local sellers look current, organized, and easy to buy from.

## Product Focus

MenuNook is designed for local food sellers who want a lightweight menu presence online, including home bakers, pop-ups, caterers, meal prep sellers, small cafes, delis, and other local sellers who do not need a full website.

The product focuses on three core jobs:

1. Create the menu
   - Add categories, items, descriptions, prices, photos, and availability.

2. Keep it current
   - Update prices, reorder sections, change item details, and mark items sold out without rebuilding or resharing a new menu.
3. Share and publish it
   - Give customers one clean mobile page they can open by link or QR code, with searchable business and menu details.

## The Challenge

The main challenge is keeping the product simple while still supporting real business needs.

Menu software can get bloated quickly. MenuNook needs to stay focused: fast to set up, obvious to edit, and clear for customers. The editing experience should feel lightweight, while the public menu should feel polished and dependable.

Key product considerations:

- Keeping the public menu fast, mobile-friendly, and easy to browse
- Making menu updates feel immediate and low-friction
- Supporting real seller needs like categories, photos, prices, sold-out states, and ordering instructions
- Giving each paid menu a searchable public page with useful metadata
- Making QR and link sharing feel native to the product
- Keeping the system flexible enough for different seller types without becoming a full website builder

The overall experience treats:

- Text as primary
- Photos as helpful context
- Speed as a product feature
- Clarity as the main customer benefit
- Searchability and shareability as part of the menu’s value

## Features

- Create and manage menus with categories, items, descriptions, prices, and photos
- Reorder categories and items with drag-and-drop
- Mark items as available or sold out
- Publish a clean mobile menu page for customers
- Share menus by direct link or QR code
- Download QR codes for print or in-person use
- Add business details, ordering info, and location/service area context
- Guide sellers through SEO-friendly title and description fields
- Keep public menus simple, fast, and easy to browse
- Support Stripe billing for paid menu publishing

## Screenshots (Before the Redesign)

These screenshots are from when I was thinking of this more as a utility than an experience:

![MenuNook dashboard](public/menu-nook-screenshot-0.png)
![MenuNook dashboard - Create menu](public/menu-nook-screenshot-1.png)
![MenuNook dashboard - Categories page](public/menu-nook-screenshot-2.png)
![MenuNook dashboard - Dynamic Category page](public/menu-nook-screenshot-3.png)
![MenuNook dashboard - Public menu page](public/menu-nook-screenshot-4.png)
![MenuNook feedback dialog](public/menu-nook-screenshot-5.png)
![MenuNook add item dialog](public/menu-nook-screenshot-6.png)
![MenuNook collapsing sidebar view ](public/menu-nook-screenshot-7.png)
![MenuNook category deletion dialog ](public/menu-nook-screenshot-8.png)

## Screenshots (After the Redesign)

## Tech Stack

- Frontend: Vite, React 19, TypeScript, React Router 7, shadcn/ui, Radix UI, Tailwind CSS
- Interactions: dnd-kit for drag-and-drop menu ordering
- Data layer: tRPC with TanStack Query for type-safe fetching, caching, and mutations
- Backend: Express with tRPC handlers
- Auth, database, and storage: Supabase
- Billing: Stripe subscriptions and webhook handling
- Testing: Vitest, Testing Library, jsdom, user-event, and MSW
