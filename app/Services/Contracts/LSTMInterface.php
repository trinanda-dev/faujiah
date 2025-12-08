<?php

namespace App\Services\Contracts;

/**
 * Interface for LSTM/GRU forecasting service.
 * Defines contract for neural network training and prediction.
 */
interface LSTMInterface
{
    /**
     * Train GRU/LSTM model on residual data.
     *
     * @param  array  $residuals  Training residuals (standardized)
     * @param  int  $window  Input window size
     * @param  int  $epochs  Number of training epochs
     * @param  float  $learningRate  Initial learning rate
     * @return array Training history with losses
     */
    public function train(array $residuals, int $window = 12, int $epochs = 10, float $learningRate = 0.01): array;

    /**
     * Predict next value using trained model.
     *
     * @param  array  $lastWindow  Last window of residuals (scaled)
     * @return float Predicted residual (scaled)
     */
    public function predict(array $lastWindow): float;

    /**
     * Get model parameters for logging.
     *
     * @return array Model parameters
     */
    public function getParameters(): array;
}
