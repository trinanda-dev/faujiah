<?php

namespace App\Services\GRU;

use Illuminate\Support\Facades\Log;

/**
 * GRU Cell Implementation
 *
 * Implements a single GRU cell with forward pass.
 * Architecture:
 * - Update gate: z_t = σ(Wz * x_t + Uz * h_{t-1} + bz)
 * - Reset gate: r_t = σ(Wr * x_t + Ur * h_{t-1} + br)
 * - Candidate: h̃_t = tanh(Wh * x_t + Uh * (r_t ⊙ h_{t-1}) + bh)
 * - Hidden: h_t = (1 - z_t) ⊙ h̃_t + z_t ⊙ h_{t-1}
 *
 * Features:
 * - Xavier initialization
 * - Gradient clipping
 * - Debug mode for forward pass logging
 */
class GRUCell
{
    /**
     * Update gate weights (input).
     *
     * @var array<int, array<int, float>>
     */
    protected array $Wz;

    /**
     * Update gate weights (hidden).
     *
     * @var array<int, array<int, float>>
     */
    protected array $Uz;

    /**
     * Update gate bias.
     */
    protected float $bz;

    /**
     * Reset gate weights (input).
     *
     * @var array<int, array<int, float>>
     */
    protected array $Wr;

    /**
     * Reset gate weights (hidden).
     *
     * @var array<int, array<int, float>>
     */
    protected array $Ur;

    /**
     * Reset gate bias.
     */
    protected float $br;

    /**
     * Candidate weights (input).
     *
     * @var array<int, array<int, float>>
     */
    protected array $Wh;

    /**
     * Candidate weights (hidden).
     *
     * @var array<int, array<int, float>>
     */
    protected array $Uh;

    /**
     * Candidate bias.
     */
    protected float $bh;

    /**
     * Output weights.
     *
     * @var array<int, array<int, float>>
     */
    protected array $Wo;

    /**
     * Output bias.
     */
    protected float $bo;

    /**
     * Hidden state size.
     */
    protected int $hiddenSize;

    /**
     * Input size (window size).
     */
    protected int $inputSize;

    /**
     * Dropout rate.
     */
    protected float $dropoutRate;

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
        $this->inputSize = $inputSize;
        $this->hiddenSize = $hiddenSize;
        $this->dropoutRate = $dropoutRate;

        // Initialize weights with Xavier/Glorot initialization
        $this->Wz = $this->xavierInit(1, $hiddenSize);
        $this->Uz = $this->xavierInit($hiddenSize, $hiddenSize);
        $this->bz = 0.0;

        $this->Wr = $this->xavierInit(1, $hiddenSize);
        $this->Ur = $this->xavierInit($hiddenSize, $hiddenSize);
        $this->br = 0.0;

        $this->Wh = $this->xavierInit(1, $hiddenSize);
        $this->Uh = $this->xavierInit($hiddenSize, $hiddenSize);
        $this->bh = 0.0;

        // Output layer
        $this->Wo = $this->xavierInit($hiddenSize, 1);
        $this->bo = 0.0;
    }

    /**
     * Xavier/Glorot initialization for better gradient flow.
     *
     * Formula: scale = sqrt(1 / (fan_in + fan_out))
     *
     * @param  int  $rows  Number of rows
     * @param  int  $cols  Number of columns
     * @return array<int, array<int, float>> Initialized weights (always 2D array)
     */
    private function xavierInit(int $rows, int $cols): array
    {
        $scale = sqrt(1.0 / ($rows + $cols));
        $matrix = [];

        for ($i = 0; $i < $rows; $i++) {
            $matrix[$i] = [];
            for ($j = 0; $j < $cols; $j++) {
                $matrix[$i][$j] = (mt_rand() / mt_getrandmax() - 0.5) * 2 * $scale;
            }
        }

        return $matrix;
    }

    /**
     * Sigmoid activation function with numerical stability.
     *
     * Formula: σ(x) = 1 / (1 + exp(-x))
     * Clamped to prevent overflow.
     *
     * @param  float  $x  Input value
     * @return float Sigmoid output
     */
    protected function sigmoid(float $x): float
    {
        $x = max(-500, min(500, $x)); // Clamp to prevent overflow

        return 1.0 / (1.0 + exp(-$x));
    }

    /**
     * Tanh activation function.
     *
     * @param  float  $x  Input value
     * @return float Tanh output
     */
    protected function tanhActivation(float $x): float
    {
        return tanh($x);
    }

    /**
     * Matrix-vector multiplication.
     *
     * @param  array<int, array<int, float>>  $matrix  Matrix [rows x cols]
     * @param  array<int, float>  $vector  Vector [cols]
     * @return array<int, float> Result vector [rows]
     */
    protected function matVec(array $matrix, array $vector): array
    {
        $result = [];
        foreach ($matrix as $row) {
            $sum = 0.0;
            for ($i = 0; $i < count($row); $i++) {
                if (! isset($vector[$i])) {
                    throw new \Exception('Vector dimension mismatch: expected '.count($row).' elements, got '.count($vector));
                }
                $sum += $row[$i] * $vector[$i];
            }
            $result[] = $sum;
        }

        return $result;
    }

    /**
     * Matrix-scalar multiplication (for single input value).
     *
     * @param  array<int, array<int, float>>|array<int, float>  $matrix  Matrix [1 x cols] or [cols]
     * @param  float  $scalar  Scalar value
     * @return array<int, float> Result vector [cols]
     */
    protected function matScalar(array $matrix, float $scalar): array
    {
        // Handle 2D array (1 row, multiple cols): [[0.1, 0.2, 0.3]]
        if (is_array($matrix[0] ?? null)) {
            if (count($matrix) !== 1) {
                throw new \Exception('Matrix must have 1 row for scalar multiplication, got '.count($matrix));
            }

            $result = [];
            foreach ($matrix[0] as $val) {
                $result[] = $val * $scalar;
            }

            return $result;
        }

        // Handle 1D array: [0.1, 0.2, 0.3]
        $result = [];
        foreach ($matrix as $val) {
            $result[] = $val * $scalar;
        }

        return $result;
    }

    /**
     * Element-wise multiplication.
     *
     * @param  array<int, float>  $a  First vector
     * @param  array<int, float>  $b  Second vector
     * @return array<int, float> Result vector
     */
    protected function elementWise(array $a, array $b): array
    {
        $result = [];
        for ($i = 0; $i < count($a); $i++) {
            $result[] = $a[$i] * $b[$i];
        }

        return $result;
    }

    /**
     * Element-wise addition.
     *
     * @param  array<int, float>  $a  First vector
     * @param  array<int, float>  $b  Second vector
     * @return array<int, float> Result vector
     */
    protected function elementAdd(array $a, array $b): array
    {
        $result = [];
        for ($i = 0; $i < count($a); $i++) {
            $result[] = $a[$i] + $b[$i];
        }

        return $result;
    }

    /**
     * Element-wise subtraction.
     *
     * @param  array<int, float>  $a  First vector
     * @param  array<int, float>  $b  Second vector
     * @return array<int, float> Result vector
     */
    protected function elementSub(array $a, array $b): array
    {
        $result = [];
        for ($i = 0; $i < count($a); $i++) {
            $result[] = $a[$i] - $b[$i];
        }

        return $result;
    }

    /**
     * Scalar multiplication.
     *
     * @param  array<int, float>  $vec  Vector
     * @param  float  $scalar  Scalar
     * @return array<int, float> Result vector
     */
    protected function scalarMul(array $vec, float $scalar): array
    {
        return array_map(fn ($v) => $v * $scalar, $vec);
    }

    /**
     * Apply dropout to hidden state (training only).
     *
     * @param  array<int, float>  $h  Hidden state
     * @param  bool  $training  Training mode flag
     * @return array<int, float> Hidden state with dropout applied
     */
    protected function applyDropout(array $h, bool $training = true): array
    {
        if (! $training || $this->dropoutRate <= 0) {
            return $h;
        }

        $result = [];
        for ($i = 0; $i < count($h); $i++) {
            if ((mt_rand() / mt_getrandmax()) < $this->dropoutRate) {
                $result[] = 0.0;
            } else {
                $result[] = $h[$i] / (1.0 - $this->dropoutRate);
            }
        }

        return $result;
    }

    /**
     * Apply gradient clipping to hidden state.
     *
     * @param  array<int, float>  $h  Hidden state
     * @param  float  $maxNorm  Maximum norm
     * @return array<int, float> Clipped hidden state
     */
    protected function clipHiddenState(array $h, float $maxNorm = 5.0): array
    {
        $clipped = [];
        foreach ($h as $val) {
            if (abs($val) > $maxNorm) {
                $clipped[] = ($val > 0 ? $maxNorm : -$maxNorm);
            } else {
                $clipped[] = $val;
            }
        }

        return $clipped;
    }

    /**
     * Forward pass through GRU cell.
     *
     * @param  array<int, float>  $input  Input sequence (window)
     * @param  bool  $training  Training mode flag
     * @return array<string, mixed> Forward pass result with output, hidden states, and gates
     */
    public function forward(array $input, bool $training = true): array
    {
        $hiddenStates = [];
        $gates = [];

        // Initialize hidden state with small random values
        $h = [];
        for ($i = 0; $i < $this->hiddenSize; $i++) {
            $h[] = (mt_rand() / mt_getrandmax() - 0.5) * 0.2;
        }

        // Process each timestep in the window
        foreach ($input as $t => $x) {
            // Update gate: z_t = σ(Wz * x + Uz * h + bz)
            $z = $this->matScalar($this->Wz, $x);
            $z = $this->elementAdd($z, $this->matVec($this->Uz, $h));
            $z = array_map([$this, 'sigmoid'], $this->elementAdd($z, array_fill(0, $this->hiddenSize, $this->bz)));

            // Reset gate: r_t = σ(Wr * x + Ur * h + br)
            $r = $this->matScalar($this->Wr, $x);
            $r = $this->elementAdd($r, $this->matVec($this->Ur, $h));
            $r = array_map([$this, 'sigmoid'], $this->elementAdd($r, array_fill(0, $this->hiddenSize, $this->br)));

            // Candidate: h̃_t = tanh(Wh * x + Uh * (r ⊙ h) + bh)
            $rh = $this->elementWise($r, $h);
            $hTilde = $this->matScalar($this->Wh, $x);
            $hTilde = $this->elementAdd($hTilde, $this->matVec($this->Uh, $rh));
            $hTilde = array_map([$this, 'tanhActivation'], $this->elementAdd($hTilde, array_fill(0, $this->hiddenSize, $this->bh)));

            // Hidden: h_t = (1 - z) ⊙ h̃ + z ⊙ h
            $oneMinusZ = $this->elementSub(array_fill(0, $this->hiddenSize, 1.0), $z);
            $h = $this->elementAdd(
                $this->elementWise($oneMinusZ, $hTilde),
                $this->elementWise($z, $h)
            );

            // Apply dropout during training
            if ($training) {
                $h = $this->applyDropout($h, $training);
            }

            // Gradient clipping to prevent explosion
            $h = $this->clipHiddenState($h, 5.0);

            // Validate hidden state
            foreach ($h as $val) {
                if (! is_finite($val)) {
                    Log::error('GRUCell: Non-finite hidden state detected', [
                        'timestep' => $t,
                        'h' => $h,
                    ]);
                    throw new \RuntimeException("Non-finite hidden state at timestep {$t}");
                }
            }

            $hiddenStates[] = $h;
            $gates[] = ['z' => $z, 'r' => $r, 'hTilde' => $hTilde];

            // Debug logging (only log summary, not every timestep to avoid performance issues)
            if ($this->debugMode && $t % 6 === 0) {
                // Only log every 6th timestep to reduce log volume
                Log::debug('GRUCell::forward: Timestep', [
                    't' => $t,
                    'x' => $x,
                    'h_t_norm' => sqrt(array_sum(array_map(fn ($v) => $v * $v, $h))),
                ]);
            }
        }

        // Output: y = Wo * h + bo
        $output = $this->matVec($this->Wo, $h)[0] + $this->bo;

        // Apply TANH activation to control output range
        $output = $this->tanhActivation($output);

        // Validate output
        if (! is_finite($output)) {
            Log::error('GRUCell: Non-finite output detected', [
                'output' => $output,
                'final_h' => $h,
            ]);
            throw new \RuntimeException('Non-finite output from GRU cell');
        }

        // Only log output summary in debug mode (not every forward pass)
        if ($this->debugMode && mt_rand() / mt_getrandmax() < 0.01) {
            // Only log 1% of outputs to reduce log volume
            Log::debug('GRUCell::forward: Output', [
                'output' => $output,
            ]);
        }

        return [
            'output' => $output,
            'hiddenStates' => $hiddenStates,
            'gates' => $gates,
            'finalHidden' => $h,
        ];
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

    /**
     * Get model parameters.
     *
     * @return array<string, mixed> Model parameters
     */
    public function getParameters(): array
    {
        return [
            'Wz' => $this->Wz,
            'Uz' => $this->Uz,
            'bz' => $this->bz,
            'Wr' => $this->Wr,
            'Ur' => $this->Ur,
            'br' => $this->br,
            'Wh' => $this->Wh,
            'Uh' => $this->Uh,
            'bh' => $this->bh,
            'Wo' => $this->Wo,
            'bo' => $this->bo,
            'hiddenSize' => $this->hiddenSize,
            'inputSize' => $this->inputSize,
        ];
    }

    /**
     * Set model parameters (for loading saved models).
     *
     * @param  array<string, mixed>  $params  Model parameters
     */
    public function setParameters(array $params): void
    {
        $this->Wz = $params['Wz'];
        $this->Uz = $params['Uz'];
        $this->bz = $params['bz'];
        $this->Wr = $params['Wr'];
        $this->Ur = $params['Ur'];
        $this->br = $params['br'];
        $this->Wh = $params['Wh'];
        $this->Uh = $params['Uh'];
        $this->bh = $params['bh'];
        $this->Wo = $params['Wo'];
        $this->bo = $params['bo'];
        $this->hiddenSize = $params['hiddenSize'];
        $this->inputSize = $params['inputSize'];
    }

    /**
     * Get weights for gradient updates (used by trainer).
     *
     * @return array<string, mixed> Weight references
     */
    public function getWeights(): array
    {
        return [
            'Wz' => &$this->Wz,
            'Uz' => &$this->Uz,
            'bz' => &$this->bz,
            'Wr' => &$this->Wr,
            'Ur' => &$this->Ur,
            'br' => &$this->br,
            'Wh' => &$this->Wh,
            'Uh' => &$this->Uh,
            'bh' => &$this->bh,
            'Wo' => &$this->Wo,
            'bo' => &$this->bo,
        ];
    }
}
