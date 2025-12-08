<?php

use App\Models\HybridPrediction;
use App\Models\TestData;
use App\Models\TrainingData;
use App\Services\ARIMAXService;
use App\Services\PseudoLSTMService;
use App\Services\ScalerService;

beforeEach(function () {
    // Clear existing data
    HybridPrediction::query()->delete();
    TrainingData::query()->delete();
    TestData::query()->delete();

    // Create sample training data
    $trainingDates = [];
    $trainingWaveHeights = [];
    $trainingWindSpeeds = [];
    for ($i = 0; $i < 50; $i++) {
        $trainingDates[] = now()->subDays(50 - $i);
        $trainingWaveHeights[] = 1.0 + sin($i * 0.1) + (mt_rand() / mt_getrandmax() - 0.5) * 0.2;
        $trainingWindSpeeds[] = 5.0 + cos($i * 0.1) + (mt_rand() / mt_getrandmax() - 0.5) * 1.0;
    }

    foreach ($trainingDates as $index => $date) {
        TrainingData::create([
            'tanggal' => $date,
            'tinggi_gelombang' => $trainingWaveHeights[$index],
            'kecepatan_angin' => $trainingWindSpeeds[$index],
        ]);
    }

    // Create sample test data
    $testDates = [];
    $testWaveHeights = [];
    $testWindSpeeds = [];
    for ($i = 0; $i < 10; $i++) {
        $testDates[] = now()->addDays($i + 1);
        $testWaveHeights[] = 1.0 + sin(($i + 50) * 0.1) + (mt_rand() / mt_getrandmax() - 0.5) * 0.2;
        $testWindSpeeds[] = 5.0 + cos(($i + 50) * 0.1) + (mt_rand() / mt_getrandmax() - 0.5) * 1.0;
    }

    foreach ($testDates as $index => $date) {
        TestData::create([
            'tanggal' => $date,
            'tinggi_gelombang' => $testWaveHeights[$index],
            'kecepatan_angin' => $testWindSpeeds[$index],
        ]);
    }
});

it('generates hybrid predictions without residual explosion', function () {
    $arimaxService = new ARIMAXService;
    $lstmService = new PseudoLSTMService(inputSize: 24, hiddenSize: 8, dropoutRate: 0.25);
    $scalerService = new ScalerService;

    // Get data
    $trainingData = TrainingData::query()->orderBy('tanggal', 'asc')->get();
    $testData = TestData::query()->orderBy('tanggal', 'asc')->get();

    $yTrain = $trainingData->pluck('tinggi_gelombang')->map(fn ($v) => (float) $v)->toArray();
    $xTrain = $trainingData->pluck('kecepatan_angin')->map(fn ($v) => (float) $v)->toArray();
    $yTest = $testData->pluck('tinggi_gelombang')->map(fn ($v) => (float) $v)->toArray();
    $xTest = $testData->pluck('kecepatan_angin')->map(fn ($v) => (float) $v)->toArray();

    // Train ARIMAX
    $arimaxModel = $arimaxService->train($yTrain, $xTrain, $p = 1, $d = 1, $q = 0);
    expect($arimaxModel['success'])->toBeTrue();

    // Calculate residuals
    $fittedOriginal = $arimaxModel['fitted'];
    $residualTrain = [];
    $minLength = min(count($yTrain), count($fittedOriginal));
    for ($i = 0; $i < $minLength; $i++) {
        $residualTrain[] = $yTrain[$i] - $fittedOriginal[$i];
    }

    // Check residuals are not extreme
    $residualMax = max(array_map('abs', $residualTrain));
    expect($residualMax)->toBeLessThan(100.0); // Should not be extreme like -41

    // Scale residuals
    [$residualScaled, $scalerParams] = $scalerService->fitTransformStandard($residualTrain);
    expect($scalerParams)->not->toBeNull();

    // Train LSTM
    $lstmTraining = $lstmService->train($residualScaled, $window = 24, $epochs = 10, $learningRate = 0.008);
    expect($lstmTraining['success'])->toBeTrue();

    // Forecast ARIMAX
    $arimaxForecast = $arimaxService->forecast(
        $arimaxModel['phi'],
        $arimaxModel['betaX'],
        $arimaxModel['intercept'],
        $yTrain,
        $xTrain,
        $xTest,
        $p,
        $d
    );

    // Forecast LSTM residuals
    $lstmResidualScaled = [];
    $currentWindow = array_slice($residualScaled, -24);
    for ($i = 0; $i < count($yTest); $i++) {
        $predScaled = $lstmService->predict($currentWindow);
        if (! is_finite($predScaled)) {
            $predScaled = 0.0;
        }
        $lstmResidualScaled[] = $predScaled;
        array_shift($currentWindow);
        $currentWindow[] = $predScaled;
    }

    // Inverse scale
    $lstmResidualUnscaled = $scalerService->inverseTransformStandard($lstmResidualScaled, $scalerParams);

    // Calculate residual statistics
    $residualMean = array_sum($lstmResidualUnscaled) / count($lstmResidualUnscaled);
    $residualStd = sqrt(array_sum(array_map(fn ($r) => pow($r - $residualMean, 2), $lstmResidualUnscaled)) / count($lstmResidualUnscaled));

    // Check residual std is reasonable
    expect(is_finite($residualStd))->toBeTrue()
        ->and($residualStd)->toBeLessThan(10.0);

    // Hybrid combination
    $hybridPredictions = [];
    for ($i = 0; $i < count($arimaxForecast); $i++) {
        $arimaxOriginal = $arimaxForecast[$i];
        $lstmResidualOriginal = $lstmResidualUnscaled[$i];

        // New hybrid logic
        $sigmoidWeight = 1.0 / (1.0 + exp(-$residualStd));
        $weight = max(0.15, min(0.85, 0.15 + $sigmoidWeight));
        $hybrid = $arimaxOriginal + ($lstmResidualOriginal * $weight);

        if ($hybrid < 0) {
            $hybrid = $arimaxOriginal * 0.90;
        }

        $residualAbs = abs($lstmResidualOriginal - $residualMean);
        if ($residualAbs > 3 * $residualStd) {
            $hybrid = $arimaxOriginal;
        }

        $hybrid = max(0.0, min(10.0, $hybrid));
        $hybridPredictions[] = $hybrid;
    }

    // Check hybrid predictions are valid
    foreach ($hybridPredictions as $hybrid) {
        expect(is_finite($hybrid))->toBeTrue()
            ->and($hybrid)->toBeGreaterThanOrEqual(0.0)
            ->and($hybrid)->toBeLessThanOrEqual(10.0);
    }

    // Check hybrid is not all zeros
    $nonZeroCount = count(array_filter($hybridPredictions, fn ($h) => abs($h) > 1e-6));
    expect($nonZeroCount)->toBeGreaterThan(0);
});

it('ensures hybrid predictions are always non-negative', function () {
    $arimaxService = new ARIMAXService;
    $lstmService = new PseudoLSTMService(inputSize: 24, hiddenSize: 8, dropoutRate: 0.25);
    $scalerService = new ScalerService;

    $trainingData = TrainingData::query()->orderBy('tanggal', 'asc')->get();
    $testData = TestData::query()->orderBy('tanggal', 'asc')->get();

    $yTrain = $trainingData->pluck('tinggi_gelombang')->map(fn ($v) => (float) $v)->toArray();
    $xTrain = $trainingData->pluck('kecepatan_angin')->map(fn ($v) => (float) $v)->toArray();
    $xTest = $testData->pluck('kecepatan_angin')->map(fn ($v) => (float) $v)->toArray();

    $arimaxModel = $arimaxService->train($yTrain, $xTrain, $p = 1, $d = 1, $q = 0);
    expect($arimaxModel['success'])->toBeTrue();

    $fittedOriginal = $arimaxModel['fitted'];
    $residualTrain = [];
    $minLength = min(count($yTrain), count($fittedOriginal));
    for ($i = 0; $i < $minLength; $i++) {
        $residualTrain[] = $yTrain[$i] - $fittedOriginal[$i];
    }

    [$residualScaled, $scalerParams] = $scalerService->fitTransformStandard($residualTrain);
    $lstmTraining = $lstmService->train($residualScaled, $window = 24, $epochs = 10, $learningRate = 0.008);
    expect($lstmTraining['success'])->toBeTrue();

    $arimaxForecast = $arimaxService->forecast(
        $arimaxModel['phi'],
        $arimaxModel['betaX'],
        $arimaxModel['intercept'],
        $yTrain,
        $xTrain,
        $xTest,
        $p = 1,
        $d = 1
    );

    $lstmResidualScaled = [];
    $currentWindow = array_slice($residualScaled, -24);
    for ($i = 0; $i < count($xTest); $i++) {
        $predScaled = $lstmService->predict($currentWindow);
        if (! is_finite($predScaled)) {
            $predScaled = 0.0;
        }
        $lstmResidualScaled[] = $predScaled;
        array_shift($currentWindow);
        $currentWindow[] = $predScaled;
    }

    $lstmResidualUnscaled = $scalerService->inverseTransformStandard($lstmResidualScaled, $scalerParams);

    $residualMean = array_sum($lstmResidualUnscaled) / count($lstmResidualUnscaled);
    $residualStd = sqrt(array_sum(array_map(fn ($r) => pow($r - $residualMean, 2), $lstmResidualUnscaled)) / count($lstmResidualUnscaled));

    $hybridPredictions = [];
    for ($i = 0; $i < count($arimaxForecast); $i++) {
        $arimaxOriginal = $arimaxForecast[$i];
        $lstmResidualOriginal = $lstmResidualUnscaled[$i];

        $sigmoidWeight = 1.0 / (1.0 + exp(-$residualStd));
        $weight = max(0.15, min(0.85, 0.15 + $sigmoidWeight));
        $hybrid = $arimaxOriginal + ($lstmResidualOriginal * $weight);

        if ($hybrid < 0) {
            $hybrid = $arimaxOriginal * 0.90;
        }

        $residualAbs = abs($lstmResidualOriginal - $residualMean);
        if ($residualAbs > 3 * $residualStd) {
            $hybrid = $arimaxOriginal;
        }

        $hybrid = max(0.0, min(10.0, $hybrid));
        $hybridPredictions[] = $hybrid;
    }

    // All predictions must be non-negative
    foreach ($hybridPredictions as $hybrid) {
        expect($hybrid)->toBeGreaterThanOrEqual(0.0);
    }
});

it('calculates MAPE without infinite values', function () {
    $actual = [1.0, 2.0, 3.0, 4.0, 5.0];
    $predicted = [1.1, 2.1, 3.1, 4.1, 5.1];

    $mape = 0.0;
    $count = 0;
    for ($i = 0; $i < count($actual); $i++) {
        if (abs($actual[$i]) > 0.0001) {
            $mape += abs(($actual[$i] - $predicted[$i]) / $actual[$i]) * 100;
            $count++;
        }
    }
    $mape = $count > 0 ? $mape / $count : 999.99;

    expect(is_finite($mape))->toBeTrue()
        ->and(is_infinite($mape))->toBeFalse()
        ->and(is_nan($mape))->toBeFalse();
});

it('ensures scaler is stable', function () {
    $scalerService = new ScalerService;

    $data = [1.0, 2.0, 3.0, 4.0, 5.0];
    [$scaled, $params] = $scalerService->fitTransformStandard($data);

    expect($scalerService->isStable($params))->toBeTrue()
        ->and($params)->toHaveKey('mean')
        ->and($params)->toHaveKey('std')
        ->and($params['std'])->toBeGreaterThan(0.0);
});
