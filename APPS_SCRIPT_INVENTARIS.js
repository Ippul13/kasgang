// KODE UNTUK GOOGLE APPS SCRIPT - INVENTARIS
// Salin dan tempel ke Google Apps Script editor untuk sheet Inventaris

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = data[0];
  const result = [];
  
  // Loop mulai dari baris ke-2 (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: result
  })).setMimeType(ContentService.MimeType.JSON);
}

// Untuk testing di script editor
function test() {
  Logger.log(doGet());
}
