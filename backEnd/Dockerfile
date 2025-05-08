FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
# Assuming your Flask app is exposed as `app` in app.py
CMD exec gunicorn app:app         --bind 0.0.0.0:8080 --workers 2