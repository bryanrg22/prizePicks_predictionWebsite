FROM python:3.9-slim
WORKDIR /app

# Copy and install everything from requirements.txt
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    # force-install the two that are still missing
    pip install openai firebase-admin

# Copy your app code
COPY . .

# Ensure Gunicorn points at the right callable
CMD exec gunicorn app:app \
     --bind 0.0.0.0:8080 \
     --workers 2 \
     --capture-output \
     --log-level debug