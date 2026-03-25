# Snaapi Homes

A minimal real estate listing app powered by Snaapi. Browse properties with rich
filtering, save favorites, and watch new listings appear in real-time via SSE.

**Features demonstrated:** filtering, SSE streaming, relations with `?include`,
multi-claim auto-injection, public access, role-based access control.

> The demo app is published as a standalone repo with a container image:\
> **Repo:** https://github.com/snaapi/demo-snaapi-homes\
> **Package:**
> https://github.com/snaapi/demo-snaapi-homes/pkgs/container/demo-snaapi-homes

---

## Setup

### 1. Import Resources

**Via Web Console:**

1. Navigate to `http://localhost:5173/console/registry`
2. Click "Import"
3. Upload `snaapi-homes-resources.yaml`
4. Confirm import

**Via API:**

```bash
curl -X POST http://localhost:5173/v1/_registry/import \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/x-yaml" \
  --data-binary @snaapi-homes-resources.yaml
```

### 2. Import Sample Properties

Import 100 sample property listings from the included CSV file:

**Via Web Console:**

1. Navigate to `http://localhost:5173/console/resources/properties`
2. Click "Import Records" in the toolbar
3. Upload `sample-properties.csv`
4. Verify the column mappings in the preview, then confirm the import

**Via API:**

```bash
curl -X POST "http://localhost:5173/console/api/resources/PROPERTIES_RESOURCE_ID/import-records?action=preview" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -F "file=@sample-properties.csv"

# Review the preview response, then import:
curl -X POST "http://localhost:5173/console/api/resources/PROPERTIES_RESOURCE_ID/import-records?action=import" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -F "file=@sample-properties.csv" \
  -F 'mappings=[{"originalColumnName":"title","targetField":"title"},{"originalColumnName":"description","targetField":"description"},{"originalColumnName":"price","targetField":"price"},{"originalColumnName":"bedrooms","targetField":"bedrooms"},{"originalColumnName":"bathrooms","targetField":"bathrooms"},{"originalColumnName":"sqft","targetField":"sqft"},{"originalColumnName":"property_type","targetField":"property_type"},{"originalColumnName":"status","targetField":"status"},{"originalColumnName":"image_url","targetField":"image_url"},{"originalColumnName":"address","targetField":"address"},{"originalColumnName":"city","targetField":"city"},{"originalColumnName":"state","targetField":"state"},{"originalColumnName":"zip_code","targetField":"zip_code"}]'
```

### 3. Create the "agent" Role

In the Snaapi console, create a role called `agent`. This role is used for users
who manage property listings.

### 4. Run the Demo App

Run the demo frontend using the published container image. The app requires the
`API_BASE` environment variable to point to your Snaapi instance.

Since both the demo app and Snaapi run in containers, `localhost` won't resolve
to the host machine. Use `host.docker.internal` instead (available on macOS and
Windows):

```bash
docker run -p 4000:80 -e API_BASE=http://host.docker.internal:5173 ghcr.io/snaapi/demo-snaapi-homes
```

Then open http://localhost:4000 in your browser.

> **Note:** Add `http://localhost:4000` to the `CORS_ORIGINS` environment
> variable in your Snaapi configuration so the demo app can make API requests.

**On Linux**, `host.docker.internal` may not be available by default. Use
`--add-host` to enable it:

```bash
docker run -p 4000:80 -e API_BASE=http://host.docker.internal:5173 --add-host=host.docker.internal:host-gateway ghcr.io/snaapi/demo-snaapi-homes
```

---

## Resources Created

| Resource     | Description                    |
| ------------ | ------------------------------ |
| `properties` | Real estate property listings  |
| `favorites`  | User-saved favorite properties |

---

## API Endpoints

### Properties

| Method | Endpoint                | Auth   | Description            |
| ------ | ----------------------- | ------ | ---------------------- |
| GET    | `/v1/properties`        | public | List/search properties |
| GET    | `/v1/properties/:id`    | public | Get a single property  |
| POST   | `/v1/properties`        | agent  | Create a listing       |
| PATCH  | `/v1/properties/:id`    | agent  | Update own listing     |
| DELETE | `/v1/properties/:id`    | agent  | Delete own listing     |
| GET    | `/v1/properties/stream` | user   | SSE stream of changes  |

### Favorites

| Method | Endpoint            | Auth | Description        |
| ------ | ------------------- | ---- | ------------------ |
| POST   | `/v1/favorites`     | user | Save a favorite    |
| GET    | `/v1/favorites`     | user | List own favorites |
| DELETE | `/v1/favorites/:id` | user | Remove a favorite  |

---

## Example Queries

### Filtering

```bash
# Houses under $500k with 3+ bedrooms
GET /v1/properties?property_type__eq=house&price__lte=500000&bedrooms__gte=3

# Condos in Austin
GET /v1/properties?property_type__eq=condo&city__ilike=austin

# Active listings sorted by price (low to high)
GET /v1/properties?status__eq=active&_sort=price

# Most expensive first, limit 10
GET /v1/properties?_sort=-price&_limit=10

# Search by address keyword
GET /v1/properties?address__ilike=%oak%

# Filter by agent name
GET /v1/properties?agent_name__ilike=%jane%
```

### Relations

```bash
# Include property details with favorites
GET /v1/favorites?include=property
```

### Real-Time Streaming (SSE)

```bash
# Stream all property changes
curl -N http://localhost:5173/v1/properties/stream \
  -H "Authorization: Bearer USER_TOKEN"

# Stream only new listings and price updates
curl -N "http://localhost:5173/v1/properties/stream?events=created,updated" \
  -H "Authorization: Bearer USER_TOKEN"

# Stream with specific fields only
curl -N "http://localhost:5173/v1/properties/stream?fields=title,price,city" \
  -H "Authorization: Bearer USER_TOKEN"
```

### Creating a Listing (as agent)

```bash
curl -X POST http://localhost:5173/v1/properties \
  -H "Authorization: Bearer AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Charming 3BR Craftsman",
    "description": "Beautifully updated home with original hardwood floors.",
    "price": 425000,
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1850,
    "property_type": "house",
    "status": "active",
    "image_url": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    "address": "742 Evergreen Terrace",
    "city": "Austin",
    "state": "TX",
    "zip_code": "78701"
  }'
```

Note: `listed_by` (user ID) and `agent_name` (user's display name) are both
automatically injected from the agent's JWT — no need to send them.

### Saving a Favorite (as user)

```bash
curl -X POST http://localhost:5173/v1/favorites \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "PROPERTY_UUID"
  }'
```

Note: `user_id` is automatically injected from the user's JWT.

---

## Roles & Permissions

| Role     | Properties                         | Favorites                  |
| -------- | ---------------------------------- | -------------------------- |
| `public` | read                               | -                          |
| `user`   | read                               | create, read, delete (own) |
| `agent`  | create, read, update, delete (own) | -                          |

**Auto-injection (check constraints):**

- When an **agent** creates a property:
  - `listed_by` is auto-set to their user ID (`claim: id`)
  - `agent_name` is auto-set to their display name (`claim: name`)
- When a **user** saves a favorite, `user_id` is auto-set to their user ID
- Agents can only update/delete their own listings (filtered by `listed_by`)
- Users can only see/delete their own favorites (filtered by `user_id`)

This demonstrates **multi-claim auto-injection** — a single create action can
inject values from multiple JWT claims, keeping the request body clean while
ensuring data integrity.

---

## Testing the SSE Stream

1. Open `http://localhost:4000` in one browser tab and sign in
2. Open a second tab or use curl to create a new property as an agent
3. Watch the live activity feed in the first tab update in real-time

---

## Testing Checklist

- [ ] Import resources via YAML
- [ ] Import sample properties via CSV (100 records)
- [ ] Create `agent` role in console
- [ ] Browse properties without auth (public access)
- [ ] Filter by price, bedrooms, property type, city
- [ ] Sort by price ascending/descending
- [ ] Create a listing as an agent (verify `listed_by` and `agent_name`
      auto-injected)
- [ ] Update own listing as an agent
- [ ] Verify agent cannot update another agent's listing
- [ ] Save a favorite as a user (verify `user_id` auto-injected)
- [ ] List own favorites with `?include=property`
- [ ] Delete a favorite
- [ ] Connect to SSE stream, create a property, see it appear live
