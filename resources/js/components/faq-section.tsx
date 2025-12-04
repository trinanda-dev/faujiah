import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
    {
        question: 'Apa itu tinggi gelombang?',
        answer:
            'Tinggi gelombang adalah jarak vertikal antara puncak (crest) dan lembah (trough) gelombang laut. Parameter ini penting untuk keselamatan pelayaran, aktivitas nelayan, dan pemantauan kondisi laut. Sistem WHIPS memprediksi tinggi gelombang berdasarkan data meteorologi seperti kecepatan angin, tekanan udara, dan parameter cuaca lainnya.',
    },
    {
        question: 'Dari mana data diperoleh?',
        answer:
            'Data meteorologi diperoleh secara otomatis dari sumber terpercaya melalui API. Sistem mengambil data real-time termasuk kecepatan angin, tekanan udara, suhu, dan curah hujan. Data diupdate setiap 30 menit untuk memastikan akurasi prediksi yang optimal.',
    },
    {
        question: 'Seberapa akurat model ini?',
        answer:
            'Model Hybrid ARIMAX–LSTM yang digunakan dalam sistem ini telah diuji dan menunjukkan akurasi tinggi dengan nilai MAE (Mean Absolute Error) sekitar 0.032 m, RMSE (Root Mean Square Error) sekitar 0.041 m, dan MAPE (Mean Absolute Percentage Error) sekitar 2.1%. Akurasi ini cukup baik untuk aplikasi praktis dalam prediksi tinggi gelombang laut.',
    },
    {
        question: 'Bisakah digunakan untuk area selain lokasi penelitian?',
        answer:
            'Sistem ini dikembangkan dan dikalibrasi untuk lokasi penelitian tertentu. Untuk digunakan di area lain, model perlu dikalibrasi ulang dengan data historis dari lokasi tersebut. Namun, arsitektur model yang sama dapat diterapkan dengan melakukan training ulang menggunakan data lokal untuk mendapatkan akurasi yang optimal.',
    },
    {
        question: 'Apa perbedaan ARIMAX dan Hybrid ARIMAX–LSTM?',
        answer:
            'ARIMAX adalah model statistik yang menggabungkan autokorelasi data time series dengan variabel eksogen (seperti kecepatan angin, tekanan udara). Model ini efektif untuk menangkap pola linear dalam data. Hybrid ARIMAX–LSTM menggabungkan ARIMAX untuk komponen linear dan LSTM (Long Short-Term Memory) untuk menangkap pola non-linear yang kompleks. Model hybrid ini umumnya memberikan akurasi lebih tinggi karena dapat menangkap kedua jenis pola dalam data gelombang laut.',
    },
];

export default function FAQSection() {
    const [openItems, setOpenItems] = useState<number[]>([]);

    const toggleItem = (index: number): void => {
        setOpenItems((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index],
        );
    };

    return (
        <section
            id="faq"
            className="bg-neutral-50 py-16 md:py-24 lg:py-32 dark:bg-neutral-900"
        >
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                        Pertanyaan Umum
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Jawaban untuk pertanyaan yang sering diajukan tentang
                        sistem WHIPS
                    </p>
                </div>

                <div className="mt-12 space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openItems.includes(index);
                        return (
                            <Collapsible
                                key={index}
                                open={isOpen}
                                onOpenChange={() => toggleItem(index)}
                            >
                                <CollapsibleTrigger className="w-full">
                                    <div className="group flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-6 py-4 text-left transition-all hover:border-blue-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:hover:border-blue-700 dark:hover:bg-neutral-700/50">
                                        <h3 className="flex-1 text-base font-medium text-neutral-900 dark:text-white">
                                            {faq.question}
                                        </h3>
                                        <ChevronDown
                                            className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-200 ${
                                                isOpen
                                                    ? 'rotate-180'
                                                    : ''
                                            } dark:text-neutral-400`}
                                        />
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="rounded-b-lg border-x border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800">
                                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}


