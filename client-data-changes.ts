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
