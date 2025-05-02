# PrizePicks Prediction Website

Lead Developer | Feb 2025 – Present  
Automated player performance prediction model to identify optimal betting opportunities on PrizePicks, analyzing player stats, team rankings, and matchup history.

## 🚀 Project Overview

- **Objective:** Predict NBA player point performances (“Over/Under” picks) using statistical modeling and AI.
- **Outcome:** Grew account balance from \$10 to over \$3,000 (29,900% ROI) with an 11/14 lineup win rate.

## 1. Briefly describe what this code sample does:
```plaintext
My backend includes a Flask module that defines REST endpoints under /api that drive the PrizePicks Prediction
Website’s backend (in app.py). Each endpoint uses the Firebase Admin SDK to gather and manipulate data in the
Firebase Database, fetching player metrics (e.g., seasonAvgPoints, last-5 games averages, gameStatus) from
processedPlayers/active or concluded, reading and writing user bet documents (activeBets, betHistory), and
ingesting OCR-parsed screenshot data. It then invokes our Poisson and Monte Carlo modules to compute probability
forecasts on those player stats before securely updating Firestore. Cloud Functions run in the background to migrate
and archive old threshold documents, ensuring the React+Vite frontend always displays up-to-date, real-time analytics.
```

## 2. Briefly describe what you learned when you created this code sample
```plaintext
I learned how to better design a Firebase Database schema so that it would be able to support multi-user access and
real-time sync, structuring collections like processedPlayers and per-user activeBets for efficient reads and writes.
I gained experience wiring React+Vite to a Flask API via the Firebase Admin SDK, ensuring secure, monitored communication.
I also mastered integrating third-party APIs for data retrieval, while also writing python scripts that would calculate data
when APIs lacked needed fields, and even using web scraping to fill gaps in our dataset such as web scraping the NBA Injury Report.
```

## 📸 Images of Web Program
### Home Page
#### Each user will be greeted with this page with their own unique data upon entry (Data such as Earnings, Active Bets, Current Picks, etc)
<img width="1512" alt="Image" src="https://github.com/user-attachments/assets/39f4e1e9-add3-415b-95ca-03cb9c5b3129" />

### Player Analysis on Home Page 
#### This is the layout the web page displays when a user searches for a player and their point threshold.
<img width="1512" alt="Image" src="https://github.com/user-attachments/assets/8d960312-30c7-47f6-9004-ed82facc348b" />

### Processed Players Page
#### This is the Processed Player's page, which will display the same players across all users. All players serarched for by different users will appear on this page.
<img width="1512" alt="Image" src="https://github.com/user-attachments/assets/3f9c727b-b315-4688-bd57-0a12a55820dc" />

### Player Analysis on Processed Players Page
<img width="1512" alt="Image" src="https://github.com/user-attachments/assets/80d5ca78-d3af-439e-a687-b8d90363da13" />

## 🧰 Tech Stack

### Frontend
- **React + Vite** – Fast, modern SPA  
- **Tailwind CSS** – Utility-first styling  
- **Lucide React** – Iconography  
- **Recharts** – Charts & data visualization  

### Backend
- **Python 3.9+** – Core language  
- **Flask** – REST API  
- **Firebase Admin SDK** – Firestore interaction  

### Database & Hosting
- **Firebase Firestore** – NoSQL  
- **Firebase Authentication** – User accounts  
- **Firebase Storage** – Screenshots & assets  

### Data & AI
- **OpenAI ChatGPT's o4-mini API** – Bet explanation generation
- **Poisson & Monte Carlo** – Probability models  
- **Pandas, NumPy** – Data wrangling  
- **OCR** – Screenshot parsing
- **WORK IN PROGRESS** Machine Learning Model

## 🔧 Installation

### Prerequisites
- Node.js v16+ & npm/yarn  
- Python 3.8+ & pip  
- Firebase account & service-account JSON

⸻

## Project Structure

```plaintext
prizePicks_predictionWebsite/
├── frontend/               # React + Vite app
│   ├── src/
│   ├── public/
│   └── vite.config.js
├── backend/                # Flask API + data pipelines
│   ├── app.py
│   ├── player_analyzer.py
│   ├── monte_carlo.py
│   └── ...
└── functions/              # Firebase Cloud Functions
    └── index.js            # data migration & archival
```

⸻


## Firebase Database Schema

```plaintext
firestore/
├─ processedPlayers/
│  ├─ active/thresholds/{player_threshold_doc}
│  └─ concluded/thresholds/{player_threshold_doc}
│     └─ { seasonAvgPoints, last5GamesAvg, gameStatus, gameId, … }

users/{userId}/
├─ activeBets/{betId}
│     └─ { betAmount, potentialWinnings, picks: [ … ], status, … }
├─ betHistory/{year}/{month}/{betId}
│     └─ { ...betData, settledAt }
└─ picks (legacy)           # array of { id, thresholds: [ … ] }
```

License

This project is licensed under the MIT License. See the LICENSE file for details.
