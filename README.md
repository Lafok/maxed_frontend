# Maxed Messenger (Client)

![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite)

The modern, responsive web client for **Maxed Messenger**.
Built with **React 18** and **TypeScript**, focusing on real-time performance and optimistic UI updates.

> **Backend Repository:** [https://github.com/Lafok/maxed](https://github.com/Lafok/maxed)
> *(Go there for System Architecture, Docker Compose, and API documentation)*

---

## 🚀 Key Frontend Features

This isn't just a UI wrapper; it handles complex asynchronous flows:

*   **WebSocket Management:** Custom `WebSocketService` singleton (based on `@stomp/stompjs`) handles connection stability, heartbeats, and race conditions.
*   **Reactive State:** Real-time updates for Chat Lists, Messages, and User Presence without page reloads.
*   **Optimized Rendering:** Uses `useLayoutEffect` for smooth scroll restoration (bi-directional infinite scroll logic).
*   **Debounced Actions:** Smart handling of "Typing..." indicators and "Read" receipts to prevent API flooding.
*   **Secure Media:** Handles direct file uploads and renders content via time-limited S3 signatures.

---

## 📸 Interface

| **Instant Messaging** | **Media & Search** |
|:---:|:---:|
| ![Typing Demo](https://github.com/user-attachments/assets/2d8a22ca-c80c-4f53-8d1d-44b9176bb27f) | ![Media Demo](https://github.com/user-attachments/assets/0d13843b-e7b3-4966-a66b-cd0b78cdeca7) |
| *Real-time typing indicators & status* | *Seamless media uploads & search* |

*(Note: These GIFs demonstrate the full system in action)*

---

## 🛠 Tech Stack

*   **Core:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS, CLSX
*   **Network:** Axios (Interceptors for JWT), StompJS (WebSockets)
*   **Date Handling:** date-fns

---

## ⚡ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Lafok/maxed_frontend
    cd maxed_frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run locally:**
    ```bash
    npm run dev
    ```
    *Ensure the [Backend](https://github.com/Lafok/maxed) is running on port 8080.*

---

## 🔌 Configuration

The app connects to `http://localhost:8080` by default.
To change the API URL, update `src/services/api.ts` or create a `.env` file:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws