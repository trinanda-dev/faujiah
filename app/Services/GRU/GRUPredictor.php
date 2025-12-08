<?php

namespace App\Services\GRU;

use Illuminate\Support\Facades\Log;

/**
 * GRU Predictor
 *
 * Handles prediction using trained GRU model.
 * Features:
 * - Iterative forecasting
 * - Noise injection to prevent collapse
 * - Output validation
 */
class GRUPredictor
{
    /**
     * GRU cell instance.
     */
    protected GRUCell $cell;

    /**
     * Debug mode flag.
     */
    protected bool $debugMode = false;

    /**
     * Constructor.
     *
     * @param  GRUCell  $cell  GRU cell instance
     */
    public function __construct(GRUCell $cell)
    {
        $this->cell = $cell;
    }

    /**
     * Predict next value using trained GRU.
     *
     * @param  array<int, float>  $lastWindow  Last window of residuals (scaled)
     * @param  float  $noiseScale  Noise scale for regularization (default: 0.0)
     * @return float Predicted residual (scaled)
     */
    public function predict(array $lastWindow, float $noiseScale = 0.0): float
    {
        $params = $this->cell->getParameters();
        $inputSize = $params['inputSize'];

        if (count($lastWindow) !== $inputSize) {
            throw new \InvalidArgumentException("Window size must be {$inputSize}, got ".count($lastWindow));
        }

        // Validate input
        foreach ($lastWindow as $val) {
            if (! is_finite($val)) {
                throw new \InvalidArgumentException('Non-finite value in input window');
            }
        }

        // Forward pass (no training mode)
        $forwardResult = $this->cell->forward($lastWindow, training: false);
        $output = $forwardResult['output'];

        // Add noise if specified (for iterative forecasting)
        if ($noiseScale > 0.0) {
            $noise = (mt_rand() / mt_getrandmax() - 0.5) * 2 * $noiseScale;
            $output += $noise;
        }

        // Validate output
        if (! is_finite($output)) {
            Log::warning('GRUPredictor: Non-finite prediction, using 0', [
                'output' => $output,
            ]);

            return 0.0;
        }

        if ($this->debugMode) {
            Log::debug('GRUPredictor::predict', [
                'output' => $output,
                'noise_scale' => $noiseScale,
            ]);
        }

        return $output;
    }

    /**
     * Predict multiple steps iteratively.
     *
     * @param  array<int, float>  $initialWindow  Initial window
     * @param  int  $steps  Number of steps to predict
     * @param  float  $noiseScale  Noise scale (decays over time)
     * @return array<int, float> Predicted values
     */
    public function predictMultiple(array $initialWindow, int $steps, float $noiseScale = 0.0): array
    {
        $predictions = [];
        $currentWindow = $initialWindow;

        for ($step = 0; $step < $steps; $step++) {
            // Decay noise over time
            $currentNoiseScale = $noiseScale * pow(0.9, $step);

            $pred = $this->predict($currentWindow, $currentNoiseScale);
            $predictions[] = $pred;

            // Update window: shift left, append prediction
            array_shift($currentWindow);
            $currentWindow[] = $pred;
        }

        return $predictions;
    }

    /**
     * Set debug mode.
     *
     * @param  bool  $enabled  Enable debug mode
     */
    public function setDebugMode(bool $enabled): void
    {
        $this->debugMode = $enabled;
    }
}
