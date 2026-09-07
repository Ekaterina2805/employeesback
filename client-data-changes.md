# Доработка микросервиса client-data-ts

Задача: принимать на вход список идентификаторов (номера карт/счетов и т.п.),
выдавать либо уникальный список, либо список, соответствующий входному (с дублями,
первая колонка — входные данные), плюс возможность просмотреть результат в
интерфейсе вместо/помимо отправки XLSX на почту.

## Идея решения

- Backend перестаёт сразу превращать результат в XLSX-buffer и отдавать его как
  тело ответа. `generateClientRequest` всегда возвращает **JSON-массив**
  (для таблицы на фронте), а XLSX генерируется отдельным шагом только если
  передан email.
- Добавляется параметр `mode: 'unique' | 'matched'`:
  - `unique` — как сейчас, одна строка на каждого найденного во внешнем сервисе клиента.
  - `matched` — одна строка **на каждый входной идентификатор**, в исходном
    порядке, с дублями; первая колонка — сам входной идентификатор.
- Frontend: радио-переключатель режима + две кнопки «Показать результат» /
  «Отправить на почту», и таблица с результатом под формой.

---

## 1. `server/src/api/dto/...` (файл с `UploadFileDto` / `UploadFieldDto`)

Добавить поле в оба класса:

```ts
mode?: 'unique' | 'matched';
```

## 2. Тип `FiltredClientData` (`server/src/api/types`)

```ts
export type FiltredClientData = {
  input?: string; // NEW
  // ...остальные поля без изменений
};
```

## 3. `server/src/api/api.service.ts`

Было:

```ts
async generateClientRequest(
  cdi: RequestData[],
  additionalFields: SelectedFields,
) {
  const clientDataRes = await this.clientDataService.fetchClientFL(cdi);
  if (!clientDataRes) {
    throw new BadRequestException('Данные не были найдены');
  }

  const addFields = clientDataRes.map((cdr) =>
    this.getFieldsFromCDIRes(cdr, additionalFields, cdi),
  );
  const result = this.fileService.generateReq(addFields);
  return result;
}
```

Стало:

```ts
async generateClientRequest(
  cdi: RequestData[],
  additionalFields: SelectedFields,
  mode: 'unique' | 'matched' = 'unique', // NEW
): Promise<FiltredClientData[]> {
  const clientDataRes = await this.clientDataService.fetchClientFL(cdi);
  if (!clientDataRes) {
    throw new BadRequestException('Данные не были найдены');
  }

  if (mode === 'matched') { // NEW блок целиком
    return cdi.map((input) => {
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
  }

  return clientDataRes.map((cdr) =>
    this.getFieldsFromCDIRes(cdr, additionalFields, cdi),
  );
  // CHANGED: раньше здесь сразу вызывался this.fileService.generateReq(addFields) —
  // теперь генерация xlsx вынесена в отдельный метод buildXlsx
}

// NEW
async buildXlsx(data: FiltredClientData[]) {
  return this.fileService.generateReq(data);
}

// NEW
private findCdrForInput(
  input: RequestData,
  clientDataRes: ClientDataResponse[],
): ClientDataResponse | undefined {
  if (input.cifId?.length) {
    return clientDataRes.find((cdr) => cdr['mdmId'] === input.cifId[0]);
  }
  if (input.DwhId?.length) {
    return clientDataRes.find((cdr) => cdr['id'] === input.DwhId[0]);
  }
  if (input.lastName && input.firstName && input.middleName && input.birthDate) {
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
  return undefined;
}

// NEW
private formatInputLabel(input: RequestData): string {
  return (
    input.cifId?.join(',') ||
    input.DwhId?.join(',') ||
    [input.lastName, input.firstName, input.middleName].filter(Boolean).join(' ') ||
    [input.serial, input.number].filter(Boolean).join('/') ||
    ''
  );
}
```

`getFieldsFromCDIRes` не трогаем — используется как есть.

## 4. `server/src/api/api.controller.ts`

Метод `uploadFile` (строки 21–45) — было:

```ts
if (email) {
  console.log(email);
}
const cdi = await this.apiService.parseFile(file);
const result = await this.apiService.generateClientRequest(
  cdi,
  body.additionalFields.split(','),
);
if (email && email != '') {
  await sendToEmail(result, email);
}
return result;
```

Стало:

```ts
const cdi = await this.apiService.parseFile(file);
const result = await this.apiService.generateClientRequest(
  cdi,
  body.additionalFields.split(','),
  body.mode, // NEW
);
if (email && email != '') {
  const xlsx = await this.apiService.buildXlsx(result); // NEW
  await sendToEmail(xlsx, email); // CHANGED: было sendToEmail(result, email)
}
return result; // теперь JSON, а не xlsx-буфер
```

Метод `uploadindFile` (строки 47–60) — было:

```ts
const result = await this.apiService.generateClientRequest(
  [body.clientUploadField],
  body.additionalFields,
);
if (email && email != '') {
  await sendToEmail(result, email);
}
return result;
```

Стало:

```ts
const result = await this.apiService.generateClientRequest(
  [body.clientUploadField],
  body.additionalFields,
  body.mode, // NEW
);
if (email && email != '') {
  const xlsx = await this.apiService.buildXlsx(result); // NEW
  await sendToEmail(xlsx, email); // CHANGED
}
return result;
```

## 5. `server/src/services/file/file.service.ts`

В `FiltredClientDataToRowItemMapper` (строка 67, начало `result.push({`)
добавить первым ключом:

```ts
result.push({
  "input": obj.input, // NEW — первая колонка в режиме matched, undefined в unique (отфильтруется ниже)
  "cifId": obj.cifId,
  "DwhId": obj.DwhId,
  // ...остальное без изменений
```

Больше ничего в файле менять не нужно — фильтр `if(tmp[key] != undefined)`
(строка 129) сам уберёт `input`, когда его нет.

---

## 6. Клиент `client/src/App.jsx`

### Состояние

Добавить рядом с остальными `useState` в начале компонента
(перед `handleCheckboxChange`, строка 110):

```jsx
const [outputMode, setOutputMode] = useState('unique') // NEW
const [resultData, setResultData] = useState(null)      // NEW
```

### `handleFileSubmit` (строки 183–201) — заменить целиком

```jsx
const handleFileSubmit = async (fileFormDataToSend, includeEmail) => { // CHANGED: +includeEmail
  console.log("Отправка файла")
  const apiURL = import.meta.env.VITE_API_URL
  let query = '';
  if (includeEmail && email && email != '') { // CHANGED
    query = `?email=${email}`
  }
  const response = await fetch(`/api/uploadFile${query}`, {
    method: 'POST',
    body: fileFormDataToSend,
  });
  console.log(fileFormDataToSend)
  console.log(response.statusText, response.status)
  if (!response.ok) {
    throw new Error(`Ошибка загрузки данных  ${response.status}`)
  }

  return await response.json() // CHANGED: было return response
}
```

### `handleManualSubmit` (строки 207–245) — заменить целиком

```jsx
const handleManualSubmit = async (data, includeEmail) => { // CHANGED: +includeEmail
  console.log("Отправка входных данных ")
  //todo get env
  const apiURL = import.meta.env.VITE_API_URL

  const fieldsUpload = {
    clientUploadField: {
      cifId: data.cifId.length > 0 ?  data.cifId.map(Number) : [],
      DwhId: data.DwhId.length > 0 ? data.DwhId.map(Number) : [],
      lastName: data.lastName || null,
      firstName: data.firstName || null,
      middleName: data.middleName || null,
      birthDate: data.birthDate || null,
      serial: data.serial || null,
      number: data.number || null,
      actDate: data.actDate|| null,
    },
    additionalFields: getAdditionalFields(checkboxes),
    mode: outputMode, // NEW
  }
  console.log('JSON', fieldsUpload)

  let query = '';
  if (includeEmail && email && email != '') { // CHANGED
    query = `?email=${email}`
  }

  const response = await fetch(`/api/uploadField${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fieldsUpload),
  });
  if (!response.ok) {
    console.log(response.statusText, response.status)
    throw new Error(`Ошибка загрузки данных  ${response.status}`)
  }

  return await response.json() // CHANGED: было return response
}
```

### `handleSubmit` (строки 247–312) — заменить целиком

```jsx
const handleSubmit = async (even, action) => { // CHANGED: +action ('view' | 'email')
  even.preventDefault()

  if (action === 'email' && (!email || email === '')) { // NEW
    alert('Введите email получателя')
    return
  }

  setIsLoading(true)

  try {
    let data // CHANGED: раньше response (объект Response)

    if (inputMode === 'file') {
      const formDataToSend = new FormData()
      formDataToSend.append('clientUploadFile', formData.file)
      formDataToSend.append('additionalFields', Object.keys(checkboxes).filter(key => checkboxes[key]))
      formDataToSend.append('mode', outputMode) // NEW

      data = await handleFileSubmit(formDataToSend, action === 'email')
    } else if (inputMode === 'manual') {
      data = await handleManualSubmit(formData, action === 'email')
    }

    setResultData(data) // NEW — таблица показывается всегда при успехе

    if (action === 'email') {
      alert('Данные успешно отправлены на почту. Проверьте почту')
    }

    setFormData({
      cifId: [], DwhId: [], lastName: '', firstName: '', middleName: '',
      birthDate: '', serial: '', number: '', actDate: '', file: null
    })
    //setEmail('')

    setCheckboxes({
      lastName: false, firstName: false, middleName: false, fullName: false,
      birthDate: false, mainDocument: false, inn: false, serviceStartDate: false,
      registrationAddress: false, stayPlaceAddress: false, postalAddress: false,
      internationPasport: false, accounts: false, startDate: false, endDate: false,
      acceptanceDate: false, periodDate: false,
    })

    if (fileInputRef.current){
      fileInputRef.current.value = ''
    }
  } catch (error) {
    console.error("Ошибка:", error)
    //alert("Ошибка соединения с сервером")
  } finally {
    setIsLoading(false)
  }
}
```

### JSX, строка 339

Было:
```jsx
<form onSubmit={handleSubmit} className='form'>
```
Стало:
```jsx
<form onSubmit={(e) => handleSubmit(e, 'view')} className='form'>
```

### JSX — новый блок режима вывода

Вставить после закрывающего `</div>` строки 371 (конец блока
"Выберите способ ввода входных данных"), перед строкой 372
`{/*Загрузка файла */}`:

```jsx
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
```

### JSX, строки 559–578 — заменить блок с кнопкой отправки

Было:
```jsx
{/*Кнопка загрузки*/}
{/* <button
  onClick={handleDownload}> Выгрузить файл
</button> */}

{/*Кнопка отправки */}
<button
  type='submit'
  className='submit-btn'
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <span className='spinner'></span>
      Отправка
    </>
  ) : 'Отправить'}
</button>
```

Стало:
```jsx
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
```

### JSX — таблица результата

Вставить сразу после `</form>` (строка 579), перед закрывающим `</div>`
строки 580:

```jsx
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
```

### Объект `titles`

Добавить ключ (объявление `titles` не показано в скринах — найти через
поиск `const titles =`):

```jsx
input: 'Входной идентификатор',
```

### CSS (`App.css`)

```css
.table-wrapper { overflow-x: auto; margin-top: 12px; }
.result-table { border-collapse: collapse; width: 100%; }
.result-table th, .result-table td { border: 1px solid #444; padding: 6px 10px; font-size: 13px; text-align: left; white-space: nowrap; }
.action-buttons { display: flex; gap: 12px; }
```

---

## 7. Поиск по номеру счёта и номеру карты (accounts.number, cards.number)

Задача: принимать на вход также номер счёта и номер карты, сопоставлять их с
`accounts.number` и вложенным `accounts[].cards[].number` в `ClientDataResponse`
(в этом DTO `cards` вложены **внутрь** каждого `accounts[]`, а не отдельным
полем верхнего уровня).

⚠️ **Важная оговорка**: неизвестен точный формат `Input`, который ожидает
внешний сервис `clientdata-fl-aml` для поиска по счёту/карте — в
`client-data-request.dto.ts` сейчас определены только 4 варианта (`mdmId`,
`id`, ФИО+дата рождения, `serial+number`). Ниже добавлены два новых варианта
по аналогии с `serial+number`, но если внешний API ожидает другие имена
полей — поиск не сработает, это нужно проверить на реальном запросе и
поправить по факту.

### `server/src/services/client-data/dto/client-data-request.dto.ts` (строки 9–33)

Добавить в union `Input` два новых варианта (после блока с `serial`/`number`):

```ts
| {
    // Номер счёта
    accountNumber: string;
    stateDate?: string; // format "YYYY-MM-DD"
  }
| {
    // Номер карты
    cardNumber: string;
    stateDate?: string; // format "YYYY-MM-DD"
  };
```

### `server/src/services/client-data/client-data.service.ts`

`generatedInput` (строки 11–56) — добавить перед `return input;` (строка 55):

```ts
if (clientInput.accountNumber) {
  input.push({
    accountNumber: String(clientInput.accountNumber),
    stateDate,
  });
}
if (clientInput.cardNumber) {
  input.push({
    cardNumber: String(clientInput.cardNumber),
    stateDate,
  });
}
```

`generatePostData` (строка 70) — было:

```ts
const excludeSources = ['cards', 'factor', 'person'];
```

Стало:

```ts
const excludeSources = ['factor', 'person']; // CHANGED: убрали 'cards' — источник карт теперь нужен для поиска
```

### `server/src/api/types` — тип `RequestData`

Добавить два поля:

```ts
export type RequestData = {
  // ...существующие поля (cifId, DwhId, lastName, ...)
  accountNumber?: string; // NEW
  cardNumber?: string;    // NEW
};
```

### `server/src/api/api.service.ts`

`parseFile` — добавить после блока `if (row.number) { item.number = ... }`:

```ts
if (row.accountNumber) {
  item.accountNumber = String(row.accountNumber);
}
if (row.cardNumber) {
  item.cardNumber = String(row.cardNumber);
}
```

`getFieldsFromCDIRes`, внутри `for (const input of cdi)` — добавить после
блока с `actDate`:

```ts
if (
  input.accountNumber &&
  cdr.accounts?.some((acc) => acc.number === input.accountNumber)
) {
  result['accountNumber'] = input.accountNumber;
}
if (
  input.cardNumber &&
  cdr.accounts?.some((acc) =>
    acc.cards?.some((card) => card.number === input.cardNumber),
  )
) {
  result['cardNumber'] = input.cardNumber;
}
```

`findCdrForInput` (добавлен в разделе 3, для режима `matched`) — добавить
перед `return undefined;`:

```ts
if (input.accountNumber) {
  return clientDataRes.find((cdr) =>
    cdr.accounts?.some((acc) => acc.number === input.accountNumber),
  );
}
if (input.cardNumber) {
  return clientDataRes.find((cdr) =>
    cdr.accounts?.some((acc) =>
      acc.cards?.some((card) => card.number === input.cardNumber),
    ),
  );
}
```

`formatInputLabel` — добавить в цепочку `||`:

```ts
private formatInputLabel(input: RequestData): string {
  return (
    input.cifId?.join(',') ||
    input.DwhId?.join(',') ||
    input.accountNumber || // NEW
    input.cardNumber ||    // NEW
    [input.lastName, input.firstName, input.middleName].filter(Boolean).join(' ') ||
    [input.serial, input.number].filter(Boolean).join('/') ||
    ''
  );
}
```

### Клиент `App.jsx`

В `formData` (там же, где `cifId`, `DwhId`, ...) добавить:

```jsx
accountNumber: '',
cardNumber: '',
```

— и в обоих местах `setFormData({...})` (сброс формы в `handleSubmit`) тоже
добавить эти два поля с пустой строкой.

В JSX ручного ввода — рядом с полями `cifId`/`DwhId` добавить два аналогичных
`<input>`:

```jsx
<input
  type="text"
  name="accountNumber"
  placeholder="Номер счёта"
  value={formData.accountNumber}
  onChange={handleInputChange}
  disabled={isLoading}
/>
<input
  type="text"
  name="cardNumber"
  placeholder="Номер карты"
  value={formData.cardNumber}
  onChange={handleInputChange}
  disabled={isLoading}
/>
```

Проверить `handleInputChange` — если там сейчас есть спец-обработка только
для `cifId`/`DwhId` через `.split(',')`, для `accountNumber`/`cardNumber`
нужна обычная ветка `else`, как для `lastName` и т.п.

---

## Файлы, которые трогать не нужно

- `main.jsx`
- `app.controller.ts` / `app.module.ts` (health-check, не связан с задачей)
- `client-data.module.ts`
- `configuration.ts`
- `services/file/file.controller.ts` и `file.module.ts` — контроллер не
  зарегистрирован в модуле (нет `controllers: [...]` в `file.module.ts`),
  это мёртвый код с дублирующимися путями `uploadFile`/`uploadField`,
  конфликтующими с `api.controller.ts`, если его когда-нибудь подключат.

Примечание: `client-data.service.ts` теперь **тоже меняется** (см. раздел 7)
— из списка "не трогать" он исключён.
