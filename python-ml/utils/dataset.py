"""Dataset utilities for saving and loading datasets."""

import pandas as pd
import os
from pathlib import Path


def get_data_dir() -> Path:
    """Get the data directory path."""
    return Path(__file__).parent.parent / 'data'


def get_models_dir() -> Path:
    """Get the models directory path."""
    return Path(__file__).parent.parent / 'models'


def save_dataset(df: pd.DataFrame, filename: str) -> str:
    """
    Save DataFrame to CSV in data directory.

    Args:
        df: DataFrame to save
        filename: Filename (e.g., 'train_dataset.csv')

    Returns:
        Full path to saved file
    """
    data_dir = get_data_dir()
    data_dir.mkdir(exist_ok=True)
    file_path = data_dir / filename
    df.to_csv(file_path)
    return str(file_path)


def load_dataset(filename: str) -> pd.DataFrame:
    """
    Load DataFrame from CSV in data directory.

    Args:
        filename: Filename (e.g., 'train_dataset.csv')

    Returns:
        Loaded DataFrame
    """
    data_dir = get_data_dir()
    file_path = data_dir / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
    df = pd.read_csv(file_path, index_col=0, parse_dates=True)
    return df


def save_uploaded_file(file_content: bytes, filename: str = 'upload.xlsx') -> str:
    """
    Save uploaded file to data directory.

    Args:
        file_content: File content as bytes
        filename: Filename to save as

    Returns:
        Full path to saved file
    """
    data_dir = get_data_dir()
    data_dir.mkdir(exist_ok=True)
    file_path = data_dir / filename
    with open(file_path, 'wb') as f:
        f.write(file_content)
    return str(file_path)

