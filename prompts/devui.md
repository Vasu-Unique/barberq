# BarberQ: Smart queues. Better grooming.

Build **BarberQ**, a clean, modern, responsive platform that replaces paper waiting lists at barber shops with digital tokens, live queue tracking, estimated wait times, and automatic customer alerts.

It has two experiences that share one brand and one queue data source:
- **Customer app**: find a salon, join the queue, get a token, track your turn live.
- **Admin dashboard**: barbers and owners manage the queue, customers, services, and settings.

**The core rule:** when a barber updates the queue in the admin dashboard, the customer's position, wait time, and notifications update to match.

## Tech Stack
React, Tailwind CSS, TanStack Router, TanStack Query, React Toastify, Lucide icons. Use reusable components and a clean, scalable folder structure. Use realistic sample data stored in local storage, structured so a real backend and real-time events can be added later.

## Brand and Design
Premium, minimal SaaS look. Rounded cards (12–16px), subtle shadows, clear typography (Inter or Plus Jakarta Sans), and subtle transitions. Keep contrast accessible.

| Role | Colour |
|---|---|
| Primary (headers, nav, active states) | Deep Ocean Teal `#007C84` |
| Secondary buttons, hover | Vibrant Aqua `#1CA39E` |
| Subtle backgrounds, highlighted cards | Soft Ice Mint `#D9F2F4` |
| Clean surfaces | Crisp White `#F8FAFC` / white |
| Primary CTA buttons | Sunset Coral `#E55B3C` |
| Notifications, queue highlights | Marigold Gold `#DDA027` |
| Errors, urgent alerts | Terracotta Red `#C83E3B` |
| Primary text | Deep Charcoal `#1A2426` |
| Secondary text | Urban Slate `#68737A` |
| Borders, dividers | Cool Mist `#DCE3E6` |

## Routes
**Customer:** `/`, `/salons`, `/salon/:id`, `/queue/:id`, `/my-token`, `/login`
**Admin:** `/admin/login`, `/admin/dashboard`, `/admin/queue`, `/admin/customers`, `/admin/services`, `/admin/settings`

---

## Phase 1: Project Setup and Initial UI

**Goal:** a working foundation that every later phase builds on.

- Set up the project with the full tech stack, Tailwind theme (brand colours, fonts, radius, shadows), and TanStack Router with all routes above as placeholder pages.
- Create a clean folder structure (components, routes, hooks, data, utils).
- Build the shared UI kit: buttons, cards, badges (Waiting, Serving, Completed, Cancelled), inputs, modal, confirmation dialog, empty state, loader, and toast setup.
- Build both layouts: a customer layout (simple top header and footer) and an admin layout (fixed sidebar, top bar, collapsible on mobile). Keep them visually distinct but on-brand.
- Create the **shared queue store**: salons, services, tokens, and customers with realistic sample data, persisted in local storage and exposed through TanStack Query hooks (join queue, call next, complete, skip, cancel, add walk-in).
- Write the queue logic once: people ahead counts only waiting or serving customers, and wait time equals the remaining time of the current service plus the durations of those ahead (falling back to a default duration). It must stay correct after cancellations, skips, and completions.

**Done when:** the app runs, every route loads inside the right layout, the UI kit is in place, and the queue store works with persistent sample data.

---

## Phase 2: Customer-Focused UI

**Goal:** a simple, mobile-first experience where joining a queue takes only a few taps.

- **Landing page (`/`):** header (logo, Home, Explore Salons, How It Works, Login, Get a Token). Hero with the headline "Skip the wait. Get your perfect cut.", the supporting text, a *Find a Salon* CTA, a *How It Works* secondary CTA, and a visual of a digital token with live wait status. Add four feature blocks (Digital Token, Live Tracking, Estimated Wait, Smart Notifications), a 4-step How It Works, and a footer.
- **Explore salons (`/salons`):** salon cards with image, name, address, hours, people waiting, estimated wait, and availability. Include search by name and location, a filter by availability, a sort by distance or wait time, and *View Details* and *Join Queue* buttons.
- **Salon details (`/salon/:id`):** cover image, rating, contact, hours, services with prices, live queue status, and a *Join Queue* CTA.
- **Join queue flow:** generate a unique token, show a success screen (token number, salon, date and time, people ahead, estimated wait), and a *Track My Queue* CTA. Block duplicate active tokens for the same customer at the same salon.
- **Live tracking (`/queue/:id`):** the most important customer screen. A large token card, status badge, position, people ahead, people waiting, estimated wait, and progress indicator. Four states: *3 ahead – waiting*, *2 ahead – approaching*, *1 ahead – you're next!*, *0 ahead – it's your turn*. Show last updated time, a refresh button, salon contact, and a *Cancel Token* option with a confirmation dialog.
- **Notifications (React Toastify):** triggered by real queue changes: joined, position updated, approaching, you're next, your turn, and token cancelled.
- **My token (`/my-token`) and login (`/login`)** with form validation.

**Done when:** a customer can go from landing to a live token without dead ends, looks good at 375px and up, and sees queue changes reflected in real time.

---

## Phase 3: Admin Panel Experience

**Goal:** fast, clear queue control for barbers, with changes flowing to customers instantly.

- **Admin login and layout:** sidebar (Dashboard, Queue Management, Customers, Services, Settings, Logout). The top bar shows the salon name, date and time, notification icon, and profile. Hamburger menu on mobile.
- **Dashboard:** summary cards (42 customers today, 8 waiting, 34 served, 18 min average wait), a customer activity chart, queue status overview, recent customers, current queue preview, and a quick link to manage the queue.
- **Queue management (the key screen):** stats for waiting, serving, completed, and cancelled. A queue table with token, customer, service, joined time, estimated wait, status, and actions. It becomes cards on small screens. Actions: **Call Next Customer** (prominent button), Start Service, Complete Service, Skip (with confirmation), Cancel Token (with confirmation), and Add Walk-in. Each action recalculates the queue, updates the stats, and notifies the customer. Include an empty state for when no one is waiting.
- **Customers:** table with name, phone, token, service, visit date, and status, plus search, status filter, customer details, and visit history.
- **Services:** cards with name, description, duration, price, and availability. Add, edit, delete, and enable or disable, using a modal form. Sample services: Haircut (20 min), Beard Trim (15), Haircut + Beard (35), Hair Wash (15), Hair Styling (25).
- **Settings:** salon name, address, contact, opening and closing hours, working days, average service duration, maximum queue capacity, and a queue availability toggle, all with save and validation.

**Done when:** every admin button works, destructive actions ask for confirmation, tables adapt to mobile without horizontal scroll, and a barber action in the admin queue updates the customer's token screen immediately.

---

## Quality Bar
- Every button and link works, with no placeholders or dead ends.
- All forms validate, with loading, empty, and error states plus toast feedback.
- Works at 375px, 768px, 1280px, and 1440px and up.
- Looks like a polished, production-quality SaaS product, not a demo.

**BarberQ – Smart queues. Better grooming.**
