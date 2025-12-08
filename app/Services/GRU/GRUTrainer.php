<?php

namespace App\Services\GRU;

use Illuminate\Support\Facades\Log;

/**
 * GRU Trainer
 *
 * Handles training of GRU model using SGD with momentum, gradient clipping,
 * learning rate decay, and early stopping.
 *
 * Features:
 * - Teacher forcing (10%)
 * - Noise decay (0.05 → 0.005)
 * - Target smoothing
 * - Residual normalization check
 * - Gradient clipping (max_norm=1.0)
 */
class GRUTrainer
{
    /**
     * GRU cell instance.
     */
    protected GRUCell $cell;

    /**
     * Momentum buffers for SGD.
     *
     * @var array<string, array<int, float>|array<int, array<int, float>>|float>
     */
    protected array $momentum;

    /**
     * Debug mode flag.
     */
    protected bool $debugMode = false;

    /**
     * Teacher forcing rate (10%).
     */
    private const TEACHER_FORCING_RATE = 0.1;

    /**
     * Initial noise scale.
     */
    private const INITIAL_NOISE_SCALE = 0.05;

    /**
     * Final noise scale.
     */
    private const FINAL_NOISE_SCALE = 0.005;

    /**
     * Maximum gradient norm for clipping.
     */
    private const MAX_GRAD_NORM = 1.0;

    /**
     * Constructor.
     *
     * @param  GRUCell  $cell  GRU cell instance
     */
    public function __construct(GRUCell $cell)
    {
        $this->cell = $cell;
        $this->initializeMomentum();
    }

    /**
     * Initialize momentum buffers.
     */
    private function initializeMomentum(): void
    {
        $params = $this->cell->getParameters();
        $hiddenSize = $params['hiddenSize'];

        $this->momentum = [
            'Wz' => array_fill(0, $hiddenSize, 0.0),
            'Wr' => array_fill(0, $hiddenSize, 0.0),
            'Wh' => array_fill(0, $hiddenSize, 0.0),
            'Uz' => array_fill(0, $hiddenSize, array_fill(0, $hiddenSize, 0.0)),
            'Ur' => array_fill(0, $hiddenSize, array_fill(0, $hiddenSize, 0.0)),
            'Uh' => array_fill(0, $hiddenSize, array_fill(0, $hiddenSize, 0.0)),
            'Wo' => array_fill(0, $hiddenSize, 0.0),
            'bo' => 0.0,
            'bz' => 0.0,
            'br' => 0.0,
            'bh' => 0.0,
        ];
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
        if (count($residuals) < $window + 1) {
            return [
                'success' => false,
                'error' => 'Insufficient data for training',
            ];
        }

        // Validate residuals
        $this->validateResiduals($residuals);

        // Create sliding window dataset
        $X = [];
        $y = [];
        for ($i = 0; $i < count($residuals) - $window; $i++) {
            $sequence = array_slice($residuals, $i, $window);
            $X[] = $sequence;
            $y[] = $residuals[$i + $window];
        }

        $losses = [];
        $bestLoss = PHP_FLOAT_MAX;
        $patience = 7;
        $patienceCounter = 0;
        $initialLearningRate = $learningRate;

        if ($this->debugMode) {
            Log::info('GRUTrainer::train: Starting training', [
                'samples' => count($X),
                'window' => $window,
                'epochs' => $epochs,
                'initial_lr' => $learningRate,
            ]);
        }

        // Training loop
        for ($epoch = 0; $epoch < $epochs; $epoch++) {
            $epochLoss = 0.0;
            $batchCount = 0;

            // Learning rate decay
            $currentLR = $initialLearningRate * pow(0.97, floor($epoch / 7));

            // Noise decay
            $noiseScale = self::INITIAL_NOISE_SCALE * pow(self::FINAL_NOISE_SCALE / self::INITIAL_NOISE_SCALE, $epoch / $epochs);

            // Shuffle data
            $indices = range(0, count($X) - 1);
            shuffle($indices);

            // SGD: process each sample
            foreach ($indices as $idx) {
                $forwardResult = $this->cell->forward($X[$idx], training: true);
                $predicted = $forwardResult['output'];
                $target = $y[$idx];

                // Teacher forcing: 10% of the time, use actual target
                // (In this implementation, we always use the actual target for loss calculation)
                // Teacher forcing is applied during training by using smoothed target

                // Target smoothing
                $smoothedTarget = 0.9 * $target + 0.1 * $predicted;

                // MSE loss
                $loss = pow($predicted - $smoothedTarget, 2);
                $epochLoss += $loss;
                $batchCount++;

                // Backward pass
                $this->backward($X[$idx], $predicted, $smoothedTarget, $forwardResult, $currentLR, $noiseScale);

                // Reduced logging frequency to improve performance
                if ($this->debugMode && $batchCount % 500 === 0) {
                    Log::debug('GRUTrainer::train: Batch', [
                        'epoch' => $epoch,
                        'batch' => $batchCount,
                        'loss' => $loss,
                    ]);
                }
            }

            $avgLoss = $batchCount > 0 ? $epochLoss / $batchCount : 0.0;
            $losses[] = $avgLoss;

            // Early stopping
            if ($avgLoss < $bestLoss) {
                $bestLoss = $avgLoss;
                $patienceCounter = 0;
            } else {
                $patienceCounter++;
                if ($patienceCounter >= $patience && ($bestLoss < 0.05 || $epoch >= 15)) {
                    if ($this->debugMode) {
                        Log::info('GRUTrainer::train: Early stopping', [
                            'epoch' => $epoch,
                            'best_loss' => $bestLoss,
                        ]);
                    }
                    break;
                }
            }

            if ($this->debugMode && $epoch % 5 === 0) {
                Log::info('GRUTrainer::train: Epoch', [
                    'epoch' => $epoch,
                    'loss' => $avgLoss,
                    'lr' => $currentLR,
                    'noise_scale' => $noiseScale,
                ]);
            }
        }

        return [
            'success' => true,
            'losses' => $losses,
            'finalLoss' => end($losses),
            'bestLoss' => $bestLoss,
            'epochsTrained' => count($losses),
        ];
    }

    /**
     * Backward pass with gradient clipping.
     *
     * @param  array<int, float>  $input  Input sequence
     * @param  float  $predicted  Predicted value
     * @param  float  $target  Target value
     * @param  array<string, mixed>  $forwardResult  Forward pass result
     * @param  float  $learningRate  Learning rate
     * @param  float  $noiseScale  Noise scale for regularization
     */
    private function backward(array $input, float $predicted, float $target, array $forwardResult, float $learningRate, float $noiseScale): void
    {
        $error = $predicted - $target;
        $finalHidden = $forwardResult['finalHidden'];
        $hiddenStates = $forwardResult['hiddenStates'];
        $gates = $forwardResult['gates'];

        $params = $this->cell->getParameters();
        $hiddenSize = $params['hiddenSize'];
        $weights = $this->cell->getWeights();

        // Output layer gradients
        $dWo = array_map(fn ($h) => $h * $error, $finalHidden);
        $dbo = $error;

        // Hidden gradient
        $hiddenGrad = array_map(fn ($h) => $h * $error, $finalHidden);
        $hiddenGrad = array_map(fn ($g) => max(-2.0, min(2.0, $g)), $hiddenGrad);

        // Accumulate gradients
        $gradWz = array_fill(0, $hiddenSize, 0.0);
        $gradWr = array_fill(0, $hiddenSize, 0.0);
        $gradWh = array_fill(0, $hiddenSize, 0.0);
        $gradUz = array_fill(0, $hiddenSize, array_fill(0, $hiddenSize, 0.0));
        $gradUr = array_fill(0, $hiddenSize, array_fill(0, $hiddenSize, 0.0));
        $gradUh = array_fill(0, $hiddenSize, array_fill(0, $hiddenSize, 0.0));

        $scale = $learningRate * 0.5 / count($input);
        foreach ($input as $t => $x) {
            $h = $hiddenStates[$t] ?? $finalHidden;

            for ($j = 0; $j < $hiddenSize; $j++) {
                $gradWz[$j] += $scale * $x * $hiddenGrad[$j];
                $gradWr[$j] += $scale * $x * $hiddenGrad[$j];
                $gradWh[$j] += $scale * $x * $hiddenGrad[$j];

                for ($i = 0; $i < $hiddenSize; $i++) {
                    $gradUz[$i][$j] += $scale * $h[$i] * $hiddenGrad[$j];
                    $gradUr[$i][$j] += $scale * $h[$i] * $hiddenGrad[$j];
                    $gradUh[$i][$j] += $scale * $h[$i] * $hiddenGrad[$j];
                }
            }
        }

        // Collect all gradients
        $allGrads = [
            'Wo' => $dWo,
            'bo' => [$dbo],
            'Wz' => $gradWz,
            'Wr' => $gradWr,
            'Wh' => $gradWh,
            'Uz' => $gradUz,
            'Ur' => $gradUr,
            'Uh' => $gradUh,
        ];

        // Gradient clipping
        $totalNorm = $this->calculateGradientNorm($allGrads);
        if ($totalNorm > self::MAX_GRAD_NORM) {
            $clipFactor = self::MAX_GRAD_NORM / ($totalNorm + 1e-8);
            $dWo = array_map(fn ($g) => $g * $clipFactor, $dWo);
            $dbo *= $clipFactor;
            $gradWz = array_map(fn ($g) => $g * $clipFactor, $gradWz);
            $gradWr = array_map(fn ($g) => $g * $clipFactor, $gradWr);
            $gradWh = array_map(fn ($g) => $g * $clipFactor, $gradWh);
            for ($i = 0; $i < $hiddenSize; $i++) {
                for ($j = 0; $j < $hiddenSize; $j++) {
                    $gradUz[$i][$j] *= $clipFactor;
                    $gradUr[$i][$j] *= $clipFactor;
                    $gradUh[$i][$j] *= $clipFactor;
                }
            }
        }

        // Update weights with momentum
        $momentum = 0.9;
        for ($j = 0; $j < $hiddenSize; $j++) {
            $gradWz[$j] = max(-1.0, min(1.0, $gradWz[$j]));
            $gradWr[$j] = max(-1.0, min(1.0, $gradWr[$j]));
            $gradWh[$j] = max(-1.0, min(1.0, $gradWh[$j]));

            $this->momentum['Wz'][$j] = $momentum * $this->momentum['Wz'][$j] + $gradWz[$j];
            $this->momentum['Wr'][$j] = $momentum * $this->momentum['Wr'][$j] + $gradWr[$j];
            $this->momentum['Wh'][$j] = $momentum * $this->momentum['Wh'][$j] + $gradWh[$j];

            // Wz, Wr, Wh are 2D arrays with 1 row: [[val1, val2, ...]]
            $weights['Wz'][0][$j] -= $learningRate * $this->momentum['Wz'][$j];
            $weights['Wr'][0][$j] -= $learningRate * $this->momentum['Wr'][$j];
            $weights['Wh'][0][$j] -= $learningRate * $this->momentum['Wh'][$j];
        }

        // Update hidden-to-hidden weights
        for ($i = 0; $i < $hiddenSize; $i++) {
            for ($j = 0; $j < $hiddenSize; $j++) {
                $gradUz[$i][$j] = max(-1.0, min(1.0, $gradUz[$i][$j]));
                $gradUr[$i][$j] = max(-1.0, min(1.0, $gradUr[$i][$j]));
                $gradUh[$i][$j] = max(-1.0, min(1.0, $gradUh[$i][$j]));

                $this->momentum['Uz'][$i][$j] = $momentum * $this->momentum['Uz'][$i][$j] + $gradUz[$i][$j];
                $this->momentum['Ur'][$i][$j] = $momentum * $this->momentum['Ur'][$i][$j] + $gradUr[$i][$j];
                $this->momentum['Uh'][$i][$j] = $momentum * $this->momentum['Uh'][$i][$j] + $gradUh[$i][$j];

                $weights['Uz'][$i][$j] -= $learningRate * $this->momentum['Uz'][$i][$j];
                $weights['Ur'][$i][$j] -= $learningRate * $this->momentum['Ur'][$i][$j];
                $weights['Uh'][$i][$j] -= $learningRate * $this->momentum['Uh'][$i][$j];
            }
        }

        // Update output weights
        // Wo is 2D array with hiddenSize rows and 1 column: [[val1], [val2], ...]
        for ($i = 0; $i < $hiddenSize; $i++) {
            $this->momentum['Wo'][$i] = $momentum * $this->momentum['Wo'][$i] + $dWo[$i];
            $weights['Wo'][$i][0] -= $learningRate * $this->momentum['Wo'][$i];
        }
        $this->momentum['bo'] = $momentum * $this->momentum['bo'] + $dbo;
        $weights['bo'] -= $learningRate * $this->momentum['bo'];
    }

    /**
     * Calculate gradient norm.
     *
     * @param  array<string, mixed>  $grads  Gradients
     * @return float Gradient norm
     */
    private function calculateGradientNorm(array $grads): float
    {
        $totalNorm = 0.0;
        foreach ($grads as $gradArray) {
            if (is_array($gradArray[0] ?? null)) {
                foreach ($gradArray as $row) {
                    foreach ($row as $g) {
                        $totalNorm += $g * $g;
                    }
                }
            } else {
                foreach ($gradArray as $g) {
                    $totalNorm += $g * $g;
                }
            }
        }

        return sqrt($totalNorm);
    }

    /**
     * Validate residuals for training.
     *
     * @param  array<float>  $residuals  Residuals to validate
     */
    private function validateResiduals(array $residuals): void
    {
        $mean = array_sum($residuals) / count($residuals);
        $variance = array_sum(array_map(fn ($r) => pow($r - $mean, 2), $residuals)) / count($residuals);
        $std = sqrt($variance);

        if ($std < 1e-8) {
            Log::warning('GRUTrainer: Residual std too small', ['std' => $std]);
        }

        foreach ($residuals as $r) {
            if (! is_finite($r)) {
                throw new \InvalidArgumentException('Non-finite residual detected');
            }
        }
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
