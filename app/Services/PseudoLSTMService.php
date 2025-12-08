<?php

namespace App\Services;

use App\Services\Contracts\LSTMInterface;
use App\Services\GRU\GRUCell;
use App\Services\GRU\GRUPredictor;
use App\Services\GRU\GRUTrainer;

/**
 * Pseudo-LSTM Service using GRU (Gated Recurrent Unit)
 *
 * Wrapper service that uses GRUCell, GRUTrainer, and GRUPredictor.
 * Maintains backward compatibility with existing code.
 *
 * @implements LSTMInterface
 */
class PseudoLSTMService implements LSTMInterface
{
    /**
     * GRU cell instance.
     */
    protected GRUCell $cell;

    /**
     * GRU trainer instance.
     */
    protected GRUTrainer $trainer;

    /**
     * GRU predictor instance.
     */
    protected GRUPredictor $predictor;

    /**
     * Debug mode flag.
     */
    protected bool $debugMode = false;

    /**
     * Constructor.
     *
     * @param  int  $inputSize  Size of input (window size)
     * @param  int  $hiddenSize  Size of hidden state
     * @param  float  $dropoutRate  Dropout rate
     */
    public function __construct(int $inputSize = 24, int $hiddenSize = 8, float $dropoutRate = 0.25)
    {
        $this->cell = new GRUCell($inputSize, $hiddenSize, $dropoutRate);
        $this->trainer = new GRUTrainer($this->cell);
        $this->predictor = new GRUPredictor($this->cell);
    }

    /**
     * Train GRU on residual data.
     *
     * @param  array<float>  $residuals  Training residuals (standardized)
     * @param  int  $window  Input window size
     * @param  int  $epochs  Number of training epochs
     * @param  float  $learningRate  Initial learning rate
     * @return array<string, mixed> Training history with losses
     */
    public function train(array $residuals, int $window = 12, int $epochs = 10, float $learningRate = 0.01): array
    {
        if ($this->debugMode) {
            $this->cell->setDebugMode(true);
            $this->trainer->setDebugMode(true);
        }

        return $this->trainer->train($residuals, $window, $epochs, $learningRate);
    }

    /**
     * Predict next value using trained GRU.
     *
     * @param  array<int, float>  $lastWindow  Last window of residuals (scaled)
     * @return float Predicted residual (scaled)
     */
    public function predict(array $lastWindow): float
    {
        if ($this->debugMode) {
            $this->cell->setDebugMode(true);
            $this->predictor->setDebugMode(true);
        }

        return $this->predictor->predict($lastWindow);
    }

    /**
     * Get model parameters for logging.
     *
     * @return array<string, mixed> Model parameters
     */
    public function getParameters(): array
    {
        return $this->cell->getParameters();
    }

    /**
     * Set debug mode.
     *
     * @param  bool  $enabled  Enable debug mode
     */
    public function setDebugMode(bool $enabled): void
    {
        $this->debugMode = $enabled;
        $this->cell->setDebugMode($enabled);
        $this->trainer->setDebugMode($enabled);
        $this->predictor->setDebugMode($enabled);
    }
}
