import pandas as pd
import numpy as np
import json
from datetime import datetime

class DataAnalyzer:
    def __init__(self, df):
        self.df = df
        self.summary = {}
        self.stats = {}
        self.insights = []
        self.charts = {}

    def analyze(self):
        self._get_summary()
        self._get_statistics()
        self._generate_insights()
        self._prepare_charts()
        
        return {
            "summary": self.summary,
            "statistics": self.stats,
            "insights": self.insights,
            "charts": self.charts
        }

    def _get_summary(self):
        missing_values = self.df.isnull().sum().sum()
        total_cells = self.df.size
        
        self.summary = {
            "rows": int(len(self.df)),
            "columns": int(len(self.df.columns)),
            "missing_values": int(missing_values),
            "missing_percentage": float(round((missing_values / total_cells) * 100, 2)) if total_cells > 0 else 0,
            "column_names": list(self.df.columns),
            "numerical_cols": list(self.df.select_dtypes(include=[np.number]).columns),
            "categorical_cols": list(self.df.select_dtypes(include=['object', 'category']).columns),
            "date_cols": []
        }
        
        # Detect date columns
        for col in self.df.select_dtypes(include=['object']).columns:
            try:
                # Check first few non-null values
                sample = self.df[col].dropna().iloc[:5]
                if not sample.empty:
                    pd.to_datetime(sample, errors='raise')
                    self.summary["date_cols"].append(col)
                    # If it's a date, remove from categorical
                    if col in self.summary["categorical_cols"]:
                        self.summary["categorical_cols"].remove(col)
            except:
                pass

    def _get_statistics(self):
        num_df = self.df.select_dtypes(include=[np.number])
        if not num_df.empty:
            desc = num_df.describe().to_dict()
            for col, metrics in desc.items():
                self.stats[col] = {
                    "mean": float(round(metrics['mean'], 2)) if not np.isnan(metrics['mean']) else 0,
                    "median": float(round(num_df[col].median(), 2)) if not np.isnan(num_df[col].median()) else 0,
                    "min": float(round(metrics['min'], 2)) if not np.isnan(metrics['min']) else 0,
                    "max": float(round(metrics['max'], 2)) if not np.isnan(metrics['max']) else 0,
                    "std": float(round(metrics['std'], 2)) if not np.isnan(metrics['std']) else 0
                }

    def _generate_insights(self):
        # 1. Missing Values Insight
        if self.summary["missing_values"] > 0:
            cols_with_missing = self.df.columns[self.df.isnull().any()].tolist()
            self.insights.append(f"Dataset contains {self.summary['missing_values']} missing values in columns: {', '.join(cols_with_missing)}.")
        else:
            self.insights.append("Great! No missing values detected in the dataset.")

        # 2. Categorical Insights (Highest Volume)
        for col in self.summary["categorical_cols"][:2]: # Max 2 columns
            counts = self.df[col].value_counts()
            if not counts.empty:
                top_val = counts.idxmax()
                top_count = counts.max()
                percentage = (top_count / len(self.df)) * 100
                self.insights.append(f"'{top_val}' is the most frequent value in {col}, accounting for {percentage:.1f}% of entries.")

        # 3. Numerical Insights (Highest/Lowest)
        for col in self.summary["numerical_cols"][:2]: # Max 2 columns
            max_val = self.df[col].max()
            min_val = self.df[col].min()
            self.insights.append(f"Column '{col}' ranges from {min_val} to {max_val}, with an average of {self.df[col].mean():.2f}.")

        # 4. Date Trend Insight
        if self.summary["date_cols"] and self.summary["numerical_cols"]:
            date_col = self.summary["date_cols"][0]
            num_col = self.summary["numerical_cols"][0]
            try:
                temp_df = self.df.copy()
                temp_df[date_col] = pd.to_datetime(temp_df[date_col])
                temp_df = temp_df.sort_values(date_col)
                
                mid = len(temp_df)//2
                if mid > 0:
                    first_half = temp_df[num_col].iloc[:mid].mean()
                    second_half = temp_df[num_col].iloc[mid:].mean()
                    
                    trend = "increasing" if second_half > first_half else "decreasing"
                    diff = abs(second_half - first_half) / (first_half if first_half != 0 else 1) * 100
                    self.insights.append(f"The trend for '{num_col}' over time appears to be {trend} (a {diff:.1f}% change).")
            except:
                pass

        # 5. Correlation (Simple rule-based)
        num_cols = self.summary["numerical_cols"]
        if len(num_cols) >= 2:
            corr_matrix = self.df[num_cols].corr()
            found_corr = False
            for i in range(len(num_cols)):
                for j in range(i + 1, len(num_cols)):
                    corr_val = corr_matrix.iloc[i, j]
                    if abs(corr_val) > 0.6:
                        strength = "strong" if abs(corr_val) > 0.8 else "moderate"
                        direction = "positive" if corr_val > 0 else "negative"
                        self.insights.append(f"Detected a {strength} {direction} correlation ({corr_val:.2f}) between '{num_cols[i]}' and '{num_cols[j]}'.")
                        found_corr = True
                        break # Only one correlation insight
                if found_corr: break

        # Ensure we have at least 5 insights if possible
        while len(self.insights) < 5 and len(self.insights) < 10:
            self.insights.append("Analysis complete: No further significant patterns detected in this subset of data.")
            break

        # Limit to 10 insights
        self.insights = self.insights[:10]

    def _prepare_charts(self):
        # 1. Bar Chart (Top 5 of first categorical vs first numerical)
        if self.summary["categorical_cols"] and self.summary["numerical_cols"]:
            cat_col = self.summary["categorical_cols"][0]
            num_col = self.summary["numerical_cols"][0]
            data = self.df.groupby(cat_col)[num_col].sum().sort_values(ascending=False).head(5)
            self.charts["bar"] = {
                "labels": [str(x) for x in data.index.tolist()],
                "values": [float(x) for x in data.values.tolist()],
                "title": f"Top 5 {cat_col} by Total {num_col}"
            }

        # 2. Pie Chart (Distribution of first categorical)
        if self.summary["categorical_cols"]:
            cat_col = self.summary["categorical_cols"][0]
            data = self.df[cat_col].value_counts().head(5)
            self.charts["pie"] = {
                "labels": [str(x) for x in data.index.tolist()],
                "values": [int(x) for x in data.values.tolist()],
                "title": f"Distribution of {cat_col}"
            }

        # 3. Histogram (Distribution of first numerical)
        if self.summary["numerical_cols"]:
            num_col = self.summary["numerical_cols"][0]
            clean_data = self.df[num_col].dropna()
            if not clean_data.empty:
                counts, bins = np.histogram(clean_data, bins=10)
                self.charts["histogram"] = {
                    "labels": [f"{bins[i]:.1f}-{bins[i+1]:.1f}" for i in range(len(bins)-1)],
                    "values": [int(x) for x in counts.tolist()],
                    "title": f"Distribution of {num_col}"
                }

        # 4. Line Chart (First numerical over first date column)
        if self.summary["date_cols"] and self.summary["numerical_cols"]:
            date_col = self.summary["date_cols"][0]
            num_col = self.summary["numerical_cols"][0]
            try:
                temp_df = self.df.copy()
                temp_df[date_col] = pd.to_datetime(temp_df[date_col])
                data = temp_df.groupby(temp_df[date_col].dt.date)[num_col].sum().sort_index()
                self.charts["line"] = {
                    "labels": [str(d) for d in data.index],
                    "values": [float(x) for x in data.values.tolist()],
                    "title": f"{num_col} Trend Over Time"
                }
            except:
                pass
