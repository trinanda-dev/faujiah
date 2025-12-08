<?php

namespace App\Services;

use App\Services\Contracts\ScalerInterface;
use Illuminate\Support\Facades\Log;

/**
 * StandardScaler Service (Z-score normalization)
 *
 * Performs standardization: scaled = (value - mean) / std
 * Inverse: unscaled = (scaled * std) + mean
 *
 * Features:
 * - Numerical stability checks (NaN, INF, zero std)
 * - Fallback to std=1.0 if std < 1e-8
 * - Comprehensive validation
 *
 * @implements ScalerInterface
 */
class ScalerService implements ScalerInterface
{
    /**
     * Minimum standard deviation threshold for stability.
     * If std < this value, use fallback std = 1.0
     */
    private const MIN_STD_THRESHOLD = 1e-8;

    /**
     * Fit StandardScaler on data and transform (z-score normalization).
     *
     * Formula: scaled = (value - mean) / std
     *
     * @param  array<float>  $data  Input data to scale
     * @return array{0: array<float>, 1: array{mean: float, std: float}|null} [scaled_data, params]
     */
    public function fitTransformStandard(array $data): array
    {
        // Validate input
        if (empty($data)) {
            return [[], null];
        }

        // Check for NaN/INF
        $this->validateData($data, 'fitTransformStandard');

        // Calculate mean
        $mean = array_sum($data) / count($data);

        // Check for NaN/INF in mean
        if (! is_finite($mean)) {
            Log::error('ScalerService: Non-finite mean calculated', ['mean' => $mean]);
            throw new \InvalidArgumentException('Cannot calculate mean: non-finite value detected');
        }

        // Calculate variance and standard deviation
        $variance = 0.0;
        foreach ($data as $value) {
            $diff = $value - $mean;
            $variance += $diff * $diff;
        }
        $std = sqrt($variance / count($data));

        // Handle zero or very small standard deviation
        if ($std < self::MIN_STD_THRESHOLD) {
            Log::warning('ScalerService: Standard deviation too small, using fallback', [
                'std' => $std,
                'fallback_std' => 1.0,
            ]);

            return [array_fill(0, count($data), 0.0), ['mean' => $mean, 'std' => 1.0]];
        }

        // Check for NaN/INF in std
        if (! is_finite($std)) {
            Log::error('ScalerService: Non-finite std calculated', ['std' => $std]);
            throw new \InvalidArgumentException('Cannot calculate std: non-finite value detected');
        }

        // Transform data
        $scaled = [];
        foreach ($data as $value) {
            $scaledValue = ($value - $mean) / $std;

            // Validate scaled value
            if (! is_finite($scaledValue)) {
                Log::warning('ScalerService: Non-finite scaled value detected, using 0', [
                    'value' => $value,
                    'mean' => $mean,
                    'std' => $std,
                ]);
                $scaledValue = 0.0;
            }

            $scaled[] = $scaledValue;
        }

        $params = ['mean' => $mean, 'std' => $std];

        return [$scaled, $params];
    }

    /**
     * Transform data using fitted StandardScaler parameters.
     *
     * @param  array<float>  $data  Data to transform
     * @param  array{mean: float, std: float}  $params  Fitted parameters
     * @return array<float> Scaled data (z-score normalized)
     */
    public function transformStandard(array $data, array $params): array
    {
        $this->validateParams($params);
        $this->validateData($data, 'transformStandard');

        $mean = $params['mean'];
        $std = $params['std'];

        // Use fallback if std is too small
        if ($std < self::MIN_STD_THRESHOLD) {
            return array_fill(0, count($data), 0.0);
        }

        $scaled = [];
        foreach ($data as $value) {
            $scaledValue = ($value - $mean) / $std;

            if (! is_finite($scaledValue)) {
                Log::warning('ScalerService: Non-finite scaled value in transform', [
                    'value' => $value,
                ]);
                $scaledValue = 0.0;
            }

            $scaled[] = $scaledValue;
        }

        return $scaled;
    }

    /**
     * Inverse transform standardized data back to original scale.
     *
     * Formula: unscaled = (scaled * std) + mean
     *
     * @param  array<float>  $scaled  Scaled data (z-score normalized)
     * @param  array{mean: float, std: float}  $params  Fitted parameters
     * @return array<float> Unscaled data
     */
    public function inverseTransformStandard(array $scaled, array $params): array
    {
        $this->validateParams($params);
        $this->validateData($scaled, 'inverseTransformStandard');

        $mean = $params['mean'];
        $std = $params['std'];

        $unscaled = [];
        foreach ($scaled as $value) {
            $unscaledValue = ($value * $std) + $mean;

            if (! is_finite($unscaledValue)) {
                Log::warning('ScalerService: Non-finite unscaled value detected', [
                    'scaled' => $value,
                    'mean' => $mean,
                    'std' => $std,
                ]);
                $unscaledValue = $mean; // Fallback to mean
            }

            $unscaled[] = $unscaledValue;
        }

        return $unscaled;
    }

    /**
     * Check if scaler is stable (std > threshold).
     *
     * @param  array{mean: float, std: float}  $params  Scaler parameters
     * @return bool True if stable
     */
    public function isStable(array $params): bool
    {
        $this->validateParams($params);

        return $params['std'] >= self::MIN_STD_THRESHOLD && is_finite($params['std']);
    }

    /**
     * Get scaler parameters with validation.
     *
     * @param  array{mean: float, std: float}  $params  Scaler parameters
     * @return array{mean: float, std: float, stable: bool} Parameters with validation
     */
    public function getParams(array $params): array
    {
        $this->validateParams($params);

        return [
            'mean' => $params['mean'],
            'std' => $params['std'],
            'stable' => $this->isStable($params),
        ];
    }

    /**
     * Describe scaler statistics.
     *
     * @param  array{mean: float, std: float}  $params  Scaler parameters
     * @return array<string, mixed> Statistics description
     */
    public function describe(array $params): array
    {
        $this->validateParams($params);

        return [
            'mean' => $params['mean'],
            'std' => $params['std'],
            'variance' => $params['std'] * $params['std'],
            'stable' => $this->isStable($params),
            'min_std_threshold' => self::MIN_STD_THRESHOLD,
            'using_fallback' => $params['std'] < self::MIN_STD_THRESHOLD,
        ];
    }

    /**
     * Validate input data for NaN/INF.
     *
     * @param  array<float>  $data  Data to validate
     * @param  string  $method  Method name for logging
     */
    private function validateData(array $data, string $method): void
    {
        foreach ($data as $index => $value) {
            if (! is_finite($value)) {
                Log::error("ScalerService::{$method}: Non-finite value detected", [
                    'index' => $index,
                    'value' => $value,
                ]);
                throw new \InvalidArgumentException("Non-finite value at index {$index}: {$value}");
            }
        }
    }

    /**
     * Validate scaler parameters.
     *
     * @param  array{mean?: float, std?: float}  $params  Parameters to validate
     */
    private function validateParams(array $params): void
    {
        if (! isset($params['mean']) || ! isset($params['std'])) {
            throw new \InvalidArgumentException('Scaler parameters must contain "mean" and "std"');
        }

        if (! is_finite($params['mean']) || ! is_finite($params['std'])) {
            throw new \InvalidArgumentException('Scaler parameters must be finite values');
        }
    }

    /**
     * Legacy MinMaxScaler methods (kept for backward compatibility).
     *
     * @deprecated Use fitTransformStandard instead
     */
    public function fitTransform(array $data): array
    {
        return $this->fitTransformStandard($data);
    }

    /**
     * @deprecated Use transformStandard instead
     */
    public function transform(array $data, array $params): array
    {
        return $this->transformStandard($data, $params);
    }

    /**
     * @deprecated Use inverseTransformStandard instead
     */
    public function inverseTransform(array $scaled, array $params): array
    {
        return $this->inverseTransformStandard($scaled, $params);
    }
}
