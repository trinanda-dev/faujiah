"""ARIMAX model training module."""

import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import joblib
from pathlib import Path
from utils.dataset import save_dataset, get_models_dir


def train_arimax(
    train: pd.DataFrame,
    order: tuple[int, int, int] = (1, 0, 0),
    save_path: str | None = None,
) -> tuple[object, pd.Series, pd.Series]:
    """
    Train ARIMAX model on training data.

    Args:
        train: Training DataFrame with 'wave_height' and 'wind_speed' columns
        order: ARIMA order (p, d, q)
        save_path: Optional path to save model (default: models/arimax_model.pkl)

    Returns:
        Tuple of (fitted_model, fitted_values, residuals)
    """
    if 'wave_height' not in train.columns or 'wind_speed' not in train.columns:
        raise ValueError("Training data must contain 'wave_height' and 'wind_speed' columns")

    # Fit SARIMAX
    arimax = SARIMAX(
        train['wave_height'],
        order=order,
        exog=train[['wind_speed']],
        enforce_stationarity=False,
        enforce_invertibility=False,
    )
    arimax_res = arimax.fit(disp=False)

    # Get fitted values and residuals
    fitted_train = arimax_res.fittedvalues
    residual_train = train['wave_height'] - fitted_train
    residual_train = residual_train.dropna()

    # Save model (statsmodels .save() method uses pickle internally)
    models_dir = get_models_dir()
    models_dir.mkdir(exist_ok=True)
    if save_path is None:
        save_path = str(models_dir / 'arimax_model.pkl')
    # Use statsmodels .save() method (saves as pickle)
    arimax_res.save(save_path)

    return arimax_res, fitted_train, residual_train

