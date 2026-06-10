from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import io
import os

from analyzer import DataAnalyzer

app = FastAPI(title="Insights AI API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a CSV file.",
        )

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        if df.empty:
            raise HTTPException(
                status_code=400, detail="The uploaded CSV file is empty."
            )

        analyzer = DataAnalyzer(df)
        results = analyzer.analyze()
        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing file: {str(e)}"
        )


# Serve the static frontend.
# On Vercel, the `frontend/` directory is bundled alongside this function
# via the `includeFiles` setting in vercel.json. We resolve its path
# relative to this file so it works both locally and in the serverless runtime.
frontend_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend")
)

if os.path.isdir(frontend_path):
    # html=True makes "/" serve index.html and resolves relative assets.
    # Mounted last so the /analyze route above takes precedence.
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")


# Allows running locally with: python api/index.py
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
