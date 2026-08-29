const { contextBridge } = require('electron');

// Bridge for future native POS integrations (receipt printer, cash drawer, barcode scanner).
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
});
