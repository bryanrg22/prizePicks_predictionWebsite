PrizePicks Prediction Website

An automated NBA player performance prediction model and interactive web app that identifies optimal betting opportunities on PrizePicks. Leveraging statistical analysis, probability modeling, and AI-driven explanations to help users make data-informed picks.

⸻

Tech Stack

Frontend
	•	React + Vite – Fast, modern UI framework
	•	Tailwind CSS – Utility-first styling
	•	Lucide React – Iconography
	•	Recharts – Charts for visualizing performance

Backend
	•	Python – Core language for data processing
	•	Flask – Lightweight web API
	•	Firebase Admin SDK – Secure Firestore interactions

Database & Cloud
	•	Firebase Firestore – NoSQL data storage (processedPlayers, users/...)
	•	Firebase Authentication – User management
	•	Cloud Functions – Automated data migrations and archival

Data & AI Integration
	•	Poisson Distribution – Probability of player point totals
	•	Monte Carlo Simulations – Long‑run outcome estimates
	•	ChatGPT – Natural‐language bet explanations
	•	OCR (Tesseract) – Screenshot parsing for batch analyses

⸻

Features
	•	Player Analysis – Season, last-5 games, matchup history
	•	Probability Models – Poisson & Monte Carlo outputs
	•	AI Recommendations – ChatGPT-powered Over/Under guidance
	•	Screenshot Uploader – Bulk import of PrizePicks screenshots
	•	Processed Players Dashboard – Active vs. concluded games
	•	Bet Slip & History – Build, edit, lock in picks; view outcomes
	•	Real-time Sync – Firebase for seamless data updates

⸻

Installation

Prerequisites
	•	Node.js (v16+)
	•	npm or yarn
	•	Python (v3.8+)
	•	Firebase account & CLI

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