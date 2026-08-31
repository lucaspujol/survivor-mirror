from fastapi import FastAPI

app = FastAPI(
    title="GéoEmploi API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
