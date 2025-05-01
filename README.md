# PrizePicks Prediction Website

Lead Developer | Feb 2025 – Present  
Automated player performance prediction model to identify optimal betting opportunities on PrizePicks, analyzing player stats, team rankings, and matchup history.

## 🚀 Project Overview

- **Objective:** Predict NBA player point performances (“Over/Under” picks) using statistical modeling and AI.
- **Outcome:** Grew account balance from \$10 to over \$3,000 (29,900% ROI) with an 11/14 lineup win rate.
- **Live Demo:** https://github.com/bryanrg22/prizePicks_predictionWebsite

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
- **Pandas, NumPy** – Data wrangling  
- **Poisson & Monte Carlo** – Probability models  
- **OCR** – Screenshot parsing  
- **OpenAI ChatGPT** – Bet explanation generation  

## 🔧 Installation

### Prerequisites
- Node.js v16+ & npm/yarn  
- Python 3.8+ & pip  
- Firebase account & service-account JSON

---

### 1. Clone Repository
```bash
git clone https://github.com/bryanrg22/prizePicks_predictionWebsite.git
cd prizePicks_predictionWebsite

Frontend Setup
	1.	Clone the repo and install:

git clone https://github.com/bryanrg22/prizePicks_predictionWebsite.git
cd prizePicks_predictionWebsite/frontend
npm install


	2.	Create .env.local in frontend/:

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...



Backend Setup
	1.	Navigate to backend and create a venv:

cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt


	2.	Add your Firebase service account JSON as firebase-credentials.json in backend/.

⸻

Running the Application

Frontend

cd frontend
npm run dev

Open http://localhost:3000

Backend

cd backend
python app.py

API available at http://localhost:5000/api

⸻

Firebase Database Schema

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



⸻

Project Structure

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



⸻

Contributing
	1.	Fork this repository
	2.	Create your feature branch (git checkout -b feature/my-feature)
	3.	Commit your changes (git commit -m "Add my feature")
	4.	Push to the branch (git push origin feature/my-feature)
	5.	Open a Pull Request

⸻

License

This project is licensed under the MIT License. See the LICENSE file for details.