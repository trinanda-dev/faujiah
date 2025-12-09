"""Data preprocessing utilities for wave height prediction."""

import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import adfuller


def clean_numeric(col: pd.Series) -> pd.Series:
    """Clean numeric column by removing commas, fixing multiple dots, and converting to numeric."""
    col = col.astype(str).str.strip()
    col = col.str.replace(',', '.', regex=False)
    col = col.str.replace(r'[^0-9\.\-]', '', regex=True)

    def fix_multi_dot(x: str) -> str:
        if x.count('.') <= 1:
            return x
        parts = x.split('.')
        return parts[0] + ''.join(parts[1:])

    col = col.apply(fix_multi_dot)
    return pd.to_numeric(col, errors='coerce')


def load_and_clean_data(file_path: str) -> pd.DataFrame:
    """
    Load Excel file and clean the data.

    Args:
        file_path: Path to Excel file

    Returns:
        Cleaned DataFrame with timestamp index
    """
    df = pd.read_excel(file_path, parse_dates=['timestamp'])
    df.columns = ['timestamp', 'wave_height', 'wind_speed']
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp').set_index('timestamp')

    # Clean numeric columns
    df['wave_height'] = clean_numeric(df['wave_height'])
    df['wind_speed'] = clean_numeric(df['wind_speed'])

    # Fill missing values with time-based interpolation
    df = df.interpolate(method='time')

    return df


def check_stationarity(series: pd.Series) -> dict:
    """
    Check stationarity using Augmented Dickey-Fuller test.

    Args:
        series: Time series data

    Returns:
        Dictionary with ADF statistics
    """
    adf_res = adfuller(series.dropna())
    return {
        'adf_statistic': float(adf_res[0]),
        'p_value': float(adf_res[1]),
        'critical_values': {k: float(v) for k, v in adf_res[4].items()},
        'is_stationary': adf_res[1] < 0.05,
    }


def split_train_test(df: pd.DataFrame, train_ratio: float = 0.8) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split data into train and test sets (time-based).

    Args:
        df: DataFrame to split
        train_ratio: Ratio of training data (default 0.8)

    Returns:
        Tuple of (train_df, test_df)
    """
    n = len(df)
    train_size = int(train_ratio * n)
    train = df.iloc[:train_size].copy()
    test = df.iloc[train_size:].copy()
    return train, test

