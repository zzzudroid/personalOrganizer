"use client";

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RateChartProps {
  data: Array<{ date: string; value: number }>;
  color: string;
  label: string;
}

export default function RateChart({ data, color, label }: RateChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Уничтожаем предыдущий график
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Подготавливаем данные
    const labels = data.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    });
    const values = data.map(item => item.value);

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              if (value === null) return '';
              return `${label}: ${value.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            maxTicksLimit: 6,
            font: { size: 11 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.08)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { size: 11 }
          }
        }
      }
    };

    // Создаем новый график
    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            borderColor: color,
            backgroundColor: `${color}20`,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2
          }
        ]
      },
      options
    });

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, color, label]);

  return (
    <div className="w-full h-52">
      <canvas ref={canvasRef} />
    </div>
  );
}
