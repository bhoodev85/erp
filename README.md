# ERP Commerce Flow API (NestJS + MongoDB + Kafka)

Runnable NestJS API implementing this flow:

1. Admin sync catalog
2. User browse catalog
3. Add to cart
4. Create order
5. Generate payment link
6. Payment webhook
7. Order confirmed + WhatsApp notification

## Requirements

- Node 20+
- MongoDB (default: `mongodb://127.0.0.1:27017/erp`)
- Kafka (default broker: `127.0.0.1:9092`) - optional at runtime; outbox stores unpublished events when unavailable.

## Environment

```bash
export MONGODB_URI=mongodb://127.0.0.1:27017/erp
export KAFKA_BROKERS=127.0.0.1:9092
export PORT=3000
```

## Install and run

```bash
npm install
npm run build
npm start
```

## API quick start

```bash
# 1) Sync products
curl -X POST http://localhost:3000/admin/catalog/sync

# 2) Browse products
curl "http://localhost:3000/catalog/products?page=1&limit=10"

# 3) Add product to cart
curl -X POST http://localhost:3000/cart/items \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","productId":"<mongo_product_id>","qty":1}'

# 4) Create order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1"}'

# 5) Generate payment link
curl -X POST http://localhost:3000/payments/<orderNo>/link

# 6) Webhook payment success
curl -X POST http://localhost:3000/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt-1","type":"payment.success","orderNo":"<orderNo>","paymentRef":"pay-1001"}'
```

## Notes

- Webhook events are idempotent via unique `providerEventId` in `webhook_events`.
- Order events are persisted in `outbox_events` and then emitted to Kafka when available.
