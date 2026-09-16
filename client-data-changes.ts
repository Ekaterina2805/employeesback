
  return (
    <div className='container'>
      <h1>Выгрузка данных клиентов</h1>

      <div className='form-section'>
        <h3>Введите адрес получателя отчёта</h3>
        <input
          type="email"
          placeholder="example@mail.ru"
          value={email}
          onChange={handleEmailChange}
          disabled={isLoading}
        />
        {email && <p className='hint'>Email сохранён и будет предложен в следующий раз</p>}
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'view')} className='form'>

        {/*Выберите способ ввода входных данных*/}
        <div className='form-section'>
          <h3>Выберите способ ввода входных данных</h3>
          <div className='radio-group'>
            <label className='radio-label'>
              <input
                type="radio" name="inputMode" value="file"
                className='radio-input'
                checked={inputMode === 'file'}
                onChange={() => handleModeChange('file')}
                disabled={isLoading}
              />
              <span className='radio-custom'></span>
              Загрузить файл
            </label>
            <label className='radio-label'>
              <input
                type="radio" name="inputMode" value="manual"
                className='radio-input'
                checked={inputMode === 'manual'}
                onChange={() => handleModeChange('manual')}
                disabled={isLoading}
              />
              <span className='radio-custom'></span>
              Ввести вручную
            </label>
          </div>
        </div>

        {/* Режим вывода результата */}
        <div className='form-section'>
          <h3>Режим вывода результата</h3>
          <div className='radio-group'>
            <label className='radio-label'>
              <input
                type="radio" name="outputMode" value="unique"
                className='radio-input'
                checked={outputMode === 'unique'}
                onChange={(e) => setOutputMode(e.target.value)}
                disabled={isLoading}
              />
              <span className='radio-custom'></span>
              Уникальный список
            </label>
            <label className='radio-label'>
              <input
                type="radio" name="outputMode" value="matched"
                className='radio-input'
                checked={outputMode === 'matched'}
                onChange={(e) => setOutputMode(e.target.value)}
                disabled={isLoading}
              />
              <span className='radio-custom'></span>
              Как на входе (с дублями, в исходном порядке)
            </label>
          </div>
        </div>

        {/*Загрузка файла */}
        {inputMode === 'file' && (
          <div className='form-section'>
            <h3>Файл с идентификаторами</h3>
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <button type="button" className='link-btn' onClick={downloadExample}>
              Скачать пример файла
            </button>
          </div>
        )}

        {/*Ручной ввод */}
        {inputMode === 'manual' && (
          <div className='form-section'>
            <h3>Идентификаторы клиента</h3>
            <div className='fields-grid'>
              <input
                type="text" name="cifId" placeholder="CIF ID (через запятую)"
                value={formData.cifId.join(',')}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="text" name="DwhId" placeholder="DWH ID (через запятую)"
                value={formData.DwhId.join(',')}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="text" name="lastName" placeholder="Фамилия"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="text" name="firstName" placeholder="Имя"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="text" name="middleName" placeholder="Отчество"
                value={formData.middleName}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="date" name="birthDate" placeholder="Дата рождения"
                value={formData.birthDate}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="text" name="serial" placeholder="Серия документа"
                value={formData.serial}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="text" name="number" placeholder="Номер документа"
                value={formData.number}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="date" name="actDate" placeholder="Дата актуальности"
                value={formData.actDate}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {/* NEW: номер счёта / номер карты */}
              <input
                type="text" name="accountNumber" placeholder="Номер счёта"
                value={formData.accountNumber}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <input
                type="text" name="cardNumber" placeholder="Номер карты"
                value={formData.cardNumber}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/*Чекбоксы полей отчёта*/}
        <div className='form-section'>
          <h3>Выберите поля, добавляемые в отчёт</h3>
          <label className='checkbox-label'>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAllChange}
              disabled={isLoading}
            />
            Выбрать все
          </label>
          <div className='checkbox-grid'>
            {Object.keys(checkboxes).map((key) => (
              <label className='checkbox-label' key={key}>
                <input
                  type="checkbox"
                  checked={checkboxes[key]}
                  onChange={() => handleCheckboxChange(key)}
                  disabled={isLoading}
                />
                {titles[key] || key}
              </label>
            ))}
          </div>
        </div>

        {/*Кнопки действий*/}
        <div className='action-buttons'>
          <button
            type="button"
            className='view-btn'
            disabled={isLoading}
            onClick={(e) => handleSubmit(e, 'view')}
          >
            {isLoading ? (<><span className='spinner'></span>Загрузка</>) : 'Показать результат'}
          </button>

          <button
            type="button"
            className='submit-btn'
            disabled={isLoading}
            onClick={(e) => handleSubmit(e, 'email')}
          >
            {isLoading ? (<><span className='spinner'></span>Отправка</>) : 'Отправить на почту'}
          </button>
        </div>
      </form>

      {/* Таблица результата */}
      {resultData && resultData.length > 0 && (
        <div className='result-section'>
          <h3>
            Результат: {resultData.length}{' '}
            {outputMode === 'matched' ? 'строк(и) по входным данным' : 'уникальных клиентов'}
          </h3>
          <div className='table-wrapper'>
            <table className='result-table'>
              <thead>
                <tr>
                  {Object.keys(resultData[0]).map((col) => (
                    <th key={col}>{titles[col] || col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultData.map((row, i) => (
                  <tr key={i}>
                    {Object.keys(resultData[0]).map((col) => (
                      <td key={col}>
                        {row[col] == null ? '' : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f6f8;
  color: #1c1c1e;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px 64px;
}

h1 {
  font-size: 22px;
  margin-bottom: 16px;
}

.form-section {
  background: #fff;
  border: 1px solid #e2e4e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.form-section h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.hint {
  font-size: 12px;
  color: #6b7280;
  margin: 6px 0 0;
}

.radio-group {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.radio-label,
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.fields-grid,
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

input[type="text"],
input[type="date"],
input[type="email"],
input[type="file"] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d0d3d9;
  border-radius: 6px;
  font-size: 14px;
}

.link-btn {
  margin-top: 8px;
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
  text-decoration: underline;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.view-btn,
.submit-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.view-btn {
  background: #eef2ff;
  color: #3730a3;
}

.submit-btn {
  background: #2563eb;
  color: #fff;
}

.view-btn:disabled,
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

.view-btn .spinner {
  border-color: rgba(55, 48, 163, 0.3);
  border-top-color: #3730a3;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-section {
  background: #fff;
  border: 1px solid #e2e4e8;
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
}

.table-wrapper {
  overflow-x: auto;
  margin-top: 12px;
}

.result-table {
  border-collapse: collapse;
  width: 100%;
}

.result-table th,
.result-table td {
  border: 1px solid #444;
  padding: 6px 10px;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
}

.result-table th {
  background: #f3f4f6;
}

server/src/services/file/file.service.ts:

import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { FiltredClientData } from 'src/api/types';
import { ClientDataResponse } from 'src/services/client-data/dto';

@Injectable()
export class FileService {
  async parsedXLSX(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });

      if (workbook.SheetNames.length === 0) {
        throw new BadRequestException('Файл не содержит листов');
      }
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const data = XLSX.utils.sheet_to_json(worksheet);

      return data;
    } catch (error) {
      console.error(error);
      throw new BadRequestException(`Некорректный XLSX: ${error.message}`);
    }
  }

  // CHANGED: раньше сразу делал flatMap + запись в xlsx. Теперь "разворачивание"
  // массивных полей (accounts/cards) вынесено в отдельный публичный метод
  // flattenClientData — он нужен ОБА раза: и для JSON, который видит браузер,
  // и для xlsx, который уходит на почту. Раньше разворачивание происходило
  // только на этапе генерации xlsx, поэтому в таблице на фронте счета/карты
  // показывались одним "слипшимся" объектом в ячейке вместо отдельных строк.
  async generateReq(rows: Record<string, unknown>[]) {
    try {
      return this.parseJsonToXLSX(rows);
    } catch (error) {
      throw new BadRequestException(`Ошибка преобразования ${error.message}`);
    }
  }

  // CHANGED: поведение теперь разное для unique и matched (см. README —
  // раздел "Режимы выгрузки unique/matched").
  // - unique: один клиент — одна строка. Массивные поля (accounts/cards)
  //   не разворачиваются в отдельные строки, а схлопываются в одну ячейку
  //   строкой через "; " (buildUniqueRow).
  // - matched ("входящий список"): для входного идентификатора с несколькими
  //   счетами/картами — по одной строке на каждый счёт, остальные поля
  //   (включая `input`) дублируются в каждой строке (buildMatchedRows).
  flattenClientData(
    data: FiltredClientData[],
    mode: 'unique' | 'matched' = 'unique',
  ): Record<string, unknown>[] {
    if (mode === 'matched') {
      return data.flatMap((item) => this.buildMatchedRows(item));
    }
    return data.map((item) => this.buildUniqueRow(item));
  }

  private parseJsonToXLSX(rows: Object[]) {
    const now = new Date();
    const filename = `response${now.toISOString().slice(0, 10)}${now.getHours()}${now.getMinutes()}`;

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, filename);

    return XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });
  }

  // NEW: строки для mode='matched' — по одной строке на каждый счёт клиента,
  // остальные поля (включая `input`) дублируются в каждой такой строке.
  private buildMatchedRows(obj: FiltredClientData) {
    const result: any[] = [];
    const length = obj.accounts?.length || 1;

    for (let i = 0; i < length; i++) {
      result.push({
        input: obj.input, // первая колонка — исходный входной идентификатор
        cifId: obj.cifId,
        DwhId: obj.DwhId,
        lastName: obj.lastName,
        firstName: obj.firstName,
        middleName: obj.middleName,
        fullName: obj.fullName,
        birthDate: obj.birthDate,
        serial: obj.serial,
        number: obj.number,
        inn: obj.inn,
        'mainDocument.id': obj.mainDocument?.id,
        'mainDocument.serial': obj.mainDocument?.serial,
        'mainDocument.number': obj.mainDocument?.number,
        'mainDocument.type': obj.mainDocument?.type,
        'mainDocument.issuerName': obj.mainDocument?.issuerName,
        'mainDocument.subdivisionCode': obj.mainDocument?.subdivisionCode,
        'mainDocument.issuedDate': obj.mainDocument?.issuedDate,
        'mainDocument.active': obj.mainDocument?.active,
        'registrationAddress.fullAddress':
          obj.registrationAddress?.fullAddress,
        'stayPlaceAddress.fullAddress': obj.stayPlaceAddress?.fullAddress,
        'postalAddress.fullAddress': obj.postalAddress?.fullAddress,

        'accounts.number': obj.accounts?.[i]?.number,
        'accounts.openDate': obj.accounts?.[i]?.openDate,
        'accounts.contracts.contractNum':
          obj.accounts?.[i]?.contracts?.[0]?.contractNum,
        'accounts.contracts.contractId':
          obj.accounts?.[i]?.contracts?.[0]?.contractId,
        'accounts.contracts.dealStartDate':
          obj.accounts?.[i]?.contracts?.[0]?.dealStartDate,
        'accounts.contracts.portfolio':
          obj.accounts?.[i]?.contracts?.[0]?.portfolio,
        'accounts.contracts.originator':
          obj.accounts?.[i]?.contracts?.[0]?.originator,
        'accounts.contracts.hidden': obj.accounts?.[i]?.contracts?.[0]?.hidden,
        // NEW: карты, вложенные в конкретный счёт
        'accounts.cards.number': obj.accounts?.[i]?.cards?.[0]?.number,
        'accounts.cards.type': obj.accounts?.[i]?.cards?.[0]?.type,
        'accounts.cards.open': obj.accounts?.[i]?.cards?.[0]?.open,
        'accounts.cards.expire': obj.accounts?.[i]?.cards?.[0]?.expire,

        serviceStartDate: obj.servicePeriods?.[0]?.startDate ?? obj.actDate,
        serviceEndDate: obj.servicePeriods?.[0]?.endDate ?? obj.stateDate,
        actDate: obj.actDate,
        stateDate: obj.stateDate,
        acceptanceDate: obj.acceptanceDate,
        periodDate: obj.periodDate,

        'internationPasport.id': obj.internationPasport?.id,
        'internationPasport.serial': obj.internationPasport?.serial,
        'internationPasport.number': obj.internationPasport?.number,
        'internationPasport.type': obj.internationPasport?.type,
        'internationPasport.issuerName': obj.internationPasport?.issuerName,
        'internationPasport.subdivisionCode':
          obj.internationPasport?.subdivisionCode,
        'internationPasport.issuedDate': obj.internationPasport?.issuedDate,
        'internationPasport.active': obj.internationPasport?.active,
        'internationPasport.actDate': obj.internationPasport?.actDate,

        // "internationPasport.openDate": obj.internationPasport?.actDate,
        // "internationPasport.closeDate": obj.internationPasport?.issuedDate,
        // "internationPasport.actualDate": obj.internationPasport?.actualDate,
        // "internationPasport.serial": obj.internationPasport?.serial,
        // "internationPasport.number": obj.internationPasport?.number
      });
    }

    return result.map((tmp) => this.stripUndefined(tmp));
  }

  // NEW: строка для mode='unique' — один клиент = одна строка. Массивные поля
  // (accounts и вложенные в них cards) не разворачиваются в отдельные строки:
  // значения по всем элементам массива склеиваются через "; " в одну ячейку
  // (например accounts.number = "40817...1; 40817...2").
  private buildUniqueRow(obj: FiltredClientData) {
    const accounts = obj.accounts ?? [];
    const cards = accounts.flatMap((acc) => acc?.cards ?? []);
    const join = (values: unknown[]) => this.joinArrayField(values);

    const item = {
      input: obj.input,
      cifId: obj.cifId,
      DwhId: obj.DwhId,
      lastName: obj.lastName,
      firstName: obj.firstName,
      middleName: obj.middleName,
      fullName: obj.fullName,
      birthDate: obj.birthDate,
      serial: obj.serial,
      number: obj.number,
      inn: obj.inn,
      'mainDocument.id': obj.mainDocument?.id,
      'mainDocument.serial': obj.mainDocument?.serial,
      'mainDocument.number': obj.mainDocument?.number,
      'mainDocument.type': obj.mainDocument?.type,
      'mainDocument.issuerName': obj.mainDocument?.issuerName,
      'mainDocument.subdivisionCode': obj.mainDocument?.subdivisionCode,
      'mainDocument.issuedDate': obj.mainDocument?.issuedDate,
      'mainDocument.active': obj.mainDocument?.active,
      'registrationAddress.fullAddress': obj.registrationAddress?.fullAddress,
      'stayPlaceAddress.fullAddress': obj.stayPlaceAddress?.fullAddress,
      'postalAddress.fullAddress': obj.postalAddress?.fullAddress,

      'accounts.number': join(accounts.map((a) => a?.number)),
      'accounts.openDate': join(accounts.map((a) => a?.openDate)),
      'accounts.contracts.contractNum': join(
        accounts.map((a) => a?.contracts?.[0]?.contractNum),
      ),
      'accounts.contracts.contractId': join(
        accounts.map((a) => a?.contracts?.[0]?.contractId),
      ),
      'accounts.contracts.dealStartDate': join(
        accounts.map((a) => a?.contracts?.[0]?.dealStartDate),
      ),
      'accounts.contracts.portfolio': join(
        accounts.map((a) => a?.contracts?.[0]?.portfolio),
      ),
      'accounts.contracts.originator': join(
        accounts.map((a) => a?.contracts?.[0]?.originator),
      ),
      'accounts.contracts.hidden': join(
        accounts.map((a) => a?.contracts?.[0]?.hidden),
      ),
      // карты вложены в счета — берём все карты всех счетов клиента
      'accounts.cards.number': join(cards.map((c) => c?.number)),
      'accounts.cards.type': join(cards.map((c) => c?.type)),
      'accounts.cards.open': join(cards.map((c) => c?.open)),
      'accounts.cards.expire': join(cards.map((c) => c?.expire)),

      serviceStartDate: obj.servicePeriods?.[0]?.startDate ?? obj.actDate,
      serviceEndDate: obj.servicePeriods?.[0]?.endDate ?? obj.stateDate,
      actDate: obj.actDate,
      stateDate: obj.stateDate,
      acceptanceDate: obj.acceptanceDate,
      periodDate: obj.periodDate,

      'internationPasport.id': obj.internationPasport?.id,
      'internationPasport.serial': obj.internationPasport?.serial,
      'internationPasport.number': obj.internationPasport?.number,
      'internationPasport.type': obj.internationPasport?.type,
      'internationPasport.issuerName': obj.internationPasport?.issuerName,
      'internationPasport.subdivisionCode':
        obj.internationPasport?.subdivisionCode,
      'internationPasport.issuedDate': obj.internationPasport?.issuedDate,
      'internationPasport.active': obj.internationPasport?.active,
      'internationPasport.actDate': obj.internationPasport?.actDate,
    };

    return this.stripUndefined(item);
  }

  // NEW: склеивает значения массивного поля в одну строку для unique-режима.
  // Пустые/отсутствующие значения отбрасываются; если значений нет — undefined
  // (колонка не попадёт в строку, как и раньше для отсутствующих полей).
  private joinArrayField(values: unknown[]): string | undefined {
    const filtered = values.filter((v) => v !== undefined && v !== null && v !== '');
    return filtered.length ? filtered.join('; ') : undefined;
  }

  private stripUndefined(tmp: Record<string, unknown>) {
    const item: Record<string, unknown> = {};
    Object.keys(tmp).forEach((key) => {
      if (tmp[key] != undefined) {
        item[key] = tmp[key];
      }
    });
    return item;
  }
}

server/src/api/api.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { FiltredClientData, RequestData, SelectedFields } from './types';
import { ClientDataResponse } from 'src/services/client-data/dto';
import { FileService } from 'src/services/file/file.service';
import { ClientDataService } from 'src/services/client-data/client-data.service';

@Injectable()
export class ApiService {
  constructor(
    private readonly fileService: FileService,
    private readonly clientDataService: ClientDataService,
  ) {}

  async parseFile(file: Express.Multer.File): Promise<RequestData[]> {
    const xlsxData = await this.fileService.parsedXLSX(file);

    if (!xlsxData) {
      throw new BadRequestException('Нет данных');
    }

    const result: RequestData[] = xlsxData.map((row: any) => {
      const item: RequestData = {};
      if (row.cifId || row.cif_id) {
        item.cifId = [Number(row.cifId || row.cif_id)];
      }
      if (row.DwhId) {
        item.DwhId = [Number(row.DwhId)];
      }
      if (row.lastName) {
        item.lastName = String(row.lastName);
      }
      if (row.firstName) {
        item.firstName = String(row.firstName);
      }
      if (row.middleName) {
        item.middleName = String(row.middleName);
      }
      if (row.serial) {
        item.serial = Number(row.serial);
      }
      if (row.number) {
        item.number = Number(row.number);
      }
      if (row.birthDate) {
        item.birthDate = String(row.birthDate);
      }
      if (row.actDate) {
        item.actDate = String(row.actDate);
      }
      // NEW: номер счёта / номер карты из файла
      if (row.accountNumber) {
        item.accountNumber = String(row.accountNumber);
      }
      if (row.cardNumber) {
        item.cardNumber = String(row.cardNumber);
      }
      return item;
    });
    return result;
  }

  async generateClientRequest(
    cdi: RequestData[],
    additionalFields: SelectedFields,
    mode: 'unique' | 'matched' = 'unique', // NEW
  ): Promise<Record<string, unknown>[]> {
    const clientDataRes = await this.clientDataService.fetchClientFL(cdi);
    // console.log(JSON.stringify(clientDataRes))
    if (!clientDataRes) {
      throw new BadRequestException('Данные не были найдены');
    }

    let filtered: FiltredClientData[];

    if (mode === 'matched') {
      // одна запись на каждый входной идентификатор, в исходном порядке,
      // с дублями; первая колонка — сам входной идентификатор
      filtered = cdi.map((input) => {
        const cdr = this.findCdrForInput(input, clientDataRes);
        const inputLabel = this.formatInputLabel(input);
        if (!cdr) {
          return { input: inputLabel } as FiltredClientData;
        }
        return {
          input: inputLabel,
          ...this.getFieldsFromCDIRes(cdr, additionalFields, [input]),
        };
      });
    } else {
      filtered = clientDataRes.map((cdr) =>
        this.getFieldsFromCDIRes(cdr, additionalFields, cdi),
      );
    }

    // CHANGED: раньше здесь сразу вызывался this.fileService.generateReq(filtered)
    // (сразу превращая всё в xlsx-буфер). Теперь превращаем в строки таблицы
    // уже здесь — ОДИНАКОВО для JSON, который увидит браузер, и для xlsx-письма.
    // Поведение зависит от mode (см. flattenClientData в FileService):
    // - unique: один клиент — одна строка, массивные поля (accounts/cards)
    //   склеены в одну ячейку через "; ".
    // - matched: если у входного идентификатора несколько счетов/карт — на
    //   выходе будет несколько строк с одинаковым `input`, по одной на счёт.
    return this.fileService.flattenClientData(filtered, mode);
  }

  // NEW: генерация xlsx — принимает уже развёрнутые (flattenClientData) строки
  async buildXlsx(rows: Record<string, unknown>[]) {
    return this.fileService.generateReq(rows);
  }

  getFieldsFromCDIRes(
    cdr: ClientDataResponse,
    additionalFields: SelectedFields,
    cdi: RequestData[],
  ): FiltredClientData {
    const result: FiltredClientData = {};
    additionalFields.forEach((field) => {
      if (field in cdr) {
        result[field] = cdr[field];
      }
      if (
        field == 'startDate' &&
        cdr.servicePeriods?.length &&
        cdr.servicePeriods[0]?.startDate
      ) {
        result['startDate'] = cdr.servicePeriods?.[0]?.startDate;
      }
      if (
        field == 'endDate' &&
        cdr.servicePeriods?.length &&
        cdr.servicePeriods[0]?.endDate
      ) {
        result['endDate'] = cdr.servicePeriods?.[0]?.endDate;
      }
      if (field == 'internationPasport' && cdr.documents?.length == 2) {
        result['internationPasport'] = cdr.documents[1];
      }
      if (field == 'acceptanceDate' && cdr.serviceStartDate) {
        result['acceptanceDate'] = cdr.serviceStartDate;
      }
      if (field == 'periodDate') {
        result['periodDate'] = cdr.servicePeriods?.[0]?.startDate;
      }
      for (const input of cdi) {
        result['cifId'] = cdr['mdmId'];

        if (input.DwhId && cdr['id'] && input.DwhId.includes(cdr['id'])) {
          result['DwhId'] = cdr['id'];
        }
        if (
          input.lastName &&
          cdr['lastName'] &&
          input.lastName == cdr.lastName
        ) {
          result['lastName'] = cdr['lastName'];
        }
        if (
          input.lastName &&
          cdr['firstName'] &&
          input.firstName == cdr.firstName
        ) {
          result['firstName'] = cdr['firstName'];
        }
        if (
          input.lastName &&
          cdr['middleName'] &&
          input.middleName == cdr.middleName
        ) {
          result['middleName'] = cdr['middleName'];
        }
        if (
          input.lastName &&
          cdr['birthDate'] &&
          input.birthDate == cdr.birthDate
        ) {
          result['birthDate'] = cdr['birthDate'];
        }
        if (
          input.serial &&
          cdr?.mainDocument?.serial &&
          input.serial == Number(cdr.mainDocument.serial)
        ) {
          result['serial'] = cdr.mainDocument.serial;
        }
        if (
          input.number &&
          cdr?.mainDocument?.number &&
          input.number == Number(cdr.mainDocument?.number)
        ) {
          result['number'] = cdr.mainDocument.number;
        }
        if (input.actDate && cdr['actDate'] && input.actDate == cdr.actDate) {
          result['actDate'] = cdr['actDate'];
        }
        // NEW: номер счёта — сверяем со всеми счетами клиента
        if (
          input.accountNumber &&
          cdr.accounts?.some((acc) => acc?.number === input.accountNumber)
        ) {
          result['accountNumber'] = input.accountNumber;
        }
        // NEW: номер карты — карты вложены внутрь каждого счёта
        if (
          input.cardNumber &&
          cdr.accounts?.some((acc) =>
            acc?.cards?.some((card) => card?.number === input.cardNumber),
          )
        ) {
          result['cardNumber'] = input.cardNumber;
        }
      }
    });
    return result as FiltredClientData;
  }

  // NEW: находим клиента, соответствующего конкретному входному идентификатору
  // (используется только в mode='matched')
  private findCdrForInput(
    input: RequestData,
    clientDataRes: ClientDataResponse[],
  ): ClientDataResponse | undefined {
    if (input.cifId?.length) {
      const cifId = input.cifId[0];
      return clientDataRes.find((cdr) => cdr['mdmId'] === cifId);
    }
    if (input.DwhId?.length) {
      const dwhId = input.DwhId[0];
      return clientDataRes.find((cdr) => cdr['id'] === dwhId);
    }
    if (
      input.lastName &&
      input.firstName &&
      input.middleName &&
      input.birthDate
    ) {
      return clientDataRes.find(
        (cdr) =>
          cdr.lastName === input.lastName &&
          cdr.firstName === input.firstName &&
          cdr.middleName === input.middleName &&
          cdr.birthDate === input.birthDate,
      );
    }
    if (input.serial && input.number) {
      return clientDataRes.find(
        (cdr) =>
          cdr?.mainDocument?.serial &&
          cdr?.mainDocument?.number &&
          input.serial === Number(cdr.mainDocument.serial) &&
          input.number === Number(cdr.mainDocument.number),
      );
    }
    if (input.accountNumber) {
      return clientDataRes.find((cdr) =>
        cdr.accounts?.some((acc) => acc?.number === input.accountNumber),
      );
    }
    if (input.cardNumber) {
      return clientDataRes.find((cdr) =>
        cdr.accounts?.some((acc) =>
          acc?.cards?.some((card) => card?.number === input.cardNumber),
        ),
      );
    }
    return undefined;
  }

  // NEW: как показать входной идентификатор в первой колонке (mode='matched')
  private formatInputLabel(input: RequestData): string {
    return (
      input.cifId?.join(',') ||
      input.DwhId?.join(',') ||
      input.accountNumber ||
      input.cardNumber ||
      [input.lastName, input.firstName, input.middleName]
        .filter(Boolean)
        .join(' ') ||
      [input.serial, input.number].filter(Boolean).join('/') ||
      ''
    );
  }
}

