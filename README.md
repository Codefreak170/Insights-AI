# Insights AI MVP

This project is a lightweight analyst platform where users can upload a CSV file and instantly receive basic automated analysis, visualizations, and simple business insights. It's built as a full-stack web application using FastAPI for the backend and HTML, CSS, JavaScript with Chart.js for the frontend.

## Project Structure

```
Insights-AI/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── backend/
    ├── main.py
    ├── analyzer.py
    └── requirements.txt
```

## Features

- **CSV Upload**: Drag-and-drop or select CSV files for analysis.
- **Dataset Analysis**: Automatically detects numerical, categorical, and date columns. Generates row count, column count, missing value count, and percentage.
- **Descriptive Statistics**: Displays mean, median, minimum, maximum, and standard deviation for numerical columns.
- **Automated Insights**: Provides 5-10 rule-based insights in plain English.
- **Visualizations**: Automatically generates Bar Charts, Pie Charts, Histograms, and Line Charts (if date columns exist) using Chart.js.
- **Results Dashboard**: Presents all analysis results, statistics, insights, and charts on a clean, modern, and responsive dashboard.
- **Export Report**: Allows users to download a simple text report containing the dataset summary, statistics, and insights.

## Technology Stack

**Frontend:**
- HTML
- CSS
- JavaScript
- Chart.js

**Backend:**
- Python
- FastAPI
- Pandas
- NumPy
- Uvicorn

## Setup and Run Instructions

Follow these steps to set up and run the Insights AI MVP locally:

### 1. Clone the Repository (if applicable)

If you received this project as a repository, clone it to your local machine:

```bash
git clone <repository_url>
cd Insights-AI
```

### 2. Navigate to the Project Directory

Ensure you are in the root directory of the project where `frontend` and `backend` folders are located.

```bash
cd /path/to/Insights-AI
```

### 3. Set up the Backend

Navigate into the `backend` directory and install the required Python dependencies.

```bash
cd backend
sudo pip3 install -r requirements.txt
```

### 4. Run the Backend Server

Start the FastAPI server. This will serve the API and also the frontend static files.

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Alternatively, you can run it in the background:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
```

### 5. Access the Application

Once the server is running, open your web browser and navigate to:

[https://8000-idu3595iohpa8ytnwxmuo-1061b19b.sg1.manus.computer](https://8000-idu3595iohpa8ytnwxmuo-1061b19b.sg1.manus.computer)

You should see the Insights AI dashboard. You can now upload a CSV file and see the analysis.

## How to Use

1. **Upload CSV**: Drag and drop a CSV file into the designated area or click the 
"Choose File" button to select one.
2. **View Analysis**: After uploading, the application will process the CSV and display a dashboard with:
   - Dataset Summary (rows, columns, missing values)
   - Descriptive Statistics for numerical columns
   - Key Insights generated from the data
   - Interactive Charts (Bar, Pie, Histogram, Line) where applicable
3. **Export Report**: Click "Download PDF Report" to get a text-based summary of the analysis or "Download JSON Report" to get the raw analysis data.
4. **Analyze Another File**: Click the "Analyze Another File" button to clear the current results and upload a new CSV.

## Sample CSV Structure

Your CSV file should have a header row. Example:

```csv
Date,Product,Region,Sales,Profit
2025-01-01,Phone,North,1000,200
2025-01-02,Laptop,South,1500,350
2025-01-03,Tablet,West,800,120
```

## Important Notes

- This MVP focuses on simplicity and rule-based analysis. It does not use advanced AI/ML models or external integrations.
- The PDF export is currently a simple text file. For a more sophisticated PDF with charts, a dedicated client-side PDF generation library would be required.

## License

[Specify your license here, e.g., MIT License]
