RULES

don't implement any backend funcationalities
don't intilize any database
focus on the initial strucutre
follow the guidelines as per standard

BarberQ: Smart queues. Better grooming.
Build BarberQ, a clean, modern, responsive platform that replaces paper waiting lists at barber shops with digital tokens, live queue tracking, estimated wait times, and automatic customer alerts.

It has two experiences that share one brand and one queue data source:

Customer app: find a salon, join the queue, get a token, track your turn live.
Admin dashboard: barbers and owners manage the queue, customers, services, and settings.
The core rule: when a barber updates the queue in the admin dashboard, the customer's position, wait time, and notifications update to match.

Tech Stack
React, Tailwind CSS, TanStack Router, TanStack Query, React Toastify, Lucide icons. Use reusable components and a clean, scalable folder structure. Use realistic sample data stored in local storage, structured so a real backend and real-time events can be added later.

Brand and Design
Premium, minimal SaaS look. Rounded cards (12–16px), subtle shadows, clear typography (Inter or Plus Jakarta Sans), and subtle transitions. Keep contrast accessible.

Role	Colour
Primary (headers, nav, active states)	Deep Ocean Teal #007C84
Secondary buttons, hover	Vibrant Aqua #1CA39E
Subtle backgrounds, highlighted cards	Soft Ice Mint #D9F2F4
Clean surfaces	Crisp White #F8FAFC / white
Primary CTA buttons	Sunset Coral #E55B3C
Notifications, queue highlights	Marigold Gold #DDA027
Errors, urgent alerts	Terracotta Red #C83E3B
Primary text	Deep Charcoal #1A2426
Secondary text	Urban Slate #68737A
Borders, dividers	Cool Mist #DCE3E6
Routes
Customer: /, /salons, /salon/:id, /queue/:id, /my-token, /login Admin: /admin/login, /admin/dashboard, /admin/queue, /admin/customers, /admin/services, /admin/settings

Phase 1: Project Setup and Initial UI
Goal: a working foundation that every later phase builds on.

Set up the project with the full tech stack, Tailwind theme (brand colours, fonts, radius, shadows), and TanStack Router with all routes above as placeholder pages.
Create a clean folder structure (components, routes, hooks, data, utils).
Build the shared UI kit: buttons, cards, badges (Waiting, Serving, Completed, Cancelled), inputs, modal, confirmation dialog, empty state, loader, and toast setup.
Build both layouts: a customer layout (simple top header and footer) and an admin layout (fixed sidebar, top bar, collapsible on mobile). Keep them visually distinct but on-brand.
Create the shared queue store: salons, services, tokens, and customers with realistic sample data, persisted in local storage and exposed through TanStack Query hooks (join queue, call next, complete, skip, cancel, add walk-in).
Write the queue logic once: people ahead counts only waiting or serving customers, and wait time equals the remaining time of the current service plus the durations of those ahead (falling back to a default duration). It must stay correct after cancellations, skips, and completions.
Done when: the app runs, every route loads inside the right layout, the UI kit is in place, and the queue store works with persistent sample data.

