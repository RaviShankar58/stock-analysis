
# 📈 Stock Portfolio & News Analysis Platform 📰

Full-stack MERN application to track your stock portfolio, get the latest news, summarize articles, and perform AI-driven analysis to make informed investment decisions. 💡💹

---

## 🌐 Live Demo
[Insert your live deployment link here](#)

---

## ✨ Features

- **Portfolio Management**
  - ➕ Add, ✏️ edit, and manage your stocks.
  - 💰 View real-time portfolio value based on current stock prices.
  
- **News & Analysis**
  - 📰 Fetch latest news for your portfolio stocks.
  - 📝 Summarize news articles for quick reading.
  - 🤖 AI-driven analysis:
    - 📊 Impact assessment (Positive / Negative / Neutral)
    - 🔹 Action recommendation (Buy / Sell / Hold)
    - 🧐 Explanation for suggested decision

- **User Authentication**
  - 🔐 Sign up and login.
  - ✅ Secure JWT-based authentication.

- **Responsive UI**
  - 💻 Works on desktop and 📱 mobile.
  - 🎨 Clean and intuitive design.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router  
- **Backend:** Node.js, Express.js, MongoDB, Mongoose  
- **Authentication:** JWT 🔐  
- **AI / NLP:** Summarization & impact analysis pipelines 🤖  
- **Notifications & Feedback:** Custom toast notifications 🥳  

---

## 🚀 Installation

### Clone the repo
```bash
git clone <repo-url>
cd stock
````

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

---

## 🔧 Environment Variables

**Frontend (`frontend/.env`)**

```bash
VITE_API_URL=http://localhost:4000
```

**Backend (`backend/.env`)**

```bash
PORT=4000
MONGO_URI=mongodb:<your MongoDB url>
JWT_SECRET=Your secret key

MARKETAUX_API_KEY=<paste your API here>
FETCH_TOP_N_PER_TICKER=10
CRON_SCHEDULE=*/5 * * * *

HUGGINGFACE_API_KEY=<paste your API here>

**MODELS USED (CAN CHANGE ACCORDING TO NEED)**

HUG_SUMMARY_MODEL=sshleifer/distilbart-cnn-12-6
HUG_SENTIMENT_MODEL=cardiffnlp/twitter-roberta-base-sentiment
HUG_EXPLAIN_MODEL=facebook/bart-large-cnn
HF_MODEL_PRIORITY=facebook/bart-large-cnn,sshleifer/distilbart-cnn-12-6
SLEEP_MS=600
MAX_CHUNKS=4
MODEL_WORD_LIMIT=600

AWAN_API_KEY=<paste your API here>
AWAN_API_BASE=https://api.awanllm.com
AWAN_MODEL_PRIMARY=llama3.1:70b (change it according to your preference)
AWAN_MODEL_FALLBACK=Awanllm-Llama-3-8B-Cumulus,Meta-Llama-3.1-8B-Instruct
AWAN_TIMEOUT_MS=80000
```

---

## 🏃‍♂️ Usage

1. Sign up or login. 🔑
2. Add your stocks to portfolio. ➕
3. View latest news for your stocks. 📰
4. Summarize articles or analyze impact & decision recommendations. 📝🤖
5. Make informed investment choices! 💡💹

---

## 🤝 Contributing

Contributions are welcome!
Please open an issue or submit a pull request for any bug fixes or feature requests.

---

## 📄 License

This project is licensed under the MIT License.

