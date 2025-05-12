# PrizePicks Prediction Website

**Lead Developer | Feb 2025 – Present**  
A full-stack, AI-powered platform that automatically analyzes NBA “Over/Under” picks on PrizePicks. From OCR’ing screenshots to running Poisson, Monte Carlo & GARCH volatility forecasts (including playoff games), and generating natural-language bet explanations via ChatGPT, this site manages the entire pipeline end-to-end—hosted on Firebase Hosting + Cloud Run with CI/CD.

---

## 🚀 Project Overview

- **Objective:** Predict NBA player point performances (“Over/Under” picks) using statistical models (Poisson, Monte Carlo, GARCH volatility) and AI-driven explanations.  
- **Live Outcome:** Turned \$10 into \$3,279+ on PrizePicks (29,900% ROI) with an 11/14 lineup win rate.  
- **Core Features:**  
  - **Screenshot Parsing (OCR):** Upload PrizePicks cards, extract player & threshold pairs.  
  - **Player Pipeline:**  
    - Season & last-5 game averages  
    - Poisson probability  
    - Monte Carlo simulation  
    - GARCH volatility forecast (regular season & playoffs)  
    - Injury report scraping  
    - ChatGPT-powered bet explanation  
  - **Playoff Support:** Automatically switches to playoff stats after ≥ 5 postseason games.  
  - **Real-Time Updates:** Background Cloud Functions mark “Concluded” games and settle bets.  
  - **CI/CD & Hosting:** React + Vite on Firebase Hosting, Flask + Docker on Cloud Run, GitHub Actions auto-deploy.

---

## 📸 Pre Flight Website Access

[Website Link](https://prizepicksproject-15337.web.app/)

- **Currently, the project is still in development as more features will be integrated along with bug fixes** 
  - If you would like access to the website despite it's early development phase, please feel free to reach out to bryanram2024@gmail.com

---

## 📸 Demo Video

[Watch on GitHub](https://github.com/user-attachments/assets/ec796b28-824e-4374-8d9a-beedc7a0ed4e)

---

## 🖼️ Screenshots

### Home Page  
![](https://github.com/user-attachments/assets/39f4e1e9-add3-415b-95ca-03cb9c5b3129)  
Greeted by Earnings, Active Bets & Live Picks.

### Player Analysis Panel  
![](https://github.com/user-attachments/assets/8d960312-30c7-47f6-9004-ed82facc348b)  
Input a player + threshold → see probability forecasts & AI explanation.

### Processed Players Dashboard  
![](https://github.com/user-attachments/assets/3f9c727b-b315-4688-bd57-0a12a55820dc)  
Aggregated player cards across all users.

---

## 🧰 Tech Stack

### Front-End  
- **React + Vite** – SPA framework  
- **Tailwind CSS** – Utility-first styling  
- **Lucide React** – Icon library  
- **Recharts** – Charts & graphs  

### Back-End  
- **Python 3.9+**  
- **Flask** – REST API  
- **gunicorn** – WSGI server (Cloud Run)  
- **firebase-admin** – Firestore & Auth  
- **openai** – ChatGPT o4-mini integration
- **!!Coming Soon!!** - OCaml written to speed up Poisson, Monte Carlo, and GARCH Model

### 📈 Data & Analytics  
- **Poisson & Monte Carlo** – Probability pipelines  
- **GARCH (arch-model)** – Volatility forecasting  
- **pandas, NumPy** – Data wrangling  
- **NBA API** – Stats & box scores  
- **OCR (screenshot_parser.py)** – Image data extraction  
- **Requests** – Web scraping (NBA Injury Report)  
- **!!Coming Soon!!** - ML Algorithm trained off of data stored in Firestore

### Infrastructure & Deployment  
- **Firebase Hosting** – Front-end CDN & SSL  
- **Cloud Run** – Containerized Flask API  
- **Firebase Cloud Functions** – Background jobs & data migration  
- **GitHub Actions** – CI/CD (build → deploy Hosting & Cloud Run)  
- **Docker** – Back-end container  

---

### Project Scheme
```plaintext
PRIZEPICKS_PREDICTIONWEBSITE/
├── backEnd/
│   ├── app.py
│   ├── backtester.py
│   ├── chatgpt_bet_explainer.py
│   ├── injury_report.py
│   ├── main.py
│   ├── monte_carlo.py
│   ├── player_analyzer.py
│   ├── prediction_analyzer.py
│   ├── requirements.txt
│   ├── screenshot_parser.py
│   └── volatility.py
├── frontEnd/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── firebase.js
│   │   ├── index.css
│   │   └── main.jsx
├── functions/
│   ├── index.js
├── .firebaserc
├── firebase.json
└── README.md
```

### Firestore Database Scheme
```plaintext
firestore/
├─ processedPlayers/ (collection)
│   ├── active/ (document)
│   │   └── {first_last_threshold_YYYYMMDD}/ (document)
│   │       ├─ name: string
│   │       ├─ playerId: string
│   │       ├─ team: string
│   │       ├─ position: string
│   │       ├─ opponent: string
│   │       ├─ photoUrl: string
│   │       ├─ teamLogo: string
│   │       ├─ opponentLogo: string
│   │       ├─ gameDate: Timestamp
│   │       ├─ gameTime: string
│   │       ├─ gameType: string
│   │       ├─ teamPlayoffRank: number
│   │       ├─ opponentPlayoffRank: number
│   │       ├─ seasonAvgPoints: number
│   │       ├─ last5RegularGamesAvg: number
│   │       ├─ seasonAvgVsOpponent: number
│   │       ├─ homeAwayAvg: number
│   │       ├─ last5RegularGames: array<map>  
│   │       │    └─ [{ date, points, opponent, opponentFullName, … }, …]
│   │       ├─ advancedPerformance: map
│   │       ├─ careerSeasonStats: array<map>
│   │       ├─ injuryReport: map
│   │       ├─ betExplanation: map
│   │       ├─ poissonProbability: number
│   │       ├─ monteCarloProbability: number
│   │       ├─ volatilityForecast: number
│   │       ├─ season_games_agst_opp: array<map>
│   │       ├─ num_playoff_games: number
│   │       ├─ playoffAvg: number
│   │       ├─ playoff_games: array<map>  
│   │       │    └─ [{ date, points, opponent, …, gameType: "Playoffs" }, …]
│   │       └─ volatilityPlayOffsForecast: number
│   └── concluded/ (document)
│       └── {first_last_threshold_YYYYMMDD}/  
│           └─ (same fields as above) 
├─ users/{userId}/
│   ├─ activeBets/{YYYYMMDDTHHMMSSZ}
│   │   └─ { betAmount, potentialWinnings, picks: [ {firstName_lastName_threshold}/ (document), ... ], status, … }
│   ├─ betHistory/{YYYYMMDDTHHMMSSZ}
│   │   └─ { betData, settledAt, picks: [ {firstName_lastName_threshold}/ (document), ... ] }
│   ├─ picks: [ {player_threshold_doc}/ (document), ... ]     
└─  └─ profileData
```
