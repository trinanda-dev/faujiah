"""Evaluation utilities for model metrics."""

import numpy as np


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Calculate Mean Absolute Percentage Error.

    Args:
        y_true: True values
        y_pred: Predicted values

    Returns:
        MAPE value as percentage
    """
    mask = y_true != 0
    if mask.sum() == 0:
        return float('inf')
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Calculate evaluation metrics (MAPE only).

    Args:
        y_true: True values
        y_pred: Predicted values

    Returns:
        Dictionary with MAPE only
    """
    return {
        'mape': mape(y_true, y_pred),
    }

