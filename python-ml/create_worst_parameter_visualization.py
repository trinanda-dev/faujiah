"""
Script untuk membuat visualisasi grafik perbandingan ARIMAX dan Hybrid
dengan parameter terburuk (terendah).

Parameter terburuk:
- ARIMAX: p,d,q(3,1,0), MAPE 33.37%
- Hybrid: p,d,q(3,1,0), learning rate 0.1, epoch 10, MAPE 32.28%
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from pathlib import Path
import sys

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from utils.dataset import load_dataset, get_data_dir
from utils.evaluation import calculate_metrics
from utils.forecasting import predict_residuals_iterative
from training.arimax_trainer import train_arimax
from training.hybrid_trainer import train_lstm_residual
from sklearn.preprocessing import MinMaxScaler

# Set style untuk grafik yang lebih baik
try:
    plt.style.use('seaborn-v0_8-darkgrid')
except OSError:
    try:
        plt.style.use('seaborn-darkgrid')
    except OSError:
        plt.style.use('default')
plt.rcParams['figure.figsize'] = (14, 8)
plt.rcParams['font.size'] = 11
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10
plt.rcParams['legend.fontsize'] = 11

def create_worst_parameter_visualization():
    """
    Membuat visualisasi grafik perbandingan untuk parameter terburuk.
    """
    print("Memuat dataset...")
    data_dir = get_data_dir()
    
    # Load datasets
    train = load_dataset('train_dataset.csv')
    test = load_dataset('test_dataset.csv')
    
    # Parameter terburuk
    p, d, q = 3, 1, 0
    learning_rate = 0.1
    epochs = 10
    
    print(f"Melatih model ARIMAX dengan parameter ({p},{d},{q})...")
    # Train ARIMAX dengan parameter terburuk
    arimax_res, fitted_train, residual_train = train_arimax(train, order=(p, d, q))
    
    # Predict ARIMAX on test set
    arimax_forecast = arimax_res.get_forecast(steps=len(test), exog=test[['wind_speed']])
    arimax_pred = arimax_forecast.predicted_mean.values
    
    print(f"Melatih model LSTM dengan learning rate {learning_rate}, epoch {epochs}...")
    # Train LSTM dengan parameter terburuk
    model_lstm, scaler, _ = train_lstm_residual(
        residual_train,
        window=12,
        learning_rate=learning_rate,
        epochs=epochs,
        seed=710,
        quick_eval=False,
    )
    
    # Get seed from residual training data
    resid_vals = residual_train.values.reshape(-1, 1) if residual_train.ndim > 1 else residual_train.values.reshape(-1, 1)
    resid_scaled = scaler.transform(resid_vals)
    seed = resid_scaled[-12:].reshape(1, 12, 1)
    
    # Predict residuals iteratively
    predicted_resid = predict_residuals_iterative(
        model_lstm,
        scaler,
        seed,
        n_steps=len(test),
        window=12,
    )
    
    # Hybrid prediction
    hybrid_pred = arimax_pred + predicted_resid
    
    # Get actual values
    y_true = test['wave_height'].values
    
    # Calculate MAPE
    arimax_metrics = calculate_metrics(y_true, arimax_pred)
    hybrid_metrics = calculate_metrics(y_true, hybrid_pred)
    
    print(f"MAPE ARIMAX: {arimax_metrics['mape']:.2f}%")
    print(f"MAPE Hybrid: {hybrid_metrics['mape']:.2f}%")
    
    # Prepare data for visualization
    # Limit to 30 data points for better visualization
    n_display = min(30, len(test))
    test_display = test.iloc[:n_display]
    y_true_display = y_true[:n_display]
    arimax_pred_display = arimax_pred[:n_display]
    hybrid_pred_display = hybrid_pred[:n_display]
    
    # Create figure and axis
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Create x-axis (hari ke-)
    hari_ke = np.arange(1, n_display + 1)
    
    # Plot lines
    line1 = ax.plot(hari_ke, y_true_display, 'o-', color='#ef4444', linewidth=2, 
                    markersize=6, label='Data Aktual', zorder=3)
    line2 = ax.plot(hari_ke, arimax_pred_display, 'o-', color='#3b82f6', linewidth=2, 
                    markersize=6, label='Prediksi ARIMAX', zorder=3)
    line3 = ax.plot(hari_ke, hybrid_pred_display, 'o-', color='#10b981', linewidth=2, 
                    markersize=6, label='Prediksi Hybrid', zorder=3)
    
    # Set labels and title
    ax.set_xlabel('Timestamp / Hari ke-', fontsize=12, fontweight='bold')
    ax.set_ylabel('Ketinggian Gelombang (M)', fontsize=12, fontweight='bold')
    ax.set_title('Perbandingan Data Aktual, Prediksi ARIMAX, dan Hybrid\n(Parameter Terburuk)', 
                 fontsize=14, fontweight='bold', pad=20)
    
    # Set grid
    ax.grid(True, alpha=0.3, linestyle='--', linewidth=0.5)
    ax.set_axisbelow(True)
    
    # Set x-axis ticks
    ax.set_xticks(hari_ke)
    ax.set_xticklabels([f'Hari ke-{i}' for i in hari_ke], rotation=45, ha='right')
    
    # Set y-axis limits with some padding
    y_min = min(y_true_display.min(), arimax_pred_display.min(), hybrid_pred_display.min())
    y_max = max(y_true_display.max(), arimax_pred_display.max(), hybrid_pred_display.max())
    y_range = y_max - y_min
    ax.set_ylim(max(0, y_min - y_range * 0.1), y_max + y_range * 0.1)
    
    # Add legend
    ax.legend(loc='best', frameon=True, fancybox=True, shadow=True)
    
    # Add text box with MAPE information
    textstr = f'MAPE ARIMAX: {arimax_metrics["mape"]:.2f}%\nMAPE Hybrid: {hybrid_metrics["mape"]:.2f}%'
    props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)
    ax.text(0.02, 0.98, textstr, transform=ax.transAxes, fontsize=10,
            verticalalignment='top', bbox=props)
    
    # Adjust layout
    plt.tight_layout()
    
    # Save figure
    output_path = data_dir / 'visualization_worst_parameter.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"\nVisualisasi berhasil disimpan di: {output_path}")
    
    # Also save as PDF for better quality
    output_path_pdf = data_dir / 'visualization_worst_parameter.pdf'
    plt.savefig(output_path_pdf, bbox_inches='tight')
    print(f"Visualisasi PDF berhasil disimpan di: {output_path_pdf}")
    
    plt.close()
    
    return {
        'arimax_mape': arimax_metrics['mape'],
        'hybrid_mape': hybrid_metrics['mape'],
        'output_path': str(output_path),
        'output_path_pdf': str(output_path_pdf),
    }


if __name__ == '__main__':
    try:
        result = create_worst_parameter_visualization()
        print("\n" + "="*50)
        print("Hasil Evaluasi Parameter Terburuk:")
        print("="*50)
        print(f"MAPE ARIMAX: {result['arimax_mape']:.2f}%")
        print(f"MAPE Hybrid: {result['hybrid_mape']:.2f}%")
        print(f"\nFile gambar disimpan di:")
        print(f"  - PNG: {result['output_path']}")
        print(f"  - PDF: {result['output_path_pdf']}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

