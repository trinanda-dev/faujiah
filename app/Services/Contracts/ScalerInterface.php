<?php

namespace App\Services\Contracts;

/**
 * Interface for data scaling service.
 * Defines contract for standardization and normalization operations.
 */
interface ScalerInterface
{
    /**
     * Fit StandardScaler on data and transform (z-score normalization).
     *
     * Formula: scaled = (value - mean) / std
     *
     * @param  array  $data  Input data to scale
     * @return array [scaled_data, params] where params = ['mean' => float, 'std' => float]
     */
    public function fitTransformStandard(array $data): array;

    /**
     * Transform data using fitted StandardScaler parameters.
     *
     * @param  array  $data  Data to transform
     * @param  array  $params  Fitted parameters ['mean' => float, 'std' => float]
     * @return array Scaled data (z-score normalized)
     */
    public function transformStandard(array $data, array $params): array;

    /**
     * Inverse transform standardized data back to original scale.
     *
     * Formula: unscaled = (scaled * std) + mean
     *
     * @param  array  $scaled  Scaled data (z-score normalized)
     * @param  array  $params  Fitted parameters ['mean' => float, 'std' => float]
     * @return array Unscaled data
     */
    public function inverseTransformStandard(array $scaled, array $params): array;

    /**
     * Check if scaler is stable (std > threshold).
     *
     * @param  array  $params  Scaler parameters
     * @return bool True if stable
     */
    public function isStable(array $params): bool;

    /**
     * Get scaler parameters.
     *
     * @param  array  $params  Scaler parameters
     * @return array Parameters with validation
     */
    public function getParams(array $params): array;

    /**
     * Describe scaler statistics.
     *
     * @param  array  $params  Scaler parameters
     * @return array Statistics description
     */
    public function describe(array $params): array;
}
