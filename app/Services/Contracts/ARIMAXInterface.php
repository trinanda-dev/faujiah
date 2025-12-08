<?php

namespace App\Services\Contracts;

/**
 * Interface for ARIMAX forecasting service.
 * Defines contract for ARIMAX model training and forecasting.
 */
interface ARIMAXInterface
{
    /**
     * Train ARIMAX model using OLS.
     *
     * @param  array  $y  Dependent variable (original scale)
     * @param  array  $x  Exogenous variable (original scale)
     * @param  int  $p  AR order
     * @param  int  $d  Differencing order
     * @param  int  $q  MA order
     * @return array Model parameters and fitted values
     */
    public function train(array $y, array $x, int $p = 1, int $d = 1, int $q = 0): array;

    /**
     * Forecast ARIMAX model recursively.
     *
     * @param  array  $phi  AR coefficients
     * @param  float  $betaX  Exogenous coefficient
     * @param  float  $intercept  Intercept
     * @param  array  $yTrain  Training data (original scale)
     * @param  array  $xTrain  Training exogenous data (original scale)
     * @param  array  $xFuture  Future exogenous values (original scale)
     * @param  int  $p  AR order
     * @param  int  $d  Differencing order
     * @return array Forecasted values (original scale)
     */
    public function forecast(array $phi, float $betaX, float $intercept, array $yTrain, array $xTrain, array $xFuture, int $p, int $d): array;
}
