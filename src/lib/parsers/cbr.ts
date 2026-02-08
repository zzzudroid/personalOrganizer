// Парсеры для работы с API Центрального Банка России
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { CurrencyRate, KeyRate } from './types';

const parseXML = promisify(parseString);

// Интерфейсы для структуры XML от ЦБ РФ
interface CBRValute {
  CharCode?: string[];
  Value?: string[];
  Nominal?: string[];
}

interface CBRRecord {
  $?: { Date?: string };
  Value?: string[];
}

interface CBRRoot {
  ValCurs?: {
    $?: { Date?: string };
    Valute?: CBRValute[];
    Record?: CBRRecord[];
  };
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

/**
 * Преобразует дату из формата DD.MM.YYYY в YYYY-MM-DD
 */
function convertDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('.');
  return `${year}-${month}-${day}`;
}

/**
 * Преобразует строку с запятой в число
 */
function parseRussianNumber(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

/**
 * Получает текущий курс доллара США к рублю
 */
export async function getUsdRate(): Promise<CurrencyRate | null> {
  const url = 'https://www.cbr.ru/scripts/XML_daily.asp';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    // Получаем данные как ArrayBuffer для правильной работы с windows-1251
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const xml = decoder.decode(buffer);

    const result = await parseXML(xml) as CBRRoot;
    const root = result.ValCurs;

    if (!root || !root.Valute) {
      return null;
    }

    // Ищем доллар США (CharCode = USD)
    for (const valute of root.Valute) {
      const charCode = valute.CharCode?.[0];

      if (charCode === 'USD') {
        const value = valute.Value?.[0];
        const date = root.$?.Date || new Date().toLocaleDateString('ru-RU');

        if (!value) {
          return null;
        }

        return {
          value: parseRussianNumber(value),
          date: convertDate(date)
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
 * Получает курс доллара на конкретную дату
 * @param dateStr - дата в формате DD/MM/YYYY
 */
export async function getRateOnDate(dateStr: string): Promise<number | null> {
  const url = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${dateStr}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const xml = decoder.decode(buffer);

    const result = await parseXML(xml) as CBRRoot;
    const root = result.ValCurs;

    if (!root || !root.Valute) {
      return null;
    }

    // Ищем доллар США
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
 * Получает историю курса доллара за указанное количество дней
 * @param days - количество дней истории (по умолчанию 30)
 */
export async function getUsdRateHistory(days: number = 30): Promise<CurrencyRate[]> {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  // Формат для API ЦБ: DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  // R01235 - код доллара США в API ЦБ РФ
  const url = `http://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=${startStr}&date_req2=${endStr}&VAL_NM_RQ=R01235`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return [];
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const xml = decoder.decode(buffer);

    const result = await parseXML(xml) as CBRRoot;
    const root = result.ValCurs;

    if (!root || !root.Record) {
      return [];
    }

    const records: CurrencyRate[] = [];

    for (const record of root.Record) {
      const date = record.$?.Date;
      const value = record.Value?.[0];

      if (date && value) {
        records.push({
          date: convertDate(date),
          value: parseRussianNumber(value)
        });
      }
    }

    // Сортируем по дате (от старых к новым)
    records.sort((a, b) => a.date.localeCompare(b.date));

    return records;
  } catch (error) {
    console.error('Ошибка получения истории курса USD:', error);
    return [];
  }
}

/**
 * Получает текущую ключевую ставку ЦБ РФ
 */
export async function getCbrKeyRate(): Promise<KeyRate | null> {
  const url = 'https://www.cbr.ru/hd_base/KeyRate/';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Паттерн для поиска строк таблицы с датой и ставкой
    // Формат: <tr><td>DD.MM.YYYY</td><td>XX,XX</td></tr>
    const pattern = /<tr>\s*<td>(\d{2}\.\d{2}\.\d{4})<\/td>\s*<td>([\d,]+)<\/td>\s*<\/tr>/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      matches.push(match);
    }

    if (matches.length > 0) {
      // Берем первую (самую свежую) запись
      const [, dateStr, rateStr] = matches[0];

      return {
        rate: parseRussianNumber(rateStr),
        date: convertDate(dateStr)
      };
    }

    return null;
  } catch (error) {
    console.error('Ошибка получения ключевой ставки ЦБ:', error);
    return null;
  }
}

/**
 * Получает историю ключевой ставки ЦБ РФ
 * @param days - максимальное количество записей (по умолчанию 90)
 */
export async function getCbrKeyRateHistory(days: number = 90): Promise<KeyRate[]> {
  const url = 'https://www.cbr.ru/hd_base/KeyRate/';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Паттерн для поиска строк таблицы
    const pattern = /<tr>\s*<td>(\d{2}\.\d{2}\.\d{4})<\/td>\s*<td>([\d,]+)<\/td>\s*<\/tr>/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      matches.push(match);
    }

    const records: KeyRate[] = [];

    // Берем только нужное количество записей
    for (let i = 0; i < Math.min(matches.length, days); i++) {
      const [, dateStr, rateStr] = matches[i];

      records.push({
        rate: parseRussianNumber(rateStr),
        date: convertDate(dateStr)
      });
    }

    // Сортируем по дате (от старых к новым) - в HTML данные идут от новых к старым
    records.reverse();

    return records;
  } catch (error) {
    console.error('Ошибка получения истории ключевой ставки:', error);
    return [];
  }
}
