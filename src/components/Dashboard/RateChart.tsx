"use client";

/**
 * Компонент линейного графика для отображения динамики финансовых данных.
 *
 * Обёртка над Chart.js (версия 4), создающая адаптивный линейный график
 * с заливкой области под кривой. Используется внутри CurrencyPanel
 * для визуализации истории курсов валют, криптовалют и ключевой ставки.
 *
 * Особенности:
 * - Ручная регистрация необходимых компонентов Chart.js (обязательно в v4)
 * - Прямая работа с Canvas API через ref (без react-chartjs-2)
 * - Автоматическое уничтожение и пересоздание графика при изменении данных
 * - Плавные кривые (tension: 0.4) без отображения точек
 * - Тёмная тема оформления (белый текст на тёмном фоне)
 * - Русский формат дат на оси X
 */

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

/**
 * Регистрация необходимых компонентов Chart.js.
 * В версии 4 Chart.js использует tree-shaking, поэтому каждый компонент
 * (шкала, элемент, контроллер, плагин) необходимо регистрировать явно.
 * Без регистрации график не отрисуется и выбросит ошибку.
 */
ChartJS.register(
  CategoryScale,   // Шкала категорий (ось X с текстовыми метками)
  LinearScale,     // Линейная числовая шкала (ось Y)
  PointElement,    // Элемент точки на графике
  LineElement,     // Элемент линии (соединяет точки)
  LineController,  // Контроллер линейного графика
  Title,           // Плагин заголовка графика
  Tooltip,         // Плагин всплывающих подсказок
  Legend,          // Плагин легенды
  Filler           // Плагин заливки области под линией
);

/** Пропсы компонента RateChart */
interface RateChartProps {
  /** Массив точек данных: дата (строка) и числовое значение */
  data: Array<{ date: string; value: number }>;
  /** Цвет линии графика (HEX-строка, например "#3b82f6") */
  color: string;
  /** Подпись набора данных (отображается в тултипе при наведении) */
  label: string;
}

/**
 * Компонент линейного графика финансовых данных.
 * Создаёт и управляет экземпляром Chart.js на элементе canvas.
 *
 * @param data - Массив точек {date, value} для отображения на графике
 * @param color - HEX-цвет линии графика
 * @param label - Текстовая подпись для тултипа
 * @returns JSX-элемент с canvas внутри контейнера фиксированной высоты
 */
export default function RateChart({ data, color, label }: RateChartProps) {
  /** Ref на HTML-элемент canvas для рисования графика */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /** Ref на экземпляр Chart.js для управления жизненным циклом графика */
  const chartRef = useRef<ChartJS | null>(null);

  /**
   * Эффект: создаёт/пересоздаёт график при изменении данных, цвета или подписи.
   *
   * Логика работы:
   * 1. Уничтожает предыдущий экземпляр графика (если есть) для предотвращения утечек памяти
   * 2. Получает 2D-контекст canvas
   * 3. Подготавливает массивы меток (даты) и значений
   * 4. Создаёт новый экземпляр Chart.js с настроенной конфигурацией
   * 5. При размонтировании/пересоздании — уничтожает график (cleanup)
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    // Уничтожаем предыдущий график для предотвращения наложения
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Подготавливаем данные: преобразуем даты в русский формат для оси X
    const labels = data.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    });

    // Извлекаем массив числовых значений для оси Y
    const values = data.map(item => item.value);

    /**
     * Конфигурация опций графика Chart.js:
     * - responsive: адаптивная ширина под контейнер
     * - maintainAspectRatio: false — высота определяется контейнером, а не соотношением сторон
     * - Легенда скрыта (display: false)
     * - Тултип настроен на тёмную тему с форматированием значений
     */
    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false  // Легенда не нужна — один набор данных
        },
        tooltip: {
          mode: 'index',                            // Тултип срабатывает по вертикальной линии
          intersect: false,                          // Не требуется точное наведение на точку
          backgroundColor: 'rgba(30, 30, 30, 0.9)', // Тёмный полупрозрачный фон
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            // Форматирование значения в тултипе: "Подпись: 123.45"
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
            display: false  // Вертикальные линии сетки скрыты для чистоты
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)', // Полупрозрачный белый текст
            maxTicksLimit: 6,                    // Ограничение количества меток на оси X
            font: { size: 11 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.08)' // Еле видимые горизонтальные линии сетки
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { size: 11 }
          }
        }
      }
    };

    // Создаём новый экземпляр графика Chart.js
    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            borderColor: color,                // Цвет линии
            backgroundColor: `${color}20`,     // Цвет заливки: тот же цвет с 12.5% прозрачностью (hex "20")
            tension: 0.4,                      // Плавность кривой (0 = ломаная, 1 = очень плавная)
            fill: true,                        // Заливка области под кривой
            pointRadius: 0,                    // Точки не отображаются в обычном состоянии
            pointHoverRadius: 4,               // Точка появляется при наведении курсора
            borderWidth: 2                     // Толщина линии
          }
        ]
      },
      options
    });

    // Функция очистки: уничтожаем график при размонтировании или пересоздании
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, color, label]);

  return (
    // Контейнер с фиксированной высотой 208px (h-52) для графика
    <div className="w-full h-52">
      <canvas ref={canvasRef} />
    </div>
  );
}
