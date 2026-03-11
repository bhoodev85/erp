# End-to-end flow (NestJS + MongoDB + Kafka)

This document maps your requested journey:

1. Admin clicks **Sync**
2. Fetch **Meta Catalog**
3. Store in **MongoDB + Cache**
4. User browses
5. Add to cart
6. Create order
7. Generate payment link
8. User pays
9. Payment webhook
10. Order confirmed
11. WhatsApp notification

---

## Suggested NestJS modules

- `CatalogSyncModule`
  - Triggered by admin
  - Pulls Meta catalog API data
  - Upserts products in MongoDB
  - Publishes catalog-updated events to Kafka
  - Refreshes Redis cache

- `CatalogModule`
  - Browse/search APIs
  - Reads from cache first, DB fallback

- `CartModule`
  - Add/remove/update cart items
  - Stores user cart in MongoDB (or Redis with periodic persistence)

- `OrderModule`
  - Converts cart to order
  - Creates immutable order snapshot (price/title/image at purchase time)
  - Status machine: `PENDING_PAYMENT -> PAID -> CONFIRMED`

- `PaymentModule`
  - Generates payment link via provider SDK/API
  - Handles webhook callback
  - Validates signature + idempotency

- `NotificationModule`
  - Sends WhatsApp confirmation after order is confirmed

- `KafkaModule`
  - Shared producer/consumer clients
  - Topics for async boundaries

---

## MongoDB collections

- `products`
  - `metaProductId` (unique)
  - `title`, `description`, `images`, `price`, `currency`, `stock`, `isActive`
  - `syncVersion`, `updatedAt`

- `carts`
  - `userId`
  - `items[]: { productId, qty, unitPrice }`
  - `updatedAt`

- `orders`
  - `orderNo` (unique)
  - `userId`
  - `items[]: { productId, titleSnapshot, qty, unitPrice }`
  - `subtotal`, `tax`, `total`
  - `status` (`PENDING_PAYMENT`, `PAID`, `CONFIRMED`, `FAILED`)
  - `payment: { provider, paymentLink, paymentRef, paidAt }`

- `webhook_events`
  - `providerEventId` (unique)
  - `type`, `payload`, `processed`, `createdAt`

- `outbox_events`
  - Reliable event publishing table/collection for Kafka
  - `topic`, `key`, `payload`, `published`

---

## Kafka topics

- `catalog.synced`
  - Emitted after successful sync

- `order.created`
  - Emitted when order moves to pending payment

- `payment.link.generated`
  - Emitted after payment URL creation

- `payment.received`
  - Emitted by webhook processor after verified payment

- `order.confirmed`
  - Emitted after order finalization

- `notification.whatsapp.send`
  - Consumed by notification worker

---

## API contract (example)

- `POST /admin/catalog/sync`
  - Starts sync job

- `GET /catalog/products?search=&page=&limit=`
  - Browse products

- `POST /cart/items`
  - Add item to cart

- `POST /orders`
  - Create order from cart

- `POST /payments/:orderId/link`
  - Generate payment link

- `POST /payments/webhook`
  - Payment provider callback

---

## Critical implementation notes

1. **Idempotent webhook handling**
   - Store incoming event ID in `webhook_events` with unique index.
   - If duplicate event arrives, return `200 OK` without reprocessing.

2. **Order confirmation should be transactional**
   - Update order status to `PAID/CONFIRMED` once.
   - Publish Kafka message through outbox pattern to avoid lost events.

3. **Do not trust client-side prices**
   - Recalculate totals from server-side data before order creation.

4. **Cache strategy**
   - Cache product list/details in Redis with TTL.
   - Invalidate or refresh cache on each catalog sync.

5. **Observability**
   - Correlation IDs for sync, order, and payment journey.
   - Audit trail for status transitions.

---

## Minimal sequence (runtime)

1. Admin calls `/admin/catalog/sync`.
2. Sync service fetches Meta catalog and upserts Mongo products.
3. Sync service warms Redis and emits `catalog.synced`.
4. User browses products (`cache -> DB fallback`).
5. User adds products to cart.
6. User creates order (`PENDING_PAYMENT`).
7. Payment link generated and returned to user.
8. User pays at provider page.
9. Provider sends webhook.
10. Webhook verifies signature, applies idempotent update, emits `payment.received`.
11. Order service confirms order, emits `order.confirmed`.
12. Notification service sends WhatsApp message.

---

## Recommended indexes

- `products.metaProductId` unique
- `orders.orderNo` unique
- `orders.userId + createdAt`
- `carts.userId` unique
- `webhook_events.providerEventId` unique
- `outbox_events.published + createdAt`

---

## NestJS implementation starter (pseudo)

```ts
// payment webhook handler pseudo
async handleWebhook(dto: ProviderWebhookDto, signature: string) {
  verifySignatureOrThrow(dto.rawBody, signature);

  const inserted = await this.webhookRepo.insertIfNotExists({
    providerEventId: dto.eventId,
    type: dto.type,
    payload: dto,
    processed: false,
  });

  if (!inserted) return; // duplicate event

  if (dto.type === 'payment.success') {
    await this.orderService.markPaid(dto.orderRef, dto.paymentRef);
    await this.outbox.publish('payment.received', {
      orderRef: dto.orderRef,
      paymentRef: dto.paymentRef,
    });
  }

  await this.webhookRepo.markProcessed(dto.eventId);
}
```

If you want, next step I can generate a full NestJS folder scaffold (`modules`, `schemas`, `dto`, `kafka producers/consumers`, and `docker-compose` for Mongo + Kafka + Redis) in this repository.
