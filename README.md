# ❤️ Love-Mart (WeChat Mini Program)

> A personalized, gamified couple interaction space.
> 专为情侣打造的互动空间，记录爱意，兑换惊喜。

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![WeChat](https://img.shields.io/badge/platform-WeChat_Mini_Program-green.svg)

## ✨ Highlights (特色功能)

### 1. 🎨 Cool Silver UI (高冷银灰主题)
Refactored entire UI with a modern **"Cool Silver / Ice Blue"** aesthetic.
-   **Glassmorphism**: Translucent cards and blurred backgrounds.
-   **Aurora Gradients**: Subtle, premium color transitions.
-   **Minimalist Dashboard**: Replaced clutter with clean, functional dashboards.

### 2. 💑 Anniversary Widget (纪念日组件)
A prominent, animated widget on the main page to track your days together.
-   **Visual**: Left-aligned bold day count (36px) paired with a pulsating heart icon.
-   **Animation**: CSS-only heartbeat effect.
-   **Dynamic**: Real-time calculation starting from **2025.10.15**.

### 3. 📝 Mission Control (任务中心)
Gamified task management system.
-   **Assign Tasks**: Partner A can assign tasks to Partner B (and vice versa).
-   **Rewards**: Completing tasks earns "Love Credits".
-   **Dashboard**: "Mission Control" panel visualizes Pending vs. Done tasks.
-   **Notifications**: Integrated WeChat Service Notifications for updates.

### 4. 🛍️ Market & Blind Box (积分商城 & 盲盒)
Redeem earned credits for real-world rewards.
-   **Market**: Browse and purchase items set by your partner.
-   **Blind Box (Gacha)**: Spend 50 credits to draw a random reward!
    -   **3D UI**: CSS-constructed 3D rotating mystery box with particle effects.
    -   **Excitement**: Weighted probabilities for different reward tiers.

## 🛠️ Tech Stack (技术栈)

-   **Frontend**: WXML, WXSS (CSS3 Animations), JavaScript.
-   **Backend**: WeChat Cloud Development (Cloud Functions, Cloud Database).
-   **Deployment**: WeChat Developer Tools.

## 📂 Project Structure (目录结构)

```bash
miniprogram/
├── pages/
│   ├── MainPage/       # Home: Anniversary Widget & Credit Dashboard
│   ├── Mission/        # Task List & Management
│   ├── Market/         # Rewards Shop
│   ├── BlindBox/       # 3D Gacha Game
│   └── ...
├── images/             # Optimized assets (Avatars, Icons)
├── app.js              # Global configuration (OpenID, Theme)
└── app.wxss            # Global styles (Variables, Glassmorphism classes)
cloudfunctions/
├── getOpenId/          # Auth
├── drawBlindBox/       # Gacha Logic
└── sendMessage/        # Notification Logic
```

## 🚀 Setup & Installation (安装指南)

1.  **Clone Repo**:
    ```bash
    git clone https://github.com/KIKO-0/Love-Mart.git
    ```
2.  **Open in WeChat DevTools**: Import the project directory.
3.  **Config OpenID**:
    -   Open `miniprogram/app.js`.
    -   Replace `_openidA` and `_openidB` with your actual User OpenIDs.
4.  **Cloud Functions**:
    -   Right-click `cloudfunctions` folder -> Select Environment.
    -   Upload & Deploy all cloud functions (especially `sendMessage` and `drawBlindBox`).

## 📸 Screenshots (界面预览)

*(Add screenshots here)*

---
Made with ❤️ by [KIKO-0](https://github.com/KIKO-0) & [UxxHans](https://github.com/UxxHans)
