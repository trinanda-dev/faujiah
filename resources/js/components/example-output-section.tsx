export default function ExampleOutputSection() {
    // Sample data untuk demo
    const sampleData = [
        { date: '2024-01-01', actual: 1.2, predicted: 1.15, error: 0.05 },
        { date: '2024-01-02', actual: 1.5, predicted: 1.48, error: 0.02 },
        { date: '2024-01-03', actual: 1.8, predicted: 1.82, error: -0.02 },
        { date: '2024-01-04', actual: 1.6, predicted: 1.58, error: 0.02 },
        { date: '2024-01-05', actual: 2.0, predicted: 1.95, error: 0.05 },
        { date: '2024-01-06', actual: 1.9, predicted: 1.92, error: -0.02 },
        { date: '2024-01-07', actual: 1.7, predicted: 1.68, error: 0.02 },
    ];

    const metrics = [
        { label: 'MAE', value: '0.032', unit: 'm' },
        { label: 'RMSE', value: '0.041', unit: 'm' },
        { label: 'MAPE', value: '2.1', unit: '%' },
    ];

    // Calculate max value for chart scaling
    const maxValue = Math.max(
        ...sampleData.map((d) => Math.max(d.actual, d.predicted)),
    );
    const chartHeight = 200;
    const chartWidth = 600;
    const padding = 40;

    return (
        <section
            id="demo"
            className="bg-white py-16 md:py-24 lg:py-32 dark:bg-neutral-950"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                        Demo / Contoh Prediksi
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Contoh hasil prediksi tinggi gelombang untuk 7 hari
                        terakhir menggunakan model Hybrid ARIMAX–LSTM
                    </p>
                </div>

                {/* Grafik Prediksi */}
                <div className="mt-16">
                    <h3 className="mb-6 text-center text-xl font-medium text-neutral-900 dark:text-white">
                        Grafik Prediksi 7 Hari Terakhir
                    </h3>
                    <div className="mx-auto max-w-4xl overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
                        <svg
                            viewBox={`0 0 ${chartWidth} ${chartHeight + padding * 2}`}
                            className="w-full"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Grid lines */}
                            {[0, 1, 2, 3, 4].map((i) => {
                                const y = padding + (chartHeight / 4) * i;
                                return (
                                    <line
                                        key={i}
                                        x1={padding}
                                        y1={y}
                                        x2={chartWidth - padding}
                                        y2={y}
                                        stroke="#e5e7eb"
                                        strokeWidth="1"
                                        strokeDasharray="2,2"
                                        className="dark:stroke-neutral-700"
                                    />
                                );
                            })}

                            {/* Y-axis labels */}
                            {[0, 1, 2, 3, 4].map((i) => {
                                const value = maxValue - (maxValue / 4) * i;
                                const y = padding + (chartHeight / 4) * i;
                                return (
                                    <text
                                        key={i}
                                        x={padding - 10}
                                        y={y + 4}
                                        fontSize="11"
                                        fill="#6b7280"
                                        textAnchor="end"
                                        className="dark:fill-neutral-500"
                                    >
                                        {value.toFixed(1)}
                                    </text>
                                );
                            })}

                            {/* Actual line */}
                            <polyline
                                points={sampleData
                                    .map(
                                        (d, i) =>
                                            `${padding + (i * (chartWidth - padding * 2)) / (sampleData.length - 1)},${padding + chartHeight - (d.actual / maxValue) * chartHeight}`,
                                    )
                                    .join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                className="dark:stroke-blue-400"
                            />

                            {/* Predicted line */}
                            <polyline
                                points={sampleData
                                    .map(
                                        (d, i) =>
                                            `${padding + (i * (chartWidth - padding * 2)) / (sampleData.length - 1)},${padding + chartHeight - (d.predicted / maxValue) * chartHeight}`,
                                    )
                                    .join(' ')}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                strokeDasharray="4,4"
                                className="dark:stroke-green-400"
                            />

                            {/* Data points - Actual */}
                            {sampleData.map((d, i) => {
                                const x =
                                    padding +
                                    (i * (chartWidth - padding * 2)) /
                                        (sampleData.length - 1);
                                const y =
                                    padding +
                                    chartHeight -
                                    (d.actual / maxValue) * chartHeight;
                                return (
                                    <circle
                                        key={`actual-${i}`}
                                        cx={x}
                                        cy={y}
                                        r="4"
                                        fill="#3b82f6"
                                        className="dark:fill-blue-400"
                                    />
                                );
                            })}

                            {/* Data points - Predicted */}
                            {sampleData.map((d, i) => {
                                const x =
                                    padding +
                                    (i * (chartWidth - padding * 2)) /
                                        (sampleData.length - 1);
                                const y =
                                    padding +
                                    chartHeight -
                                    (d.predicted / maxValue) * chartHeight;
                                return (
                                    <circle
                                        key={`predicted-${i}`}
                                        cx={x}
                                        cy={y}
                                        r="4"
                                        fill="#10b981"
                                        className="dark:fill-green-400"
                                    />
                                );
                            })}

                            {/* X-axis labels */}
                            {sampleData.map((d, i) => {
                                const x =
                                    padding +
                                    (i * (chartWidth - padding * 2)) /
                                        (sampleData.length - 1);
                                return (
                                    <text
                                        key={i}
                                        x={x}
                                        y={chartHeight + padding + 20}
                                        fontSize="10"
                                        fill="#6b7280"
                                        textAnchor="middle"
                                        className="dark:fill-neutral-500"
                                    >
                                        {new Date(d.date)
                                            .toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                            })
                                            .replace('.', '')}
                                    </text>
                                );
                            })}

                            {/* Legend */}
                            <g transform={`translate(${chartWidth - 150}, ${padding + 20})`}>
                                <line
                                    x1="0"
                                    y1="0"
                                    x2="30"
                                    y2="0"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    className="dark:stroke-blue-400"
                                />
                                <text
                                    x="35"
                                    y="4"
                                    fontSize="11"
                                    fill="#374151"
                                    className="dark:fill-neutral-300"
                                >
                                    Aktual
                                </text>
                                <line
                                    x1="0"
                                    y1="15"
                                    x2="30"
                                    y2="15"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                    strokeDasharray="4,4"
                                    className="dark:stroke-green-400"
                                />
                                <text
                                    x="35"
                                    y="19"
                                    fontSize="11"
                                    fill="#374151"
                                    className="dark:fill-neutral-300"
                                >
                                    Prediksi
                                </text>
                            </g>
                        </svg>
                    </div>
                </div>

                {/* Tabel Data & Metrics */}
                <div className="mt-16 grid gap-8 lg:grid-cols-3">
                    {/* Tabel Data */}
                    <div className="lg:col-span-2">
                        <h3 className="mb-4 text-lg font-medium text-neutral-900 dark:text-white">
                            Tabel Data Prediksi
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <table className="w-full">
                                <thead className="bg-neutral-50 dark:bg-neutral-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Tanggal
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Aktual (m)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Prediksi (m)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                            Error (m)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-800">
                                    {sampleData.map((row, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900 dark:text-white">
                                                {new Date(row.date).toLocaleDateString(
                                                    'id-ID',
                                                    {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    },
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-neutral-600 dark:text-neutral-400">
                                                {row.actual.toFixed(2)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-blue-600 dark:text-blue-400">
                                                {row.predicted.toFixed(2)}
                                            </td>
                                            <td
                                                className={`whitespace-nowrap px-4 py-3 text-right text-sm ${
                                                    row.error >= 0
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                }`}
                                            >
                                                {row.error >= 0 ? '+' : ''}
                                                {row.error.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Error Metrics */}
                    <div>
                        <h3 className="mb-4 text-lg font-medium text-neutral-900 dark:text-white">
                            Error Metrics
                        </h3>
                        <div className="space-y-4">
                            {metrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-800"
                                >
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {metric.label}
                                    </div>
                                    <div className="mt-1 flex items-baseline gap-1">
                                        <span className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                            {metric.value}
                                        </span>
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {metric.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


