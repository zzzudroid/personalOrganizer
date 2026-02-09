/**
 * @file Парсеры для работы с API Центрального Банка России
 * @description Модуль для получения финансовых данных от ЦБ РФ:
 * - Текущий курс доллара США (USD/RUB)
 * - Курс доллара на конкретную дату
 * - История курса доллара за период
 * - Текущая ключевая ставка ЦБ РФ
 * - История изменений ключевой ставки
 *
 * Особенности работы с API ЦБ РФ:
 * 1. XML-ответы в кодировке windows-1251 (требуется TextDecoder)
 * 2. Числа используют запятую как десятичный разделитель (91,5 → 91.5)
 * 3. Даты в формате DD.MM.YYYY (конвертируются в YYYY-MM-DD)
 * 4. Для ключевой ставки используется HTML-парсинг (не XML API)
 */

import { parseString } from 'xml2js';
import { promisify } from 'util';
import { CurrencyRate, KeyRate } from './types';

// Промисифицируем xml2js для использования с async/await вместо callback
const parseXML = promisify(parseString);

// ============================================================================
// Интерфейсы для типизации XML-структур от ЦБ РФ
// ============================================================================

/**
 * Структура элемента <Valute> в XML ежедневных курсов.
 * Каждый элемент представляет одну валюту (USD, EUR, GBP и т.д.).
 * xml2js оборачивает значения в массивы, поэтому типы — string[].
 */
interface CBRValute {
  /** Буквенный код валюты (например, ["USD"]) */
  CharCode?: string[];
  /** Курс к рублю с запятой (например, ["91,5"]) */
  Value?: string[];
  /** Номинал (количество единиц валюты, например, ["1"]) */
  Nominal?: string[];
}

/**
 * Структура элемента <Record> в XML динамического курса (история).
 * Каждый Record — курс валюты на конкретную дату.
 */
interface CBRRecord {
  /** Атрибуты XML-элемента, включая дату в формате DD.MM.YYYY */
  $?: { Date?: string };
  /** Значение курса с запятой */
  Value?: string[];
}

/**
 * Корневая структура XML-ответа от ЦБ РФ.
 * Может содержать ValCurs (для курсов) или Envelope (для SOAP API).
 *
 * Для ежедневных курсов: ValCurs → Valute[]
 * Для истории курсов: ValCurs → Record[]
 */
interface CBRRoot {
  /** Корневой элемент для курсов валют */
  ValCurs?: {
    /** Атрибуты корневого элемента (дата) */
    $?: { Date?: string };
    /** Массив валют (для ежедневных курсов) */
    Valute?: CBRValute[];
    /** Массив записей (для исторических курсов) */
    Record?: CBRRecord[];
  };
  /** Корневой элемент для SOAP API (альтернативный метод) */
  Envelope?: {
    Body?: Array<{
      GetLatestDateTime_Resp?: Array<{
        GetLatestDateTime_ResResult?: string[];
      }>;
      GetCursDynamicResult?: Array<{
        ValuteData?: Array<{
          ValuteCursOnDate?: Array<{
            Vname?: string[];
            Vnom?: string[];
            Vcurs?: string[];
            VunitRate?: string[];
          }>;
        }>;
      }>;
    }>;
  };
}

// ============================================================================
// Вспомогательные функции
// ============================================================================

/**
 * Преобразует дату из российского формата DD.MM.YYYY в ISO-подобный YYYY-MM-DD.
 * Необходимо для единообразия хранения и сортировки дат в приложении.
 *
 * @param dateStr - дата в формате "DD.MM.YYYY" (например, "15.01.2024")
 * @returns дата в формате "YYYY-MM-DD" (например, "2024-01-15")
 */
function convertDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('.');
  return `${year}-${month}-${day}`;
}

/**
 * Преобразует строку с русским десятичным разделителем (запятая) в число.
 * ЦБ РФ использует запятую вместо точки: "91,5" → 91.5
 *
 * @param value - строковое представление числа с запятой (например, "91,5125")
 * @returns числовое значение (например, 91.5125)
 */
function parseRussianNumber(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

// ============================================================================
// Основные функции парсера
// ============================================================================

/**
 * Получает текущий курс доллара США к рублю.
 *
 * Алгоритм работы:
 * 1. Запрашивает XML с ежедневными курсами валют (XML_daily.asp)
 * 2. Декодирует ответ из windows-1251 в UTF-8 через ArrayBuffer + TextDecoder
 * 3. Парсит XML через xml2js в JavaScript-объект
 * 4. Ищет элемент <Valute> с CharCode = "USD"
 * 5. Конвертирует значение и дату в нужные форматы
 *
 * @returns {Promise<CurrencyRate | null>} Объект с курсом и датой, или null при ошибке
 */
export async function getUsdRate(): Promise<CurrencyRate | null> {
  // URL ежедневных курсов валют ЦБ РФ
  const url = 'https://www.cbr.ru/scripts/XML_daily.asp';

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    // Получаем данные как ArrayBuffer для правильной работы с windows-1251.
    // Стандартный response.text() использует UTF-8 и исказит кириллицу.
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const xml = decoder.decode(buffer);

    // Парсим XML в JavaScript-объект (xml2js оборачивает значения в массивы)
    const result = await parseXML(xml) as CBRRoot;
    const root = result.ValCurs;

    if (!root || !root.Valute) {
      return null;
    }

    // Перебираем все валюты и ищем доллар США (CharCode = "USD")
    for (const valute of root.Valute) {
      const charCode = valute.CharCode?.[0];

      if (charCode === 'USD') {
        const value = valute.Value?.[0];
        // Дата берется из атрибута корневого элемента или текущая дата как fallback
        const date = root.$?.Date || new Date().toLocaleDateString('ru-RU');

        if (!value) {
          return null;
        }

        return {
          value: parseRussianNumber(value), // "91,5125" → 91.5125
          date: convertDate(date)            // "15.01.2024" → "2024-01-15"
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Ошибка получения курса USD:', error);
    return null;
  }
}

/**
 * Получает курс доллара на конкретную дату.
 *
 * Использует тот же XML_daily.asp, но с параметром date_req для указания даты.
 * Если на запрошенную дату курс не устанавливался (выходной, праздник),
 * ЦБ РФ возвращает курс за ближайший предшествующий рабочий день.
 *
 * @param dateStr - дата в формате DD/MM/YYYY (формат API ЦБ РФ)
 * @returns {Promise<number | null>} Числовое значение курса или null при ошибке
 */
export async function getRateOnDate(dateStr: string): Promise<number | null> {
  // URL с параметром даты для получения курса на конкретный день
  const url = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${dateStr}`;

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    // Декодирование из windows-1251 (аналогично getUsdRate)
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const xml = decoder.decode(buffer);

    const result = await parseXML(xml) as CBRRoot;
    const root = result.ValCurs;

    if (!root || !root.Valute) {
      return null;
    }

    // Ищем доллар США среди всех валют
    for (const valute of root.Valute) {
      const charCode = valute.CharCode?.[0];

      if (charCode === 'USD') {
        const value = valute.Value?.[0];

        if (!value) {
          return null;
        }

        return parseRussianNumber(value);
      }
    }

    return null;
  } catch (error) {
    console.error('Ошибка получения курса на дату:', error);
    return null;
  }
}

/**
 * Получает историю курса доллара за указанное количество дней.
 *
 * Использует API динамических курсов (XML_dynamic.asp), который принимает:
 * - date_req1: начальная дата (DD/MM/YYYY)
 * - date_req2: конечная дата (DD/MM/YYYY)
 * - VAL_NM_RQ: внутренний код валюты (R01235 = доллар США)
 *
 * Ответ содержит элементы <Record> с датой и значением курса.
 * Результат сортируется хронологически для корректного отображения на графике.
 *
 * @param days - количество дней истории (по умолчанию 30)
 * @returns {Promise<CurrencyRate[]>} Массив курсов, отсортированный от старых к новым
 */
export async function getUsdRateHistory(days: number = 30): Promise<CurrencyRate[]> {
  // Вычисляем начальную и конечную даты периода
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  /**
   * Форматирует дату в формат DD/MM/YYYY для API ЦБ РФ.
   * Месяц и день дополняются нулём до 2 цифр.
   */
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  // R01235 — внутренний код доллара США в системе ЦБ РФ
  // Используем HTTP (не HTTPS) для XML_dynamic.asp — у ЦБ РФ бывают проблемы с SSL на этом эндпоинте
  const url = `http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=${startStr}&date_req2=${endStr}&VAL_NM_RQ=R01235`;

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return [];
    }

    // Декодирование из windows-1251 (стандартный процесс для API ЦБ РФ)
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const xml = decoder.decode(buffer);

    const result = await parseXML(xml) as CBRRoot;
    const root = result.ValCurs;

    if (!root || !root.Record) {
      return [];
    }

    // Преобразуем XML-записи в массив CurrencyRate
    const records: CurrencyRate[] = [];

    for (const record of root.Record) {
      const date = record.$?.Date;   // Дата из атрибута элемента (DD.MM.YYYY)
      const value = record.Value?.[0]; // Значение курса

      if (date && value) {
        records.push({
          date: convertDate(date),         // DD.MM.YYYY → YYYY-MM-DD
          value: parseRussianNumber(value)  // "91,5125" → 91.5125
        });
      }
    }

    // Сортируем по дате (от старых к новым) для корректного отображения на графике
    records.sort((a, b) => a.date.localeCompare(b.date));

    return records;
  } catch (error) {
    console.error('Ошибка получения истории курса USD:', error);
    return [];
  }
}

/**
 * Получает текущую ключевую ставку ЦБ РФ.
 *
 * В отличие от курсов валют, для ключевой ставки нет XML API.
 * Данные парсятся из HTML-таблицы на странице ЦБ РФ.
 *
 * Алгоритм:
 * 1. Загружает HTML-страницу с историей ключевой ставки
 * 2. Ищет строки таблицы через регулярное выражение
 *    (формат: <tr><td>DD.MM.YYYY</td><td>XX,XX</td></tr>)
 * 3. Берет первую строку — она соответствует самой свежей ставке
 * 4. Конвертирует дату и значение в нужные форматы
 *
 * @returns {Promise<KeyRate | null>} Объект с текущей ставкой и датой, или null при ошибке
 */
export async function getCbrKeyRate(): Promise<KeyRate | null> {
  // URL страницы ЦБ РФ с историей ключевой ставки
  const url = 'https://www.cbr.ru/hd_base/KeyRate/';

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Регулярное выражение для поиска строк таблицы с датой и значением ставки.
    // Формат строки: <tr><td>DD.MM.YYYY</td><td>XX,XX</td></tr>
    // Группа 1: дата (DD.MM.YYYY), Группа 2: значение ставки (XX,XX)
    const pattern = /<tr>\s*<td>(\d{2}\.\d{2}\.\d{4})<\/td>\s*<td>([\d,]+)<\/td>\s*<\/tr>/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;

    // Собираем все совпадения из HTML
    while ((match = pattern.exec(html)) !== null) {
      matches.push(match);
    }

    if (matches.length > 0) {
      // Первая запись в таблице — самая свежая ставка (таблица отсортирована от новых к старым)
      const [, dateStr, rateStr] = matches[0];

      return {
        rate: parseRussianNumber(rateStr), // "16,00" → 16.0
        date: convertDate(dateStr)          // "25.10.2024" → "2024-10-25"
      };
    }

    return null;
  } catch (error) {
    console.error('Ошибка получения ключевой ставки ЦБ:', error);
    return null;
  }
}

/**
 * Получает историю ключевой ставки ЦБ РФ.
 *
 * Парсит ту же HTML-страницу, что и getCbrKeyRate, но извлекает несколько записей.
 * Параметр days ограничивает количество записей (НЕ дней), так как
 * ключевая ставка меняется не ежедневно, а по решениям Совета директоров ЦБ РФ
 * (обычно 8 заседаний в год).
 *
 * Результат разворачивается (reverse) для хронологического порядка:
 * в HTML данные идут от новых к старым, а для графика нужно от старых к новым.
 *
 * @param days - максимальное количество записей (по умолчанию 90)
 * @returns {Promise<KeyRate[]>} Массив ставок, отсортированный от старых к новым
 */
export async function getCbrKeyRateHistory(days: number = 90): Promise<KeyRate[]> {
  // URL страницы ЦБ РФ с историей ключевой ставки (тот же, что и для текущей ставки)
  const url = 'https://www.cbr.ru/hd_base/KeyRate/';

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Тот же паттерн для извлечения строк таблицы
    const pattern = /<tr>\s*<td>(\d{2}\.\d{2}\.\d{4})<\/td>\s*<td>([\d,]+)<\/td>\s*<\/tr>/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;

    // Собираем все совпадения из HTML
    while ((match = pattern.exec(html)) !== null) {
      matches.push(match);
    }

    const records: KeyRate[] = [];

    // Берем только нужное количество записей (ограничено параметром days)
    for (let i = 0; i < Math.min(matches.length, days); i++) {
      const [, dateStr, rateStr] = matches[i];

      records.push({
        rate: parseRussianNumber(rateStr), // "16,00" → 16.0
        date: convertDate(dateStr)          // "25.10.2024" → "2024-10-25"
      });
    }

    // Разворачиваем массив: в HTML данные идут от новых к старым,
    // а для графика Chart.js нужен хронологический порядок (от старых к новым)
    records.reverse();

    return records;
  } catch (error) {
    console.error('Ошибка получения истории ключевой ставки:', error);
    return [];
  }
}
