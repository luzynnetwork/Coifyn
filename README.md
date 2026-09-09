# Coifyn — Salon & Barbershop Platform

Sibling product to **Luzyn** (hospitality). Where Luzyn's unit of supply is the *room*,
Coifyn's unit of supply is the **chair** — an individual stylist's time, not the shop's.

Both problems this product exists to solve come from the same mistake the market makes:
everyone books "the salon" when what the customer actually wants is *a specific person,
at a specific time, doing a specific cut*.

## Problem 1 — "I go for a specific barber but don't get him"

- **Per-stylist calendars.** A booking is held against a person, not a shop.
- **Live queue.** Real wait time for *your* stylist ("Ali: 2 ahead, ~35 min"), not a shop average.
- **Absence / running-late alerts** before the customer leaves home, with real choices:
  wait, take his next open slot, or take a stand-in the shop vouches for.
- **Follow-your-stylist.** He changes shops; the customer's history and next booking follow him.
- **Cut record.** Guard numbers, fade type, product, photos — so a stand-in can actually
  reproduce the last cut instead of guessing.

## Problem 2 — "New city, can't find the right salon"

- **Search by result, not by shop.** Skin fade, beard sculpt, balayage — find who nearby
  actually delivers that cut.
- **Portfolio-first profiles.** The stylist's verified work *is* the listing; the shop is metadata.
- **"Match my usual."** Carry the cut profile between cities and get ranked stylists who do it well.
- **Per-stylist trust signals** from verified post-visit photos only — never per-shop star averages.

## Shape

Mirrors the Luzyn architecture (see `../hotel-management`): multi-tenant SaaS, a management
console, a shop console, a customer app, and a discovery marketplace — so auth, tenancy and
the shared UI package port across.

## Status

Room created 2026-09-07. Nothing built yet.

## Name

`coifyn.com` was unregistered and no existing software/company used the name at the time of
selection (checked 2026-09-07 via Verisign RDAP + web search). **This is not trademark
clearance** — run a USPTO/IPO search before any public use.
"# Coifyn" 
