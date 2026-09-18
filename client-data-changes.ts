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
      if (row.account) {
        item.account = [String(row.account)];
      }
      if (row.cardNumber) {
        item.cardNumber = [String(row.cardNumber)];
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
      // с дублями. expandForMatched разворачивает один RequestData с
      // несколькими значениями (ручной ввод: cifId/DwhId/account/cardNumber
      // через запятую прилетают одним объектом) в несколько — иначе
      // нашёлся бы только первый подходящий клиент и остальные введённые
      // номера проигнорировались бы. findAllCdrForMatch возвращает ВСЕХ
      // клиентов, подошедших под конкретный идентификатор (а не только
      // первого) — один и тот же введённый номер может совпасть с
      // несколькими клиентами.
      filtered = this.expandForMatched(cdi).flatMap((input) => {
        const cdrs = this.findAllCdrForMatch(input, clientDataRes);
        if (!cdrs.length) {
          return [{} as FiltredClientData];
        }
        return cdrs.map((cdr) =>
          this.getFieldsFromCDIRes(cdr, additionalFields, [input]),
        );
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
    //   выходе будет несколько строк с одинаковыми остальными полями,
    //   по одной на счёт.
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
    });

    // CHANGED: раньше этот блок был вложен в additionalFields.forEach — из-за
    // этого при пустом additionalFields (ни один чекбокс отчёта не выбран)
    // он не выполнялся вообще, и cifId/lastName/account/cardNumber и т.д.
    // не устанавливались, даже если совпадение реально было. Он не зависит
    // от `field`, поэтому вынесен наружу и выполняется ровно один раз.
    for (const input of cdi) {
      result['cifId'] = cdr['mdmId'];

      if (input.DwhId && cdr['id'] && input.DwhId.includes(cdr['id'])) {
        result['DwhId'] = cdr['id'];
      }
      if (input.lastName && cdr['lastName'] && input.lastName == cdr.lastName) {
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
      // NEW: номер счёта — input.account может содержать несколько номеров
      // (как cifId/DwhId), но в result попадают только те, что реально
      // принадлежат ЭТОМУ клиенту cdr, а не весь список введённых номеров
      // (иначе при поиске по нескольким номерам result['account'] у каждого
      // найденного клиента показывал бы все введённые номера подряд).
      const accountNumbers = input.account;
      if (accountNumbers?.length) {
        const matchedAccounts = accountNumbers.filter((num) =>
          cdr.accounts?.some((acc) => acc?.number === num),
        );
        if (matchedAccounts.length) {
          result['account'] = matchedAccounts.join(',');
        }
      }
      // NEW: номер карты — карты вложены внутрь каждого счёта; та же логика —
      // оставляем только номера, реально найденные у этого клиента.
      const cardNumbers = input.cardNumber;
      if (cardNumbers?.length) {
        const matchedCardNumbers = cardNumbers.filter((num) =>
          cdr.accounts?.some((acc) =>
            acc?.cards?.some((card) => card?.number === num),
          ),
        );
        if (matchedCardNumbers.length) {
          result['cardNumber'] = matchedCardNumbers.join(',');
        }
      }
    }

    return result as FiltredClientData;
  }

  // NEW: разворачивает один RequestData с несколькими значениями в списковых
  // полях (cifId/DwhId/account/cardNumber) в несколько отдельных RequestData
  // — по одному на каждый идентификатор. Нужно для matched-режима: при
  // ручном вводе вся форма всегда прилетает одним объектом (uploadField
  // оборачивает clientUploadField в [clientUploadField]), даже если в поле
  // вписано несколько номеров через запятую. Без разворачивания
  // findCdrForInput нашёл бы только первого подходящего клиента.
  // Для файловой загрузки не меняет поведение: там на каждую строку файла
  // и так уже приходится один RequestData с одним значением в списковых
  // полях — expandForMatched даёт на выходе ту же одну запись.
  private expandForMatched(cdi: RequestData[]): RequestData[] {
    const expanded: RequestData[] = [];

    for (const input of cdi) {
      let hasListCriterion = false;

      input.cifId?.forEach((cifId) => {
        expanded.push({ cifId: [cifId], actDate: input.actDate });
        hasListCriterion = true;
      });
      input.DwhId?.forEach((DwhId) => {
        expanded.push({ DwhId: [DwhId], actDate: input.actDate });
        hasListCriterion = true;
      });
      input.account?.forEach((account) => {
        expanded.push({ account: [account], actDate: input.actDate });
        hasListCriterion = true;
      });
      input.cardNumber?.forEach((cardNumber) => {
        expanded.push({ cardNumber: [cardNumber], actDate: input.actDate });
        hasListCriterion = true;
      });
      if (
        input.lastName &&
        input.firstName &&
        input.middleName &&
        input.birthDate
      ) {
        expanded.push({
          lastName: input.lastName,
          firstName: input.firstName,
          middleName: input.middleName,
          birthDate: input.birthDate,
          actDate: input.actDate,
        });
        hasListCriterion = true;
      }
      if (input.serial && input.number) {
        expanded.push({
          serial: input.serial,
          number: input.number,
          actDate: input.actDate,
        });
        hasListCriterion = true;
      }

      // ничего из списковых/идентифицирующих полей не заполнено — оставляем
      // запись как есть, чтобы не потерять её молча
      if (!hasListCriterion) {
        expanded.push(input);
      }
    }

    return expanded;
  }

  // CHANGED: раньше называлось findCdrForInput и возвращало через .find()
  // только ПЕРВОГО подошедшего клиента. Один введённый идентификатор
  // (например, один номер карты) может совпасть сразу с несколькими
  // клиентами — matched-режим должен показать всех, поэтому теперь .filter()
  // и массив на выходе. (используется только в mode='matched')
  private findAllCdrForMatch(
    input: RequestData,
    clientDataRes: ClientDataResponse[],
  ): ClientDataResponse[] {
    if (input.cifId?.length) {
      const cifId = input.cifId[0];
      return clientDataRes.filter((cdr) => cdr['mdmId'] === cifId);
    }
    if (input.DwhId?.length) {
      const dwhId = input.DwhId[0];
      return clientDataRes.filter((cdr) => cdr['id'] === dwhId);
    }
    if (
      input.lastName &&
      input.firstName &&
      input.middleName &&
      input.birthDate
    ) {
      return clientDataRes.filter(
        (cdr) =>
          cdr.lastName === input.lastName &&
          cdr.firstName === input.firstName &&
          cdr.middleName === input.middleName &&
          cdr.birthDate === input.birthDate,
      );
    }
    if (input.serial && input.number) {
      return clientDataRes.filter(
        (cdr) =>
          cdr?.mainDocument?.serial &&
          cdr?.mainDocument?.number &&
          input.serial === Number(cdr.mainDocument.serial) &&
          input.number === Number(cdr.mainDocument.number),
      );
    }
    const accountNumbers = input.account;
    if (accountNumbers?.length) {
      return clientDataRes.filter((cdr) =>
        cdr.accounts?.some(
          (acc) => acc?.number != null && accountNumbers.includes(acc.number),
        ),
      );
    }
    const cardNumbers = input.cardNumber;
    if (cardNumbers?.length) {
      return clientDataRes.filter((cdr) =>
        cdr.accounts?.some((acc) =>
          acc?.cards?.some(
            (card) => card?.number != null && cardNumbers.includes(card.number),
          ),
        ),
      );
    }
    return [];
  }
}
