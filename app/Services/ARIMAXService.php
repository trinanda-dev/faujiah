<?php

namespace App\Services;

use App\Services\Contracts\ARIMAXInterface;
use Illuminate\Support\Facades\Log;

/**
 * ARIMAX Service with OLS Training
 *
 * Implements ARIMAX(p,d,q) model with exogenous variables.
 * Training uses OLS matrix solution: b = (XᵀX)⁻¹ Xᵀy
 *
 * Features:
 * - Regularized least squares for singular matrices
 * - Differencing state tracking
 * - AIC/BIC metrics
 * - Residual normality checks
 * - Comprehensive validation and error handling
 *
 * @implements ARIMAXInterface
 */
class ARIMAXService implements ARIMAXInterface
{
    /**
     * Regularization parameter for ridge regression (lambda).
     * Used when matrix is near-singular.
     */
    private const RIDGE_LAMBDA = 1e-6;

    /**
     * Minimum determinant threshold for matrix inversion.
     */
    private const MIN_DETERMINANT = 1e-10;

    /**
     * Debug mode flag.
     */
    private bool $debugMode = false;

    /**
     * Cache for matrix inverses (key: matrix size).
     *
     * @var array<string, array<int, array<int, float>>|null>
     */
    private array $inverseCache = [];

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
     * Apply differencing d times to a time series.
     *
     * Formula: y_t^d = y_t - y_{t-1} (applied d times)
     *
     * @param  array<float>  $series  Original time series
     * @param  int  $d  Differencing order
     * @return ARIMAXDifferenceState Differencing state
     */
    private function difference(array $series, int $d): ARIMAXDifferenceState
    {
        $this->validateSeries($series, 'difference');

        $result = $series;
        $lastOriginalValues = [];

        for ($i = 0; $i < $d; $i++) {
            if (count($result) < 2) {
                throw new \InvalidArgumentException('Cannot apply differencing: insufficient data (need at least 2 points, got '.count($result).')');
            }

            // Store last value before differencing
            $lastOriginalValues[] = end($result);

            $diffed = [];
            for ($t = 1; $t < count($result); $t++) {
                $diffValue = $result[$t] - $result[$t - 1];

                // Validate differenced value
                if (! is_finite($diffValue)) {
                    Log::error('ARIMAXService: Non-finite differenced value', [
                        'step' => $i,
                        't' => $t,
                        'prev' => $result[$t - 1],
                        'curr' => $result[$t],
                    ]);
                    throw new \RuntimeException("Non-finite differenced value at step {$i}, position {$t}");
                }

                $diffed[] = $diffValue;
            }

            $result = $diffed;
        }

        return new ARIMAXDifferenceState($series, $result, $d, $lastOriginalValues);
    }

    /**
     * Inverse differencing to reconstruct original series.
     *
     * Formula: y_t = y_{t-1} + yDiff_t (applied d times)
     *
     * @param  array<float>  $diffed  Differenced series
     * @param  ARIMAXDifferenceState  $state  Differencing state
     * @return array<float> Original scale series
     */
    private function inverseDifference(array $diffed, ARIMAXDifferenceState $state): array
    {
        $this->validateSeries($diffed, 'inverseDifference');

        $result = $diffed;
        $lastOriginalValues = array_reverse($state->lastOriginalValues);

        for ($i = 0; $i < $state->d; $i++) {
            $lastOriginal = $lastOriginalValues[$i] ?? end($state->originalSeries);

            if (! is_finite($lastOriginal)) {
                throw new \InvalidArgumentException("Non-finite last original value at differencing step {$i}");
            }

            $undiffed = [$lastOriginal];
            foreach ($result as $val) {
                if (! is_finite($val)) {
                    throw new \InvalidArgumentException('Non-finite differenced value in inverse differencing');
                }

                $nextValue = end($undiffed) + $val;
                $undiffed[] = $nextValue;
            }

            $result = $undiffed;
        }

        return $result;
    }

    /**
     * Matrix multiplication: A * B.
     *
     * @param  array<int, array<int, float>>  $A  Matrix A
     * @param  array<int, array<int, float>>  $B  Matrix B
     * @return array<int, array<int, float>> Result matrix
     */
    private function matrixMultiply(array $A, array $B): array
    {
        $rowsA = count($A);
        $colsA = count($A[0]);
        $colsB = count($B[0]);

        $result = array_fill(0, $rowsA, array_fill(0, $colsB, 0.0));

        for ($i = 0; $i < $rowsA; $i++) {
            for ($j = 0; $j < $colsB; $j++) {
                $sum = 0.0;
                for ($k = 0; $k < $colsA; $k++) {
                    $sum += $A[$i][$k] * $B[$k][$j];
                }

                // Validate result
                if (! is_finite($sum)) {
                    Log::error('ARIMAXService: Non-finite matrix multiplication result', [
                        'i' => $i,
                        'j' => $j,
                    ]);
                    throw new \RuntimeException("Non-finite matrix multiplication result at [{$i}, {$j}]");
                }

                $result[$i][$j] = $sum;
            }
        }

        return $result;
    }

    /**
     * Matrix transpose.
     *
     * @param  array<int, array<int, float>>  $matrix  Input matrix
     * @return array<int, array<int, float>> Transposed matrix
     */
    private function matrixTranspose(array $matrix): array
    {
        $rows = count($matrix);
        $cols = count($matrix[0]);
        $transposed = [];

        for ($j = 0; $j < $cols; $j++) {
            $transposed[$j] = [];
            for ($i = 0; $i < $rows; $i++) {
                $transposed[$j][$i] = $matrix[$i][$j];
            }
        }

        return $transposed;
    }

    /**
     * Calculate matrix determinant (for validation).
     *
     * @param  array<int, array<int, float>>  $matrix  Square matrix
     * @return float Determinant
     */
    private function matrixDeterminant(array $matrix): float
    {
        $n = count($matrix);

        if ($n === 1) {
            return $matrix[0][0];
        }

        if ($n === 2) {
            return $matrix[0][0] * $matrix[1][1] - $matrix[0][1] * $matrix[1][0];
        }

        // For larger matrices, use recursive formula
        $det = 0.0;
        for ($j = 0; $j < $n; $j++) {
            $minor = [];
            for ($i = 1; $i < $n; $i++) {
                $minorRow = [];
                for ($k = 0; $k < $n; $k++) {
                    if ($k !== $j) {
                        $minorRow[] = $matrix[$i][$k];
                    }
                }
                $minor[] = $minorRow;
            }
            $sign = ($j % 2 === 0) ? 1 : -1;
            $det += $sign * $matrix[0][$j] * $this->matrixDeterminant($minor);
        }

        return $det;
    }

    /**
     * Matrix inversion using Gaussian elimination with pivoting.
     * Falls back to regularized least squares if singular.
     *
     * @param  array<int, array<int, float>>  $matrix  Square matrix to invert
     * @return array<int, array<int, float>>|null Inverse matrix, or null if singular
     */
    private function matrixInverse(array $matrix): ?array
    {
        $n = count($matrix);

        // Check cache
        $cacheKey = md5(serialize($matrix));
        if (isset($this->inverseCache[$cacheKey])) {
            return $this->inverseCache[$cacheKey];
        }

        // Check determinant
        $det = $this->matrixDeterminant($matrix);
        if (abs($det) < self::MIN_DETERMINANT) {
            if ($this->debugMode) {
                Log::warning('ARIMAXService: Matrix determinant too small, attempting regularization', [
                    'determinant' => $det,
                ]);
            }

            // Try regularized version
            return $this->matrixInverseRegularized($matrix);
        }

        // Create identity matrix
        $identity = [];
        for ($i = 0; $i < $n; $i++) {
            $identity[$i] = [];
            for ($j = 0; $j < $n; $j++) {
                $identity[$i][$j] = ($i == $j) ? 1.0 : 0.0;
            }
        }

        // Create augmented matrix
        $augmented = [];
        for ($i = 0; $i < $n; $i++) {
            $augmented[$i] = array_merge($matrix[$i], $identity[$i]);
        }

        // Gaussian elimination with partial pivoting
        for ($i = 0; $i < $n; $i++) {
            // Find pivot (row with largest absolute value in column)
            $maxRow = $i;
            $maxVal = abs($augmented[$i][$i]);
            for ($k = $i + 1; $k < $n; $k++) {
                if (abs($augmented[$k][$i]) > $maxVal) {
                    $maxRow = $k;
                    $maxVal = abs($augmented[$k][$i]);
                }
            }

            // Swap rows
            if ($maxRow !== $i) {
                $temp = $augmented[$i];
                $augmented[$i] = $augmented[$maxRow];
                $augmented[$maxRow] = $temp;
            }

            // Check for singular matrix
            if (abs($augmented[$i][$i]) < 1e-12) {
                if ($this->debugMode) {
                    Log::warning('ARIMAXService: Singular matrix detected, using regularization', [
                        'pivot' => $augmented[$i][$i],
                    ]);
                }

                return $this->matrixInverseRegularized($matrix);
            }

            // Make diagonal 1
            $pivot = $augmented[$i][$i];
            for ($j = 0; $j < 2 * $n; $j++) {
                $augmented[$i][$j] /= $pivot;
            }

            // Eliminate column
            for ($k = 0; $k < $n; $k++) {
                if ($k != $i) {
                    $factor = $augmented[$k][$i];
                    for ($j = 0; $j < 2 * $n; $j++) {
                        $augmented[$k][$j] -= $factor * $augmented[$i][$j];
                    }
                }
            }
        }

        // Extract inverse
        $inverse = [];
        for ($i = 0; $i < $n; $i++) {
            $inverse[$i] = array_slice($augmented[$i], $n);
        }

        // Validate inverse
        foreach ($inverse as $row) {
            foreach ($row as $val) {
                if (! is_finite($val)) {
                    Log::error('ARIMAXService: Non-finite value in inverse matrix');

                    return $this->matrixInverseRegularized($matrix);
                }
            }
        }

        // Cache result
        $this->inverseCache[$cacheKey] = $inverse;

        return $inverse;
    }

    /**
     * Regularized matrix inversion using ridge regression.
     * (XᵀX + λI)⁻¹ instead of (XᵀX)⁻¹
     *
     * @param  array<int, array<int, float>>  $matrix  Square matrix
     * @return array<int, array<int, float>>|null Regularized inverse
     */
    private function matrixInverseRegularized(array $matrix): ?array
    {
        $n = count($matrix);

        // Add regularization: X + λI
        $regularized = [];
        for ($i = 0; $i < $n; $i++) {
            $regularized[$i] = [];
            for ($j = 0; $j < $n; $j++) {
                $regularized[$i][$j] = $matrix[$i][$j] + (($i === $j) ? self::RIDGE_LAMBDA : 0.0);
            }
        }

        if ($this->debugMode) {
            Log::info('ARIMAXService: Using regularized matrix inversion', [
                'lambda' => self::RIDGE_LAMBDA,
            ]);
        }

        return $this->matrixInverse($regularized);
    }

    /**
     * Calculate AIC (Akaike Information Criterion).
     *
     * Formula: AIC = n * ln(SSE/n) + 2 * k
     * where n = sample size, SSE = sum of squared errors, k = number of parameters
     *
     * @param  array<float>  $residuals  Residuals
     * @param  int  $numParams  Number of parameters
     * @return float AIC value
     */
    private function calculateAIC(array $residuals, int $numParams): float
    {
        $n = count($residuals);
        if ($n === 0) {
            return PHP_FLOAT_MAX;
        }

        $sse = array_sum(array_map(fn ($r) => $r * $r, $residuals));
        $mse = $sse / $n;

        if ($mse <= 0) {
            return PHP_FLOAT_MAX;
        }

        return $n * log($mse) + 2 * $numParams;
    }

    /**
     * Calculate BIC (Bayesian Information Criterion).
     *
     * Formula: BIC = n * ln(SSE/n) + k * ln(n)
     *
     * @param  array<float>  $residuals  Residuals
     * @param  int  $numParams  Number of parameters
     * @return float BIC value
     */
    private function calculateBIC(array $residuals, int $numParams): float
    {
        $n = count($residuals);
        if ($n === 0) {
            return PHP_FLOAT_MAX;
        }

        $sse = array_sum(array_map(fn ($r) => $r * $r, $residuals));
        $mse = $sse / $n;

        if ($mse <= 0) {
            return PHP_FLOAT_MAX;
        }

        return $n * log($mse) + $numParams * log($n);
    }

    /**
     * Check residual normality using skewness and kurtosis.
     *
     * @param  array<float>  $residuals  Residuals
     * @return array<string, mixed> Normality statistics
     */
    private function checkResidualNormality(array $residuals): array
    {
        $n = count($residuals);
        if ($n < 3) {
            return ['normal' => false, 'reason' => 'insufficient_data'];
        }

        $mean = array_sum($residuals) / $n;
        $variance = array_sum(array_map(fn ($r) => pow($r - $mean, 2), $residuals)) / $n;
        $std = sqrt($variance);

        if ($std < 1e-10) {
            return ['normal' => false, 'reason' => 'zero_variance'];
        }

        // Calculate skewness
        $skewness = 0.0;
        foreach ($residuals as $r) {
            $skewness += pow(($r - $mean) / $std, 3);
        }
        $skewness /= $n;

        // Calculate kurtosis
        $kurtosis = 0.0;
        foreach ($residuals as $r) {
            $kurtosis += pow(($r - $mean) / $std, 4);
        }
        $kurtosis /= $n;

        // Normal distribution: skewness ≈ 0, kurtosis ≈ 3
        $isNormal = abs($skewness) < 1.0 && abs($kurtosis - 3.0) < 2.0;

        return [
            'normal' => $isNormal,
            'skewness' => $skewness,
            'kurtosis' => $kurtosis,
            'mean' => $mean,
            'std' => $std,
        ];
    }

    /**
     * Train ARIMAX model using OLS.
     * Solves: b = (XᵀX)⁻¹ Xᵀy
     *
     * @param  array<float>  $y  Dependent variable (original scale)
     * @param  array<float>  $x  Exogenous variable (original scale)
     * @param  int  $p  AR order
     * @param  int  $d  Differencing order
     * @param  int  $q  MA order (not used in simplified version)
     * @return array<string, mixed> Model parameters and fitted values
     */
    public function train(array $y, array $x, int $p = 1, int $d = 1, int $q = 0): array
    {
        $this->validateSeries($y, 'train (y)');
        $this->validateSeries($x, 'train (x)');

        $n = count($y);
        if ($n !== count($x)) {
            throw new \InvalidArgumentException("Length mismatch: y has {$n} elements, x has ".count($x).' elements');
        }

        if ($n < $p + $d + 2) {
            return [
                'success' => false,
                'error' => 'Insufficient data: need at least '.($p + $d + 2).' points, got '.$n,
            ];
        }

        if ($this->debugMode) {
            Log::info('ARIMAXService::train: Starting training', [
                'n' => $n,
                'p' => $p,
                'd' => $d,
                'q' => $q,
            ]);
        }

        // Apply differencing with state tracking
        $yDiffState = $this->difference($y, $d);
        $xDiffState = $this->difference($x, $d);

        $yDiff = $yDiffState->differenced;
        $xDiff = $xDiffState->differenced;

        $nDiff = count($yDiff);
        if ($nDiff < $p + 2) {
            return [
                'success' => false,
                'error' => 'Insufficient data after differencing: need at least '.($p + 2).' points, got '.$nDiff,
            ];
        }

        // Build design matrix X
        // Columns: [1 (intercept), y_{t-1}, y_{t-2}, ..., y_{t-p}, x_t]
        $X = [];
        $yTarget = [];

        for ($t = $p; $t < $nDiff; $t++) {
            $row = [1.0]; // Intercept column

            // AR lags: y_{t-1}, y_{t-2}, ..., y_{t-p}
            for ($i = 1; $i <= $p; $i++) {
                $row[] = $yDiff[$t - $i];
            }

            // Exogenous variable
            $row[] = $xDiff[$t];

            $X[] = $row;
            $yTarget[] = $yDiff[$t];
        }

        if ($this->debugMode) {
            Log::info('ARIMAXService::train: Design matrix built', [
                'rows' => count($X),
                'cols' => count($X[0]),
            ]);
        }

        // Convert to matrix format for OLS
        $XMatrix = $X;
        $yVector = array_map(fn ($val) => [$val], $yTarget);

        // OLS: b = (XᵀX)⁻¹ Xᵀy
        $XT = $this->matrixTranspose($XMatrix);
        $XTX = $this->matrixMultiply($XT, $XMatrix);

        if ($this->debugMode) {
            Log::info('ARIMAXService::train: XTX matrix calculated', [
                'size' => count($XTX),
                'determinant' => $this->matrixDeterminant($XTX),
            ]);
        }

        $XTXInv = $this->matrixInverse($XTX);

        if ($XTXInv === null) {
            return [
                'success' => false,
                'error' => 'Matrix is singular, cannot invert even with regularization',
            ];
        }

        $XTy = $this->matrixMultiply($XT, $yVector);
        $beta = $this->matrixMultiply($XTXInv, $XTy);

        // Extract parameters
        $intercept = $beta[0][0];
        $phi = [];
        for ($i = 1; $i <= $p; $i++) {
            $phi[] = $beta[$i][0];
        }
        $betaX = $beta[$p + 1][0];

        // Validate parameters
        if (! is_finite($intercept) || ! is_finite($betaX)) {
            return [
                'success' => false,
                'error' => 'Non-finite parameters calculated',
            ];
        }

        foreach ($phi as $phiVal) {
            if (! is_finite($phiVal)) {
                return [
                    'success' => false,
                    'error' => 'Non-finite AR coefficients',
                ];
            }
        }

        // Calculate fitted values on differenced scale
        $fittedDiff = [];
        for ($t = $p; $t < $nDiff; $t++) {
            $pred = $intercept;
            for ($i = 1; $i <= $p; $i++) {
                $pred += $phi[$i - 1] * $yDiff[$t - $i];
            }
            $pred += $betaX * $xDiff[$t];
            $fittedDiff[] = $pred;
        }

        // Calculate residuals on differenced scale
        $residualsDiff = [];
        for ($i = 0; $i < count($fittedDiff); $i++) {
            $residualsDiff[] = $yTarget[$i] - $fittedDiff[$i];
        }

        // Calculate metrics
        $numParams = 1 + $p + 1; // intercept + AR + exogenous
        $aic = $this->calculateAIC($residualsDiff, $numParams);
        $bic = $this->calculateBIC($residualsDiff, $numParams);
        $normality = $this->checkResidualNormality($residualsDiff);

        // Inverse differencing to get original scale fitted values
        $fittedOriginal = [];
        for ($i = 0; $i < $d; $i++) {
            $fittedOriginal[] = $y[$i];
        }

        // Inverse difference fitted values
        if (! empty($fittedDiff)) {
            $fittedUndiffed = $this->inverseDifference($fittedDiff, $yDiffState);
            $fittedOriginal = array_merge($fittedOriginal, $fittedUndiffed);
        }

        // Trim to match original length
        $fittedFinal = array_slice($fittedOriginal, 0, $n);

        if ($this->debugMode) {
            Log::info('ARIMAXService::train: Training completed', [
                'phi' => $phi,
                'betaX' => $betaX,
                'intercept' => $intercept,
                'aic' => $aic,
                'bic' => $bic,
                'normality' => $normality,
            ]);
        }

        return [
            'success' => true,
            'phi' => $phi,
            'betaX' => $betaX,
            'intercept' => $intercept,
            'fitted' => $fittedFinal,
            'yDiff' => $yDiff,
            'xDiff' => $xDiff,
            'yDiffState' => $yDiffState,
            'xDiffState' => $xDiffState,
            'lastOriginalValue' => end($y),
            'order' => [$p, $d, $q],
            'metrics' => [
                'aic' => $aic,
                'bic' => $bic,
                'normality' => $normality,
            ],
        ];
    }

    /**
     * Forecast ARIMAX model recursively.
     *
     * Formula: yDiff_t = intercept + Σ(phi_i * yDiff_{t-i}) + beta * xDiff_t
     * Then restore: y_t = y_{t-1} + yDiff_t
     *
     * @param  array<float>  $phi  AR coefficients
     * @param  float  $betaX  Exogenous coefficient
     * @param  float  $intercept  Intercept
     * @param  array<float>  $yTrain  Training data (original scale)
     * @param  array<float>  $xTrain  Training exogenous data (original scale)
     * @param  array<float>  $xFuture  Future exogenous values (original scale)
     * @param  int  $p  AR order
     * @param  int  $d  Differencing order
     * @return array<float> Forecasted values (original scale)
     */
    public function forecast(array $phi, float $betaX, float $intercept, array $yTrain, array $xTrain, array $xFuture, int $p, int $d): array
    {
        $this->validateSeries($yTrain, 'forecast (yTrain)');
        $this->validateSeries($xTrain, 'forecast (xTrain)');
        $this->validateSeries($xFuture, 'forecast (xFuture)');

        if (! is_finite($betaX) || ! is_finite($intercept)) {
            throw new \InvalidArgumentException('Non-finite parameters for forecasting');
        }

        foreach ($phi as $phiVal) {
            if (! is_finite($phiVal)) {
                throw new \InvalidArgumentException('Non-finite AR coefficients');
            }
        }

        // Apply differencing to training data
        $yDiffState = $this->difference($yTrain, $d);
        $xDiffState = $this->difference($xTrain, $d);

        $yDiffTrain = $yDiffState->differenced;
        $xDiffTrain = $xDiffState->differenced;

        // Get last original values for restoring original scale
        $lastYOriginal = end($yTrain);
        $lastXOriginal = end($xTrain);

        // Get last p values of differenced y for AR component
        $lastYDiff = array_slice($yDiffTrain, -$p);

        $forecasts = [];

        if ($this->debugMode) {
            Log::info('ARIMAXService::forecast: Starting forecasting', [
                'forecast_steps' => count($xFuture),
                'last_y_original' => $lastYOriginal,
                'last_x_original' => $lastXOriginal,
            ]);
        }

        // Recursive forecasting
        for ($t = 0; $t < count($xFuture); $t++) {
            // Calculate xDiff_t = xFuture[t] - xPrevious
            $xCurrent = $xFuture[$t];
            if (! is_finite($xCurrent)) {
                throw new \InvalidArgumentException("Non-finite future x value at step {$t}");
            }

            $xPrevious = ($t === 0) ? $lastXOriginal : $xFuture[$t - 1];
            $xDiff = $xCurrent - $xPrevious;

            // Predict on differenced scale: yDiff_t = intercept + Σ(phi_i * yDiff_{t-i}) + beta * xDiff_t
            $yDiffPred = $intercept;

            // AR component: Σ(phi_i * yDiff_{t-i})
            for ($i = 0; $i < $p; $i++) {
                $idx = count($lastYDiff) - 1 - $i;
                if ($idx >= 0 && isset($lastYDiff[$idx])) {
                    $yDiffPred += $phi[$i] * $lastYDiff[$idx];
                }
            }

            // Exogenous component
            $yDiffPred += $betaX * $xDiff;

            // Validate differenced prediction
            if (! is_finite($yDiffPred)) {
                Log::error('ARIMAXService::forecast: Non-finite differenced prediction', [
                    'step' => $t,
                    'yDiffPred' => $yDiffPred,
                ]);
                throw new \RuntimeException("Non-finite differenced prediction at step {$t}");
            }

            // Convert to original scale: y_t = y_{t-1} + yDiff_t
            $yPred = $lastYOriginal + $yDiffPred;

            // Validate final prediction
            if (! is_finite($yPred)) {
                Log::error('ARIMAXService::forecast: Non-finite forecast', [
                    'step' => $t,
                    'lastYOriginal' => $lastYOriginal,
                    'yDiffPred' => $yDiffPred,
                ]);
                throw new \RuntimeException("Non-finite forecast at step {$t}");
            }

            $forecasts[] = $yPred;

            // Update for next iteration
            $lastYOriginal = $yPred;
            $lastYDiff[] = $yDiffPred;
            if (count($lastYDiff) > $p) {
                $lastYDiff = array_slice($lastYDiff, -$p);
            }
        }

        if ($this->debugMode) {
            Log::info('ARIMAXService::forecast: Forecasting completed', [
                'forecasts_count' => count($forecasts),
                'first_5' => array_slice($forecasts, 0, 5),
            ]);
        }

        return $forecasts;
    }

    /**
     * Validate time series data.
     *
     * @param  array<float>  $series  Series to validate
     * @param  string  $context  Context for error messages
     */
    private function validateSeries(array $series, string $context): void
    {
        if (empty($series)) {
            throw new \InvalidArgumentException("Empty series in {$context}");
        }

        foreach ($series as $index => $value) {
            if (! is_finite($value)) {
                Log::error("ARIMAXService: Non-finite value in {$context}", [
                    'index' => $index,
                    'value' => $value,
                ]);
                throw new \InvalidArgumentException("Non-finite value at index {$index} in {$context}: {$value}");
            }
        }
    }
}
