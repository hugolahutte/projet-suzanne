FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api/ .
RUN useradd --create-home suzanne && chown -R suzanne:suzanne /app
USER suzanne
CMD ["sh", "-c", "alembic upgrade head && python -m suzanne.seed && uvicorn suzanne.main:app --host 0.0.0.0 --port 8000 --no-access-log"]
