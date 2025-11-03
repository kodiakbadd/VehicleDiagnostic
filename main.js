const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');

// Import new modules
const SecurityAccess = require('./security');
const ParameterDatabase = require('./parameterDatabase');
const BackupRestore = require('./backupRestore');
const ISOTP = require('./isotp');
const UDS = require('./uds');
const { ManufacturerProtocols } = require('./manufacturerProtocols');

let mainWindow;
let port;
let parser;
let isLogging = false;
let logInterval;
let currentVehicle = 'VW Tiguan';
let connectedECUs = [];
let currentECU = null;
let diagnosticSession = false;
let safeMode = true; // Start in safe mode by default
let currentVIN = null;

// Initialize new systems
const security = new SecurityAccess();
const paramDB = new ParameterDatabase();
const backupRestore = new BackupRestore(app.getPath('userData'));
const isotp = new ISOTP();
const uds = new UDS();
const mfgProtocols = new ManufacturerProtocols();

// Enhanced OBD-II command sets
const obdCommands = {
  standard: {
    rpm: '010C',
    speed: '010D',
    coolantTemp: '0105',
    throttle: '0111',
    fuelLevel: '012F',
    engineLoad: '0104',
    maf: '0110',
    intakeTemp: '010F',
    timingAdvance: '010E',
    fuelPressure: '010A',
    dtc: '03'
  },
  
  enhanced: {
    ecuInfo: '0902',
    vinNumber: '0902',
    ecuName: '090A',
    calibrationID: '0904',
    cvn: '0906'
  },
  
  diagnostic: {
    startSession: '1003',
    extendedSession: '1001',
    programmingSession: '1002',
    securityAccess: '27',
    readDataByID: '22',
    writeDataByID: '2E',
    readMemory: '23',
    writeMemory: '3D',
    controlModule: '31',
    clearDTC: '04',
    freezeFrame: '02'
  },
  
  vwSpecific: {
    readAdaptation: '2101',
    writeAdaptation: '2E01',
    readCoding: '2102',
    writeCoding: '2E02',
    resetAdaptation: '3101',
    componentTest: '3102'
  },
  
  nissanSpecific: {
    readECUData: '2101',
    writeECUData: '3B01',
    selfDiagnostic: '3102',
    readWorkSupport: '2103'
  }
};

const ecuAddresses = {
  engine: '7E0',
  transmission: '7E1',
  abs: '7E2',
  airbag: '7E3',
  instrument: '7E4',
  gateway: '7DF'
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (port && port.isOpen) {
    port.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('list-ports', async () => {
  const ports = await SerialPort.list();
  return ports.map(p => ({ path: p.path, manufacturer: p.manufacturer || 'Unknown' }));
});

ipcMain.handle('connect', async (event, portPath) => {
  try {
    port = new SerialPort({ path: portPath, baudRate: 38400 });
    parser = port.pipe(new ReadlineParser({ delimiter: '\r' }));
    
    await new Promise((resolve, reject) => {
      port.on('open', resolve);
      port.on('error', reject);
    });
    
    await sendCommand('ATZ');
    await sendCommand('ATE0');
    await sendCommand('ATL0');
    await sendCommand('ATSP0');
    
    connectedECUs = await detectECUs();
    
    return { success: true, ecus: connectedECUs };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('disconnect', async () => {
  if (isLogging) {
    clearInterval(logInterval);
    isLogging = false;
  }
  if (diagnosticSession) {
    await sendCommand('1001');
    diagnosticSession = false;
  }
  if (port && port.isOpen) {
    port.close();
  }
  connectedECUs = [];
  return { success: true };
});

ipcMain.handle('select-vehicle', async (event, vehicle) => {
  currentVehicle = vehicle;
  return { success: true };
});

ipcMain.handle('select-ecu', async (event, ecu) => {
  currentECU = ecu;
  return { success: true };
});

ipcMain.handle('start-diagnostic-session', async () => {
  try {
    const response = await sendCommand(obdCommands.diagnostic.extendedSession);
    diagnosticSession = true;
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-ecu-info', async () => {
  try {
    const vin = await sendCommand(obdCommands.enhanced.vinNumber);
    const ecuName = await sendCommand(obdCommands.enhanced.ecuName);
    const calibration = await sendCommand(obdCommands.enhanced.calibrationID);
    
    return { 
      success: true, 
      data: { vin, ecuName, calibration } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-live-data', async () => {
  try {
    const rpm = await sendCommand(obdCommands.standard.rpm);
    const speed = await sendCommand(obdCommands.standard.speed);
    const coolant = await sendCommand(obdCommands.standard.coolantTemp);
    const throttle = await sendCommand(obdCommands.standard.throttle);
    const engineLoad = await sendCommand(obdCommands.standard.engineLoad);
    const fuelLevel = await sendCommand(obdCommands.standard.fuelLevel);
    
    return {
      success: true,
      data: {
        rpm: parseRPM(rpm),
        speed: parseSpeed(speed),
        coolant: parseCoolant(coolant),
        throttle: parseThrottle(throttle),
        engineLoad: parseEngineLoad(engineLoad),
        fuelLevel: parseFuelLevel(fuelLevel)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-dtc', async () => {
  try {
    const response = await sendCommand(obdCommands.standard.dtc);
    const dtcCodes = parseDTC(response);
    return { success: true, codes: dtcCodes };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-dtc', async () => {
  try {
    await sendCommand(obdCommands.diagnostic.clearDTC);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-freeze-frame', async () => {
  try {
    const response = await sendCommand(obdCommands.diagnostic.freezeFrame);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-parameter', async (event, parameterId, value) => {
  try {
    if (!diagnosticSession) {
      throw new Error('Diagnostic session not active');
    }
    
    const command = `${obdCommands.diagnostic.writeDataByID}${parameterId}${value}`;
    const response = await sendCommand(command);
    
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-adaptation', async (event, channelId) => {
  try {
    const commands = currentVehicle === 'VW Tiguan' 
      ? obdCommands.vwSpecific 
      : obdCommands.nissanSpecific;
    
    const response = await sendCommand(`${commands.readAdaptation}${channelId}`);
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-logging', async () => {
  if (isLogging) return { success: false, error: 'Already logging' };
  
  isLogging = true;
  const logFile = path.join(app.getPath('userData'), 'vehicle_logs.txt');
  
  logInterval = setInterval(async () => {
    try {
      const liveDataResult = await ipcMain.emit('read-live-data-internal');
      const location = await getGPSLocation();
      const timestamp = new Date().toISOString();
      
      const logEntry = {
        timestamp,
        vehicle: currentVehicle,
        ecu: currentECU,
        data: liveDataResult,
        location
      };
      
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
      mainWindow.webContents.send('log-update', logEntry);
    } catch (error) {
      console.error('Logging error:', error);
    }
  }, 5000);
  
  return { success: true };
});

ipcMain.handle('stop-logging', async () => {
  if (logInterval) {
    clearInterval(logInterval);
    isLogging = false;
  }
  return { success: true };
});

ipcMain.handle('export-logs', async () => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: `vehicle_logs_${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  
  if (filePath) {
    const logFile = path.join(app.getPath('userData'), 'vehicle_logs.txt');
    fs.copyFileSync(logFile, filePath);
    return { success: true };
  }
  return { success: false };
});

// ===== NEW ADVANCED FEATURES =====

// Safe Mode Management
ipcMain.handle('toggle-safe-mode', async (event, enabled) => {
  safeMode = enabled;
  return { success: true, safeMode };
});

ipcMain.handle('get-safe-mode', async () => {
  return { safeMode };
});

// Security Access
ipcMain.handle('security-request-seed', async (event, level) => {
  try {
    const seedCommand = uds.securityAccessRequestSeed(level);
    const response = await sendCommand(seedCommand);
    const parsed = uds.parseResponse(response);
    
    if (parsed.success) {
      return { success: true, seed: parsed.data };
    }
    return { success: false, error: parsed.nrcDescription };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('security-send-key', async (event, level, seed) => {
  try {
    const manufacturer = currentVehicle.includes('VW') ? 'vw' : 'nissan';
    const key = security.calculateKey(seed, manufacturer, level);
    const keyCommand = uds.securityAccessSendKey(level, key);
    const response = await sendCommand(keyCommand);
    const parsed = uds.parseResponse(response);
    
    security.recordAttempt(parsed.success);
    
    if (parsed.success) {
      uds.securityLevel = level;
      return { success: true, level };
    }
    return { success: false, error: parsed.nrcDescription };
  } catch (error) {
    security.recordAttempt(false);
    return { success: false, error: error.message };
  }
});

// Parameter Database
ipcMain.handle('get-module-parameters', async (event, module) => {
  const manufacturer = currentVehicle.includes('VW') ? 'vw' : 'nissan';
  const params = paramDB.getModuleParameters(manufacturer, module);
  return { success: true, parameters: params };
});

ipcMain.handle('search-parameters', async (event, searchTerm) => {
  const manufacturer = currentVehicle.includes('VW') ? 'vw' : 'nissan';
  const results = paramDB.searchParameters(manufacturer, searchTerm);
  return { success: true, results };
});

ipcMain.handle('validate-parameter-value', async (event, module, parameterId, value) => {
  const manufacturer = currentVehicle.includes('VW') ? 'vw' : 'nissan';
  const validation = paramDB.validateValue(manufacturer, module, parameterId, value);
  return validation;
});

// Advanced Write with Validation and Backup
ipcMain.handle('write-parameter-advanced', async (event, parameterId, value, options = {}) => {
  try {
    if (safeMode && !options.confirmOverride) {
      return { success: false, error: 'Safe mode is enabled. Disable to write parameters.' };
    }

    // Validate parameter
    const module = currentECU || 'engine';
    const manufacturer = currentVehicle.includes('VW') ? 'vw' : 'nissan';
    const validation = paramDB.validateValue(manufacturer, module, parameterId, value);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check security requirements
    if (validation.param && validation.param.requiresSecurity && uds.securityLevel === 0) {
      return { success: false, error: 'Security access required for this parameter' };
    }

    // Create backup before writing
    if (!options.skipBackup) {
      const currentState = await readCurrentECUState();
      await backupRestore.createPreModificationBackup(currentState, `write-param-${parameterId}`);
    }

    // Write parameter using UDS
    const writeCommand = uds.writeDataByIdentifier(parameterId, value);
    const response = await sendCommand(writeCommand);
    const parsed = uds.parseResponse(response);

    if (!parsed.success) {
      return { success: false, error: parsed.nrcDescription };
    }

    // Verify write
    if (!options.skipVerification) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const readCommand = uds.readDataByIdentifier(parameterId);
      const readResponse = await sendCommand(readCommand);
      const readParsed = uds.parseResponse(readResponse);
      
      if (readParsed.success && readParsed.data !== value) {
        return { success: false, error: 'Write verification failed - value mismatch' };
      }
    }

    return { success: true, verified: !options.skipVerification };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Backup Management
ipcMain.handle('create-backup', async (event, notes = '') => {
  try {
    const currentState = await readCurrentECUState();
    currentState.notes = notes;
    const result = await backupRestore.createBackup(currentState);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-backups', async (event, filters = {}) => {
  const backups = backupRestore.listBackups(filters);
  return { success: true, backups };
});

ipcMain.handle('restore-backup', async (event, backupId, options = {}) => {
  try {
    options.currentVIN = currentVIN;
    const result = await backupRestore.restoreBackup(backupId, options);
    
    if (!result.success) {
      return result;
    }

    // Apply the restore
    const restoreData = result.restoreData;
    
    for (const [paramId, value] of Object.entries(restoreData.parameters)) {
      const writeCommand = uds.writeDataByIdentifier(paramId, value);
      await sendCommand(writeCommand);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-backup', async (event, backupId) => {
  return backupRestore.deleteBackup(backupId);
});

ipcMain.handle('export-backup', async (event, backupId) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: `ecu_backup_${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  
  if (filePath) {
    return backupRestore.exportBackup(backupId, filePath);
  }
  return { success: false };
});

ipcMain.handle('import-backup', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  
  if (filePaths && filePaths.length > 0) {
    return backupRestore.importBackup(filePaths[0]);
  }
  return { success: false };
});

// Manufacturer-Specific Functions
ipcMain.handle('read-adaptation-channel', async (event, channelNumber) => {
  try {
    const protocol = mfgProtocols.getProtocol(currentVehicle);
    if (!protocol) {
      return { success: false, error: 'Protocol not supported for this vehicle' };
    }

    const command = protocol.readAdaptation(channelNumber);
    const response = await sendCommand(command);
    
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-adaptation-channel', async (event, channelNumber, value, workshopCode) => {
  try {
    if (safeMode) {
      return { success: false, error: 'Safe mode is enabled' };
    }

    const protocol = mfgProtocols.getProtocol(currentVehicle);
    if (!protocol) {
      return { success: false, error: 'Protocol not supported for this vehicle' };
    }

    // Create backup
    const currentState = await readCurrentECUState();
    await backupRestore.createPreModificationBackup(currentState, `adapt-${channelNumber}`);

    const command = protocol.writeAdaptation(channelNumber, value, workshopCode);
    const response = await sendCommand(command);
    
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-coding', async () => {
  try {
    const protocol = mfgProtocols.getProtocol(currentVehicle);
    if (!protocol) {
      return { success: false, error: 'Protocol not supported for this vehicle' };
    }

    const command = protocol.readCoding();
    const response = await sendCommand(command);
    
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-coding', async (event, codingData, workshopCode) => {
  try {
    if (safeMode) {
      return { success: false, error: 'Safe mode is enabled' };
    }

    const protocol = mfgProtocols.getProtocol(currentVehicle);
    if (!protocol) {
      return { success: false, error: 'Protocol not supported for this vehicle' };
    }

    // Create backup
    const currentState = await readCurrentECUState();
    await backupRestore.createPreModificationBackup(currentState, 'write-coding');

    const command = protocol.writeCoding(codingData, workshopCode);
    const response = await sendCommand(command);
    
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('component-test', async (event, componentId, testType) => {
  try {
    const protocol = mfgProtocols.getProtocol(currentVehicle);
    if (!protocol) {
      return { success: false, error: 'Protocol not supported for this vehicle' };
    }

    const command = protocol.componentTest(componentId, testType);
    const response = await sendCommand(command);
    
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Memory Operations
ipcMain.handle('read-memory', async (event, address, size) => {
  try {
    const command = uds.readMemoryByAddress(address, size);
    const response = await sendCommand(command);
    const parsed = uds.parseResponse(response);
    
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }
    return { success: false, error: parsed.nrcDescription };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-memory', async (event, address, data) => {
  try {
    if (safeMode) {
      return { success: false, error: 'Safe mode is enabled - memory writing is dangerous' };
    }

    // Create backup
    const currentState = await readCurrentECUState();
    await backupRestore.createPreModificationBackup(currentState, `write-mem-${address.toString(16)}`);

    const command = uds.writeMemoryByAddress(address, data);
    const response = await sendCommand(command);
    const parsed = uds.parseResponse(response);
    
    if (parsed.success) {
      return { success: true };
    }
    return { success: false, error: parsed.nrcDescription };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// VIN Management
ipcMain.handle('read-vin', async () => {
  try {
    const command = uds.readDataByIdentifier('F190'); // Standard VIN DID
    const response = await sendCommand(command);
    const parsed = uds.parseResponse(response);
    
    if (parsed.success) {
      currentVIN = hexToASCII(parsed.data);
      return { success: true, vin: currentVIN };
    }
    return { success: false, error: parsed.nrcDescription };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Helper function to read current ECU state
async function readCurrentECUState() {
  const state = {
    vehicle: currentVehicle,
    vin: currentVIN,
    ecu: currentECU,
    ecuAddress: connectedECUs.find(e => e.name === currentECU)?.address || '',
    ecuInfo: {},
    parameters: {},
    appVersion: app.getVersion(),
    backupType: 'manual'
  };

  try {
    // Read VIN if not already read
    if (!currentVIN) {
      const vinCmd = uds.readDataByIdentifier('F190');
      const vinResp = await sendCommand(vinCmd);
      const vinParsed = uds.parseResponse(vinResp);
      if (vinParsed.success) {
        state.vin = hexToASCII(vinParsed.data);
        currentVIN = state.vin;
      }
    }

    // Read ECU identification
    const ecuInfoCmd = uds.readDataByIdentifier('F187');
    const ecuInfoResp = await sendCommand(ecuInfoCmd);
    const ecuInfoParsed = uds.parseResponse(ecuInfoResp);
    if (ecuInfoParsed.success) {
      state.ecuInfo.partNumber = hexToASCII(ecuInfoParsed.data);
    }

    // Read DTCs
    const dtcCmd = uds.readDTC(uds.dtcReportTypes.DTC_BY_STATUS_MASK);
    const dtcResp = await sendCommand(dtcCmd);
    const dtcParsed = uds.parseResponse(dtcResp);
    if (dtcParsed.success) {
      state.dtcs = parseDTC(dtcParsed.data);
    }
  } catch (error) {
    console.error('Error reading ECU state:', error);
  }

  return state;
}

// Helper: Convert hex to ASCII
function hexToASCII(hex) {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substr(i, 2), 16);
    if (charCode >= 32 && charCode <= 126) {
      str += String.fromCharCode(charCode);
    }
  }
  return str;
}

async function detectECUs() {
  const foundECUs = [];
  
  for (const [name, address] of Object.entries(ecuAddresses)) {
    try {
      const response = await sendCommandToECU(address, '0100');
      if (response && response.length > 4) {
        foundECUs.push({ name, address });
      }
    } catch (e) {
      // ECU not responding
    }
  }
  
  return foundECUs;
}

async function sendCommandToECU(ecuAddress, command) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
    
    parser.once('data', (data) => {
      clearTimeout(timeout);
      resolve(data.trim());
    });
    
    port.write(`ATSH${ecuAddress}\r`);
    setTimeout(() => port.write(command + '\r'), 100);
  });
}

async function sendCommand(cmd) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
    
    parser.once('data', (data) => {
      clearTimeout(timeout);
      resolve(data.trim());
    });
    
    port.write(cmd + '\r');
  });
}

async function getGPSLocation() {
  return { lat: 0, lon: 0, timestamp: Date.now() };
}

function parseRPM(data) {
  const bytes = data.match(/[0-9A-F]{2}/g);
  if (bytes && bytes.length >= 4) {
    return ((parseInt(bytes[2], 16) * 256) + parseInt(bytes[3], 16)) / 4;
  }
  return 0;
}

function parseSpeed(data) {
  const bytes = data.match(/[0-9A-F]{2}/g);
  if (bytes && bytes.length >= 3) {
    return parseInt(bytes[2], 16);
  }
  return 0;
}

function parseCoolant(data) {
  const bytes = data.match(/[0-9A-F]{2}/g);
  if (bytes && bytes.length >= 3) {
    return parseInt(bytes[2], 16) - 40;
  }
  return 0;
}

function parseThrottle(data) {
  const bytes = data.match(/[0-9A-F]{2}/g);
  if (bytes && bytes.length >= 3) {
    return (parseInt(bytes[2], 16) * 100) / 255;
  }
  return 0;
}

function parseEngineLoad(data) {
  const bytes = data.match(/[0-9A-F]{2}/g);
  if (bytes && bytes.length >= 3) {
    return (parseInt(bytes[2], 16) * 100) / 255;
  }
  return 0;
}

function parseFuelLevel(data) {
  const bytes = data.match(/[0-9A-F]{2}/g);
  if (bytes && bytes.length >= 3) {
    return (parseInt(bytes[2], 16) * 100) / 255;
  }
  return 0;
}

function parseDTC(data) {
  const dtcCodes = [];
  const bytes = data.match(/[0-9A-F]{2}/g);
  
  if (bytes && bytes.length > 2) {
    const numCodes = parseInt(bytes[0], 16);
    
    for (let i = 0; i < numCodes; i++) {
      const offset = 1 + (i * 2);
      if (bytes[offset] && bytes[offset + 1]) {
        const code = parseDTCCode(bytes[offset] + bytes[offset + 1]);
        dtcCodes.push(code);
      }
    }
  }
  
  return dtcCodes;
}

function parseDTCCode(hex) {
  const firstChar = ['P', 'C', 'B', 'U'][parseInt(hex[0], 16) >> 6];
  const secondChar = (parseInt(hex[0], 16) & 0x30) >> 4;
  const thirdChar = hex[0][1];
  const lastTwo = hex.substring(1, 3);
  
  return `${firstChar}${secondChar}${thirdChar}${lastTwo}`;
}