import { useState, useRef } from 'react'

// ПРИМЕЧАНИЕ: точный объект titles из оригинала не был виден на скриншотах —
// восстановлен по ключам, которые реально используются в чекбоксах и в
// колонках отчёта (api.service.ts / file.service.ts).
const titles = {
  cifId: 'CIF ID',
  DwhId: 'DWH ID',
  lastName: 'Фамилия',
  firstName: 'Имя',
  middleName: 'Отчество',
  fullName: 'ФИО',
  birthDate: 'Дата рождения',
  serial: 'Серия документа',
  number: 'Номер документа',
  actDate: 'Дата актуальности',
  mainDocument: 'Основной документ',
  inn: 'ИНН',
  serviceStartDate: 'Дата начала обслуживания',
  registrationAddress: 'Адрес регистрации',
  stayPlaceAddress: 'Адрес фактического проживания',
  postalAddress: 'Почтовый адрес',
  internationPasport: 'Загранпаспорт',
  accounts: 'Счета',
  startDate: 'Дата начала',
  endDate: 'Дата окончания',
  acceptanceDate: 'Дата принятия на обслуживание',
  periodDate: 'Дата периода обслуживания',
  account: 'Номер счёта', // NEW
  cardNumber: 'Номер карты', // NEW
}

function App() {
  const [inputMode, setInputMode] = useState('manual')
  const [outputMode, setOutputMode] = useState('unique') // NEW
  const [resultData, setResultData] = useState(null) // NEW
  const [isLoading, setIsLoading] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '')

  const [formData, setFormData] = useState({
    cifId: [],
    DwhId: [],
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '',
    serial: '',
    number: '',
    actDate: '',
    account: '', // NEW
    cardNumber: '', // NEW
    file: null,
  })

  const [checkboxes, setCheckboxes] = useState({
    lastName: false,
    firstName: false,
    middleName: false,
    fullName: false,
    birthDate: false,
    mainDocument: false,
    inn: false,
    serviceStartDate: false,
    registrationAddress: false,
    stayPlaceAddress: false,
    postalAddress: false,
    internationPasport: false,
    accounts: false,
    startDate: false,
    endDate: false,
    acceptanceDate: false,
    periodDate: false,
  })

  const fileInputRef = useRef(null)

  const handleModeChange = (mode) => {
    setInputMode(mode)
    if (mode !== 'file') {
      setFormData(prev => ({ ...prev, file: null }))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    localStorage.setItem('email', value)
  }

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] || null }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'cifId' || name === 'DwhId') {
      setFormData(prev => ({
        ...prev,
        [name]: value
          .split(',')
          .map(v => v.trim())
          .filter(v => v !== ''),
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCheckboxChange = (key) => {
    setCheckboxes(prev => {
      const next = { ...prev, [key]: !prev[key] }
      setSelectAll(Object.values(next).every(Boolean))
      return next
    })
  }

  const handleSelectAllChange = () => {
    const next = !selectAll
    setSelectAll(next)
    setCheckboxes(prev => {
      const updated = {}
      Object.keys(prev).forEach(key => { updated[key] = next })
      return updated
    })
  }

  const downloadExample = async () => {
    try {
      const response = await fetch('/file/example.xlsx')
      if (!response.ok) {
        throw new Error(`Ошибка загрузки примера ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'example.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Ошибка:', error)
    }
  }

  const getAdditionalFields = (fields) => {
    return Object.keys(fields).filter(key => fields[key])
  }

  const handleFileSubmit = async (fileFormDataToSend, includeEmail) => {
    console.log("Отправка файла")
    const apiURL = import.meta.env.VITE_API_URL
    let query = '';
    if (includeEmail && email && email != '') {
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

    return await response.json()
  }

  const handleManualSubmit = async (data, includeEmail) => {
    console.log("Отправка входных данных ")
    const apiURL = import.meta.env.VITE_API_URL

    const fieldsUpload = {
      clientUploadField: {
        cifId: data.cifId.length > 0 ? data.cifId.map(Number) : [],
        DwhId: data.DwhId.length > 0 ? data.DwhId.map(Number) : [],
        lastName: data.lastName || null,
        firstName: data.firstName || null,
        middleName: data.middleName || null,
        birthDate: data.birthDate || null,
        serial: data.serial || null,
        number: data.number || null,
        actDate: data.actDate || null,
        account: data.account || null, // NEW
        cardNumber: data.cardNumber || null, // NEW
      },
      additionalFields: getAdditionalFields(checkboxes),
      mode: outputMode, // NEW
    }
    console.log('JSON', fieldsUpload)

    let query = '';
    if (includeEmail && email && email != '') {
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

    return await response.json()
  }

  const handleSubmit = async (even, action) => {
    even.preventDefault()

    if (action === 'email' && (!email || email === '')) {
      alert('Введите email получателя')
      return
    }

    setIsLoading(true)

    try {
      let data

      if (inputMode === 'file') {
        const formDataToSend = new FormData()
        formDataToSend.append('clientUploadFile', formData.file)
        formDataToSend.append('additionalFields', Object.keys(checkboxes).filter(key => checkboxes[key]))
        formDataToSend.append('mode', outputMode)

        data = await handleFileSubmit(formDataToSend, action === 'email')
      } else if (inputMode === 'manual') {
        data = await handleManualSubmit(formData, action === 'email')
      }

      setResultData(data)

      if (action === 'email') {
        alert('Данные успешно отправлены на почту. Проверьте почту')
      }

      setFormData({
        cifId: [], DwhId: [], lastName: '', firstName: '', middleName: '',
        birthDate: '', serial: '', number: '', actDate: '',
        account: '', cardNumber: '', file: null
      })

      setCheckboxes({
        lastName: false, firstName: false, middleName: false, fullName: false,
        birthDate: false, mainDocument: false, inn: false, serviceStartDate: false,
        registrationAddress: false, stayPlaceAddress: false, postalAddress: false,
        internationPasport: false, accounts: false, startDate: false, endDate: false,
        acceptanceDate: false, periodDate: false,
      })
      setSelectAll(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error("Ошибка:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
                type="text" name="account" placeholder="Номер счёта"
                value={formData.account}
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
