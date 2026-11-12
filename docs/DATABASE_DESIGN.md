# Database Design — RouteWise (PS7)

## 1. Execution Order

Run in Supabase SQL Editor in this order:
1. `seed/00_starter_example.sql` — creates `tasks` table (prerequisite)
2. `seed/ps7_delivery_dispatch.sql` — creates all PS7 tables, seed data, and DB functions

Both files are safe to run multiple times (they `DROP IF EXISTS` before creating).

---

## 2. Schema Overview

```
zones (id PK)
  │
  ├──< riders.home_zone (FK)
  │
  └──< deliveries.zone_id (FK)

riders (id PK)
  │
  ├──< rider_shifts.rider_id (FK)
  │
  ├──< deliveries.rider_id (FK, nullable)
  │
  └──< delivery_attempts.rider_id (FK)

deliveries (id PK)
  │
  └──< delivery_attempts.delivery_id (FK)
```

---

## 3. Table Definitions

### 3.1 zones

```sql
CREATE TABLE zones (
  id        text PRIMARY KEY,       -- 'Z1', 'Z2', 'Z3', 'Z4', 'Z5'
  name      text NOT NULL,          -- 'Velachery', 'Adyar', etc.
  pincodes  text NOT NULL           -- comma-separated pincodes string
);
```

**Seed data:**
| id | name | pincodes |
|---|---|---|
| Z1 | Velachery | 600042, 600088 |
| Z2 | Adyar | 600020, 600041 |
| Z3 | Anna Nagar | 600040, 600101 |
| Z4 | T Nagar | 600017 |
| Z5 | Tambaram | 600045, 600059 |

---

### 3.2 riders

```sql
CREATE TABLE riders (
  id          text PRIMARY KEY,          -- 'R01' .. 'R08'
  name        text NOT NULL,
  phone       text NOT NULL,
  home_zone   text NOT NULL REFERENCES zones(id),
  vehicle     text NOT NULL CHECK (vehicle IN ('bike','scooter','van')),
  capacity    int  NOT NULL CHECK (capacity > 0),  -- max concurrent active deliveries
  is_active   boolean NOT NULL DEFAULT true
);
```

**Capacity definition:** Maximum number of deliveries with status `assigned` OR `out_for_delivery` at the same time. NOT total deliveries per day.

**Seed data:**
| id | name | home_zone | vehicle | capacity | is_active |
|---|---|---|---|---|---|
| R01 | Suresh Kumar | Z1 | bike | 6 | true |
| R02 | Lakshmi Priya | Z1 | scooter | 5 | true |
| R03 | Mohammed Irfan | Z2 | bike | 6 | true |
| R04 | Deepa R | Z3 | scooter | 5 | true |
| R05 | Vignesh M | Z3 | van | 12 | true |
| R06 | Kavya S | Z4 | bike | 6 | true |
| R07 | Ramesh B | Z5 | van | 12 | true |
| R08 | Gokul P | Z2 | bike | 6 | **false** |

---

### 3.3 rider_shifts

```sql
CREATE TABLE rider_shifts (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rider_id    text NOT NULL REFERENCES riders(id),
  shift_date  date NOT NULL,
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  UNIQUE (rider_id, shift_date)   -- one shift per rider per day
);
```

**Today's shifts (seed):**
| rider_id | shift_date | start_time | end_time |
|---|---|---|---|
| R01 | today | 08:00 | 17:00 |
| R03 | today | 09:00 | 18:00 |
| R04 | today | 08:00 | 14:00 |
| R05 | today | 10:00 | 20:00 |
| R06 | today | 12:00 | 21:00 |
| R07 | today | 08:00 | 17:00 |

**Note:** R02 has NO shift today. R08 is inactive. Both correctly block assignment.

---

### 3.4 deliveries

```sql
CREATE TABLE deliveries (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_ref       text NOT NULL UNIQUE,          -- 'ORD-5001', etc.
  customer_name   text NOT NULL,
  address         text NOT NULL,
  zone_id         text NOT NULL REFERENCES zones(id),
  parcel_size     text NOT NULL CHECK (parcel_size IN ('small','medium','large')),
  is_cod          boolean NOT NULL DEFAULT false,
  cod_amount      int NOT NULL DEFAULT 0,
  delivery_date   date NOT NULL,
  time_window     text NOT NULL CHECK (time_window IN ('morning','afternoon','evening')),
  rider_id        text REFERENCES riders(id),    -- NULL = unassigned
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','assigned','out_for_delivery','delivered','failed','returned')),
  attempts        int NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**Status flow:**
```
pending → assigned → out_for_delivery → delivered
                                     → failed → (reschedule) → pending
                                              → (3 attempts)  → returned
```

**Key deliveries in seed:**

| order_ref | zone | status | rider | attempts | notes |
|---|---|---|---|---|---|
| ORD-5006 | Z1 | pending | null | 0 | Needs assignment |
| ORD-5007 | Z1 | pending | null | 0 | Needs assignment |
| ORD-5009 | Z2 | pending | null | 0 | Adyar pending |
| ORD-5010 | Z2 | pending | null | 0 | Adyar pending |
| ORD-5012 | Z3 | pending | null | 0 | Anna Nagar pending |
| ORD-5013 | Z3 | pending | null | 0 | Anna Nagar pending |
| ORD-5014 | Z4 | pending | null | 0 | T Nagar pending |
| ORD-5015 | Z4 | pending | null | 0 | T Nagar pending |
| ORD-5017 | Z5 | pending | null | 0 | Tambaram pending |
| ORD-4990 | Z1 | failed | R01 | 1 | Can reschedule |
| ORD-4991 | Z2 | failed | R03 | 2 | Can reschedule |
| ORD-4992 | Z3 | failed | R04 | 3 | CANNOT reschedule (3 attempts) |

---

### 3.5 delivery_attempts

```sql
CREATE TABLE delivery_attempts (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  delivery_id   bigint NOT NULL REFERENCES deliveries(id),
  rider_id      text NOT NULL REFERENCES riders(id),
  attempted_at  timestamptz NOT NULL DEFAULT now(),
  outcome       text NOT NULL CHECK (outcome IN (
                  'delivered','customer_not_home','wrong_address','refused','rescheduled'
                )),
  note          text
);
```

**Note:** `rider_id` in `delivery_attempts` is `NOT NULL` per schema. However, `reschedule_delivery()` inserts with `d.rider_id` which may be null — this will cause a constraint error if the delivery has no rider at reschedule time. Tool implementation should handle this gracefully.

**Actual check:** Looking at the seed SQL for `reschedule_delivery()`:
```sql
insert into delivery_attempts (delivery_id, rider_id, outcome, note)
values (d.id, d.rider_id, 'rescheduled', ...);
```
If `d.rider_id` is null, this will violate `NOT NULL`. All failed deliveries in seed have a non-null `rider_id` at time of failure, so it works for the seed data. Tool must not reschedule a delivery whose `rider_id` is already null.

---

## 4. Database Functions

### 4.1 assign_delivery

```sql
assign_delivery(p_delivery_id bigint, p_rider_id text) RETURNS json
```

**Validations (in order):**
1. Delivery exists
2. Delivery status is `'pending'`
3. Delivery attempts < 3
4. Rider exists
5. Rider `is_active = true`
6. Rider `home_zone = delivery.zone_id` ← cross-zone block
7. Rider has a row in `rider_shifts` for `delivery.delivery_date`
8. Rider's active delivery count < `rider.capacity`

**On success:**
- Updates `deliveries SET rider_id = r.id, status = 'assigned'`
- Returns: `{ delivery_id, order_ref, rider, rider_load, capacity }`

**On failure:**
- Raises PostgreSQL EXCEPTION with descriptive message
- Supabase SDK surfaces this as `error.message`
- Tool throws `new Error(error.message)` → Gemini explains it

### 4.2 reschedule_delivery

```sql
reschedule_delivery(p_delivery_id bigint, p_new_date date, p_time_window text) RETURNS json
```

**Validations (in order):**
1. Delivery exists
2. Delivery status is `'failed'`
3. Delivery attempts < 3
4. `p_new_date >= current_date`
5. `p_time_window IN ('morning','afternoon','evening')`

**On success:**
- Updates `deliveries SET delivery_date = p_new_date, time_window = p_time_window, status = 'pending', rider_id = null`
- Inserts `delivery_attempts` row with outcome = `'rescheduled'`
- Returns: `{ delivery_id, order_ref, new_date, time_window, attempts_used }`

---

## 5. Row Level Security

All 5 tables have RLS enabled with **no policies** (deny-all for anon). Access requires the `service_role` key, which is what `getSupabase()` uses via `SUPABASE_SECRET_KEY`.

```sql
GRANT usage ON schema public TO service_role;
GRANT all ON all tables IN schema public TO service_role;
GRANT all ON all sequences IN schema public TO service_role;
GRANT execute ON function assign_delivery(bigint, text) TO service_role;
GRANT execute ON function reschedule_delivery(bigint, date, text) TO service_role;
```

---

## 6. Useful Queries for Tools

### Get pending deliveries for a zone on a date
```sql
SELECT id, order_ref, customer_name, address, zone_id, parcel_size,
       is_cod, cod_amount, delivery_date, time_window, attempts
FROM deliveries
WHERE zone_id = $1 AND delivery_date = $2 AND status = 'pending'
-- optional: AND time_window = $3
ORDER BY time_window, id;
```

### Get available riders (active, have shift on date, in zone)
```sql
SELECT r.id, r.name, r.vehicle, r.capacity, s.start_time, s.end_time,
       (SELECT count(*) FROM deliveries d
        WHERE d.rider_id = r.id AND d.status IN ('assigned','out_for_delivery')) AS active_count
FROM riders r
JOIN rider_shifts s ON s.rider_id = r.id AND s.shift_date = $2
WHERE r.home_zone = $1 AND r.is_active = true;
```

### Get rider current load
```sql
SELECT count(*) AS active_count, r.capacity,
       r.capacity - count(*) AS remaining
FROM deliveries d
JOIN riders r ON r.id = d.rider_id
WHERE d.rider_id = $1 AND d.status IN ('assigned','out_for_delivery')
GROUP BY r.capacity;
```

### Get failed deliveries
```sql
SELECT d.id, d.order_ref, d.customer_name, d.address, d.zone_id,
       d.delivery_date, d.time_window, d.attempts, d.rider_id,
       r.name AS rider_name
FROM deliveries d
LEFT JOIN riders r ON r.id = d.rider_id
WHERE d.status = 'failed'
-- optional: AND d.zone_id = $1
ORDER BY d.delivery_date DESC, d.id;
```

### Dashboard stats
```sql
SELECT
  count(*) FILTER (WHERE status = 'pending')          AS pending,
  count(*) FILTER (WHERE status = 'assigned')         AS assigned,
  count(*) FILTER (WHERE status = 'out_for_delivery') AS out_for_delivery,
  count(*) FILTER (WHERE status = 'delivered')        AS delivered,
  count(*) FILTER (WHERE status = 'failed')           AS failed,
  count(*)                                             AS total
FROM deliveries
WHERE delivery_date = current_date;
```

---

## 7. How to Call DB Functions from Supabase SDK

```typescript
// assign_delivery
const { data, error } = await getSupabase()
  .rpc('assign_delivery', {
    p_delivery_id: deliveryId,   // bigint
    p_rider_id: riderId           // text
  });
if (error) throw new Error(error.message);
return data; // the JSON object returned by the function

// reschedule_delivery
const { data, error } = await getSupabase()
  .rpc('reschedule_delivery', {
    p_delivery_id: deliveryId,
    p_new_date: newDate,          // 'YYYY-MM-DD'
    p_time_window: timeWindow     // 'morning'|'afternoon'|'evening'
  });
if (error) throw new Error(error.message);
return data;
```

