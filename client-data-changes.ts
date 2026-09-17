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
