# Real-time DEX Data Aggregator

This service aggregates real-time token data from multiple DEX APIs (DexScreener, Jupiter), providing a single, fast, and real-time-updated source via both a REST API and a WebSocket.

The project fulfills a technical task to build a service that intelligently fetches, merges, caches, and pushes live data updates, emulating the data flow seen on modern crypto discovery platforms.

---

## 🚀 Live Demo & Features

**Live API Endpoint:** [`https://real-time-aggregator.onrender.com/tokens`](https://real-time-aggregator.onrender.com/tokens)

**Demo Video:** `[[Link to your 1-2 minute YouTube/Loom video]](https://www.youtube.com/watch?v=k8xf9nJj0L0)`

### ✨ Core Features

* **Multi-Source Aggregation:** Fetches data from 2+ real DEX APIs (DexScreener, Jupiter).
* **Intelligent Merging:** Duplicates are merged, prioritizing the data from the source with higher liquidity.
* **Efficient Caching:** Uses **Redis** with a 30-second TTL to reduce API spam and ensure fast responses.
* **Exponential Backoff:** Automatically retries failed API requests with exponential backoff to handle rate limiting.
* **Real-time Updates:** Uses **WebSockets** (`socket.io`) to push live price and volume changes to all connected clients.
* **Optimized Broadcasting:** A background poller checks for data changes and broadcasts *only the diffs*, not the full dataset, to save bandwidth.
* **Full API Control:** The REST API supports sorting, filtering, and cursor-based pagination.
* **Tested:** Includes 12+ unit tests for core logic (sorting, merging, pagination).

---

## 🏛️ Architecture & Data Flow

This service is designed for high performance and real-time data freshness.

1.  **Initial Load:** A client's first-time load is handled by the **REST API** (`GET /tokens`). This endpoint checks the **Redis Cache**.
2.  **Cache Miss:** If the cache is empty, the service fetches from all external APIs (DexScreener, Jupiter), intelligently merges the data, and saves the result in Redis for 30 seconds.
3.  **Cache Hit:** If data is in the cache, it's returned instantly.
4.  **Real-time Connection:** The client also connects to the **WebSocket**. Upon connection, it receives the full, current token list (`initialTokenList`).
5.  **Live Updates:** A background poller on the server fetches new data every 15 seconds. It "diffs" this new data with the old data and broadcasts *only the changes* (`tokenUpdates`) to all connected clients.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js with TypeScript
* **Framework:** Express.js
* **Real-time:** Socket.io
* **Cache:** Redis (using `ioredis`)
* **HTTP Client:** Axios (with `axios-retry` for backoff)
* **Testing:** Jest & ts-jest
* **Deployment:** Render

---

## Endpoints

### REST API

#### `GET /tokens`

Fetches a paginated and sorted list of aggregated tokens.

**Query Parameters:**

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `q` | `string` | `SOL` | The search query for tokens. |
| `sortBy` | `string` | `volume_sol` | Sort key. Can be `volume_sol`, `price_1hr_change`, or `market_cap_sol`. |
| `sortOrder` | `string` | `desc` | Sort order. Can be `asc` or `desc`. |
| `limit` | `number` | `20` | Number of items per page. |
| `cursor` | `string` | `null` | The `token_address` of the last item from the previous page. |

**Example Request:**
`GET /tokens?sortBy=price_1hr_change&sortOrder=desc&limit=10`

---

### WebSocket Events

**Connection URL:** `https://real-time-aggregator.onrender.com`

**Client Receives:**

* **`initialTokenList`**: Fired once on connection. Sends the complete current list of all tokens.
* **`tokenUpdates`**: Fired whenever changes are detected. Sends an array of *updated tokens only*, containing only the fields that changed (price, volume, etc.).

---

## 🏃‍♂️ How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-url]
    cd real-time-aggregator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root and add your Redis URL:
    ```.env
    REDIS_URL="redis://user:password@host:port"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The server will be available at `http://localhost:3000`.
