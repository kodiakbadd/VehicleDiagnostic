const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Connection & Basic Functions
  listPorts: () => ipcRenderer.invoke('list-ports'),
  connect: (port) => ipcRenderer.invoke('connect', port),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  selectVehicle: (vehicle) => ipcRenderer.invoke('select-vehicle', vehicle),
  selectECU: (ecu) => ipcRenderer.invoke('select-ecu', ecu),
  
  // Diagnostic Sessions
  startDiagnosticSession: () => ipcRenderer.invoke('start-diagnostic-session'),
  readECUInfo: () => ipcRenderer.invoke('read-ecu-info'),
  
  // Live Data & DTCs
  readLiveData: () => ipcRenderer.invoke('read-live-data'),
  readDTC: () => ipcRenderer.invoke('read-dtc'),
  clearDTC: () => ipcRenderer.invoke('clear-dtc'),
  readFreezeFrame: () => ipcRenderer.invoke('read-freeze-frame'),
  
  // Data Logging
  startLogging: () => ipcRenderer.invoke('start-logging'),
  stopLogging: () => ipcRenderer.invoke('stop-logging'),
  exportLogs: () => ipcRenderer.invoke('export-logs'),
  onLogUpdate: (callback) => ipcRenderer.on('log-update', (event, data) => callback(data)),
  
  // Safe Mode
  toggleSafeMode: (enabled) => ipcRenderer.invoke('toggle-safe-mode', enabled),
  getSafeMode: () => ipcRenderer.invoke('get-safe-mode'),
  
  // Security Access
  securityRequestSeed: (level) => ipcRenderer.invoke('security-request-seed', level),
  securitySendKey: (level, seed) => ipcRenderer.invoke('security-send-key', level, seed),
  
  // Parameter Database
  getModuleParameters: (module) => ipcRenderer.invoke('get-module-parameters', module),
  searchParameters: (searchTerm) => ipcRenderer.invoke('search-parameters', searchTerm),
  validateParameterValue: (module, parameterId, value) => 
    ipcRenderer.invoke('validate-parameter-value', module, parameterId, value),
  
  // Advanced Write Functions
  writeParameter: (id, value) => ipcRenderer.invoke('write-parameter', id, value),
  writeParameterAdvanced: (id, value, options) => 
    ipcRenderer.invoke('write-parameter-advanced', id, value, options),
  
  // Backup & Restore
  createBackup: (notes) => ipcRenderer.invoke('create-backup', notes),
  listBackups: (filters) => ipcRenderer.invoke('list-backups', filters),
  restoreBackup: (backupId, options) => ipcRenderer.invoke('restore-backup', backupId, options),
  deleteBackup: (backupId) => ipcRenderer.invoke('delete-backup', backupId),
  exportBackup: (backupId) => ipcRenderer.invoke('export-backup', backupId),
  importBackup: () => ipcRenderer.invoke('import-backup'),
  
  // Manufacturer-Specific Functions
  readAdaptation: (channelId) => ipcRenderer.invoke('read-adaptation', channelId),
  readAdaptationChannel: (channelNumber) => ipcRenderer.invoke('read-adaptation-channel', channelNumber),
  writeAdaptationChannel: (channelNumber, value, workshopCode) => 
    ipcRenderer.invoke('write-adaptation-channel', channelNumber, value, workshopCode),
  readCoding: () => ipcRenderer.invoke('read-coding'),
  writeCoding: (codingData, workshopCode) => ipcRenderer.invoke('write-coding', codingData, workshopCode),
  componentTest: (componentId, testType) => ipcRenderer.invoke('component-test', componentId, testType),
  
  // Memory Operations
  readMemory: (address, size) => ipcRenderer.invoke('read-memory', address, size),
  writeMemory: (address, data) => ipcRenderer.invoke('write-memory', address, data),
  
  // VIN Functions
  readVIN: () => ipcRenderer.invoke('read-vin')
});