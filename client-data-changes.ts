
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

  async generateReq(rows: Record<string, unknown>[]) {
    try {
      return this.parseJsonToXLSX(rows);
    } catch (error) {
      throw new BadRequestException(`Ошибка преобразования ${error.message}`);
    }
  }

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

  private buildMatchedRows(obj: FiltredClientData) {
    const result: any[] = [];
    const length = obj.accounts?.length || 1;

    for (let i = 0; i < length; i++) {
      result.push({
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


    return this.fileService.flattenClientData(filtered, mode);
  }

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

        if (
          input.accountNumber &&
          cdr.accounts?.some((acc) => acc?.number === input.accountNumber)
        ) {
          result['accountNumber'] = input.accountNumber;
        }

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

