<?php

namespace App\Services;

/**
 * ARIMAX Differencing State
 * Stores original series, differenced series, and differencing order for state tracking.
 *
 * This class ensures symmetric differencing and inverse differencing operations.
 */
class ARIMAXDifferenceState
{
    /**
     * Original time series before differencing.
     *
     * @var array<float>
     */
    public array $originalSeries;

    /**
     * Differenced series after applying differencing d times.
     *
     * @var array<float>
     */
    public array $differenced;

    /**
     * Differencing order (d).
     */
    public int $d;

    /**
     * Last original values before each differencing step.
     * Used for inverse differencing.
     *
     * @var array<float>
     */
    public array $lastOriginalValues;

    /**
     * Constructor.
     *
     * @param  array<float>  $originalSeries  Original time series
     * @param  array<float>  $differenced  Differenced series
     * @param  int  $d  Differencing order
     * @param  array<float>  $lastOriginalValues  Last original values before each differencing step
     */
    public function __construct(array $originalSeries, array $differenced, int $d, array $lastOriginalValues = [])
    {
        $this->originalSeries = $originalSeries;
        $this->differenced = $differenced;
        $this->d = $d;
        $this->lastOriginalValues = $lastOriginalValues;
    }

    /**
     * Get the last original value for inverse differencing.
     *
     * @return float Last original value
     */
    public function getLastOriginalValue(): float
    {
        if (! empty($this->lastOriginalValues)) {
            return end($this->lastOriginalValues);
        }

        return end($this->originalSeries);
    }
}
