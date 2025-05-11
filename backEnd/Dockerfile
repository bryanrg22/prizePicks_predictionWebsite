FROM python:3.9-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install openai firebase-admin pdfplumber

COPY . .

CMD exec gunicorn app:app \
     --bind 0.0.0.0:8080 \
     --timeout 120 \
     --workers 2 \
     --capture-output \
     --log-level debug