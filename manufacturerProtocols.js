/**
 * Manufacturer-Specific Protocols
 * VW/Audi KWP2000/TP2.0 and Nissan Consult protocols
 */

class ManufacturerProtocols {
  constructor() {
    this.protocols = {
      vw: new VWProtocol(),
      nissan: new NissanProtocol()
    };
  }

  getProtocol(manufacturer) {
    const mfg = manufacturer.toLowerCase();
    if (mfg.includes('vw') || mfg.includes('audi') || mfg.includes('volkswagen')) {
      return this.protocols.vw;
    } else if (mfg.includes('nissan') || mfg.includes('infiniti')) {
      return this.protocols.nissan;
    }
    return null;
  }
}

/**
 * VW/Audi KWP2000 Protocol
 */
class VWProtocol {
  constructor() {
    this.services = {
      START_DIAGNOSTIC_SESSION: 0x10,
      READ_ECU_IDENTIFICATION: 0x1A,
      READ_DATA_BY_LOCAL_ID: 0x21,
      READ_DATA_BY_COMMON_ID: 0x22,
      READ_MEMORY_BY_ADDRESS: 0x23,
      SECURITY_ACCESS: 0x27,
      DYNAMICALLY_DEFINE_LOCAL_ID: 0x2C,
      WRITE_DATA_BY_COMMON_ID: 0x2E,
      INPUT_OUTPUT_CONTROL: 0x30,
      START_ROUTINE_BY_LOCAL_ID: 0x31,
      STOP_ROUTINE_BY_LOCAL_ID: 0x32,
      REQUEST_ROUTINE_RESULTS: 0x33,
      REQUEST_DOWNLOAD: 0x34,
      REQUEST_UPLOAD: 0x35,
      TRANSFER_DATA: 0x36,
      REQUEST_TRANSFER_EXIT: 0x37,
      WRITE_DATA_BY_LOCAL_ID: 0x3B,
      WRITE_MEMORY_BY_ADDRESS: 0x3D,
      TESTER_PRESENT: 0x3E,
      CONTROL_DTC_SETTING: 0x85,
      READ_DTC_BY_STATUS: 0x17,
      CLEAR_DTC: 0x14
    };

    this.adaptationChannels = {
      // Common VW adaptation channels
      THROTTLE_ADAPTATION: 0x0001,
      IDLE_SPEED: 0x0002,
      FUEL_TRIM_LOW: 0x0003,
      FUEL_TRIM_HIGH: 0x0004,
      STEERING_ANGLE: 0x0005,
      HEADLIGHT_RANGE: 0x0006,
      TIRE_PRESSURE_THRESHOLD: 0x0007,
      START_STOP_ENABLED: 0x0008,
      COMFORT_SETTINGS: 0x0009,
      DAYTIME_RUNNING_LIGHTS: 0x000A
    };

    this.codingHelpers = {
      // Coding helper information
      LONG_CODING: 0x00,
      SHORT_CODING: 0x01
    };
  }

  /**
   * Read Adaptation Channel
   */
  readAdaptation(channelNumber) {
    return this.buildCommand(0x21, [
      (channelNumber >> 8) & 0xFF,
      channelNumber & 0xFF
    ]);
  }

  /**
   * Write Adaptation Channel
   */
  writeAdaptation(channelNumber, value, workshopCode = 0x0000) {
    const valueBytes = this.numberToBytes(value, 2);
    const workshopBytes = this.numberToBytes(workshopCode, 2);
    
    return this.buildCommand(0x2E, [
      (channelNumber >> 8) & 0xFF,
      channelNumber & 0xFF,
      ...valueBytes,
      ...workshopBytes
    ]);
  }

  /**
   * Read Coding
   */
  readCoding() {
    return this.buildCommand(0x19, [0x00]);
  }

  /**
   * Write Coding (Long Coding)
   */
  writeCoding(codingData, workshopCode = 0x0000) {
    const codingBytes = typeof codingData === 'string' 
      ? this.hexToBytes(codingData)
      : codingData;
    const workshopBytes = this.numberToBytes(workshopCode, 2);
    
    return this.buildCommand(0x2E, [
      ...codingBytes,
      ...workshopBytes
    ]);
  }

  /**
   * Reset Adaptation Channel
   */
  resetAdaptation(channelNumber) {
    return this.buildCommand(0x31, [
      0x00, // Start routine
      (channelNumber >> 8) & 0xFF,
      channelNumber & 0xFF
    ]);
  }

  /**
   * Read Measuring Blocks
   */
  readMeasuringBlock(blockNumber) {
    return this.buildCommand(0x21, [
      (blockNumber >> 8) & 0xFF,
      blockNumber & 0xFF
    ]);
  }

  /**
   * Component Test (Actuator Test)
   */
  componentTest(componentId, testType = 0x01) {
    return this.buildCommand(0x31, [
      testType,
      (componentId >> 8) & 0xFF,
      componentId & 0xFF
    ]);
  }

  /**
   * Read ECU Identification
   */
  readECUIdentification(identType = 0x9A) {
    // 0x86: VIN, 0x87: Part Number, 0x88: Software Version
    // 0x89: Hardware Version, 0x9A: All identification
    return this.buildCommand(this.services.READ_ECU_IDENTIFICATION, [identType]);
  }

  /**
   * Login (Security Access)
   */
  login(accessLevel, pin) {
    const pinBytes = this.numberToBytes(pin, 2);
    return this.buildCommand(this.services.SECURITY_ACCESS, [
      accessLevel,
      ...pinBytes
    ]);
  }

  /**
   * Build command
   */
  buildCommand(serviceId, parameters) {
    return this.bytesToHex([serviceId, ...parameters]);
  }

  /**
   * Helpers
   */
  numberToBytes(num, length) {
    const bytes = [];
    for (let i = length - 1; i >= 0; i--) {
      bytes.push((num >> (i * 8)) & 0xFF);
    }
    return bytes;
  }

  hexToBytes(hex) {
    const cleaned = hex.replace(/\s/g, '');
    const bytes = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes.push(parseInt(cleaned.substr(i, 2), 16));
    }
    return bytes;
  }

  bytesToHex(bytes) {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
}

/**
 * Nissan Consult Protocol
 */
class NissanProtocol {
  constructor() {
    this.commands = {
      ECU_IDENTIFICATION: 0xD0,
      READ_DIAGNOSTIC_REGISTERS: 0xD1,
      READ_DATA_STREAM: 0x5A,
      SELF_DIAGNOSTIC_RESULTS: 0xD3,
      CLEAR_SELF_DIAGNOSTIC_RESULTS: 0xC3,
      SWITCH_DIAGNOSTIC_MODE: 0xD6,
      ECU_STATUS: 0xE0,
      ACTIVE_TEST: 0xE1,
      READ_ROM: 0xE2,
      WRITE_RAM: 0xE3,
      READ_WORK_SUPPORT: 0xE5
    };

    this.dataStreamParams = {
      ENGINE_RPM: 0x00,
      VEHICLE_SPEED: 0x01,
      COOLANT_TEMP: 0x02,
      THROTTLE_POSITION: 0x03,
      FUEL_TEMP: 0x04,
      MAF_VOLTAGE: 0x05,
      IGNITION_TIMING: 0x06,
      AAC_VALVE: 0x07,
      AF_ALPHA: 0x08,
      FUEL_TRIM: 0x09,
      INJECTOR_PULSE: 0x0A,
      OXYGEN_SENSOR: 0x0B,
      BATTERY_VOLTAGE: 0x0C
    };

    this.activeTests = {
      INJECTOR_1: 0x01,
      INJECTOR_2: 0x02,
      INJECTOR_3: 0x03,
      INJECTOR_4: 0x04,
      IDLE_AIR_CONTROL: 0x10,
      IGNITION_COIL_1: 0x20,
      FUEL_PUMP: 0x30,
      EVAP_PURGE: 0x40
    };
  }

  /**
   * Read ECU Identification
   */
  readECUIdentification() {
    return this.buildCommand(this.commands.ECU_IDENTIFICATION);
  }

  /**
   * Read Data Stream
   */
  readDataStream(parameters = []) {
    if (parameters.length === 0) {
      // Read all standard parameters
      parameters = Object.values(this.dataStreamParams).slice(0, 16);
    }
    return this.buildCommand(this.commands.READ_DATA_STREAM, parameters);
  }

  /**
   * Read Self Diagnostic Results (DTCs)
   */
  readSelfDiagnostic() {
    return this.buildCommand(this.commands.SELF_DIAGNOSTIC_RESULTS);
  }

  /**
   * Clear Self Diagnostic Results
   */
  clearSelfDiagnostic() {
    return this.buildCommand(this.commands.CLEAR_SELF_DIAGNOSTIC_RESULTS);
  }

  /**
   * Switch Diagnostic Mode
   */
  switchDiagnosticMode(mode) {
    // mode: 0x01 = standard, 0x02 = enhanced
    return this.buildCommand(this.commands.SWITCH_DIAGNOSTIC_MODE, [mode]);
  }

  /**
   * Active Test (Actuator Test)
   */
  activeTest(testId, state = 0x01) {
    // state: 0x01 = activate, 0x00 = deactivate
    return this.buildCommand(this.commands.ACTIVE_TEST, [testId, state]);
  }

  /**
   * Read Work Support (Memory area)
   */
  readWorkSupport(address, length) {
    const addrBytes = this.numberToBytes(address, 2);
    return this.buildCommand(this.commands.READ_WORK_SUPPORT, [
      ...addrBytes,
      length
    ]);
  }

  /**
   * Write RAM
   */
  writeRAM(address, data) {
    const addrBytes = this.numberToBytes(address, 2);
    const dataBytes = typeof data === 'string' ? this.hexToBytes(data) : [data];
    
    return this.buildCommand(this.commands.WRITE_RAM, [
      ...addrBytes,
      ...dataBytes
    ]);
  }

  /**
   * Read ROM
   */
  readROM(address, length) {
    const addrBytes = this.numberToBytes(address, 2);
    return this.buildCommand(this.commands.READ_ROM, [
      ...addrBytes,
      length
    ]);
  }

  /**
   * Parse Consult Response
   */
  parseResponse(response) {
    const bytes = this.hexToBytes(response);
    
    if (bytes.length === 0) {
      return { success: false, error: 'Empty response' };
    }

    // Check for error
    if (bytes[0] === 0xFF) {
      return { success: false, error: 'ECU returned error' };
    }

    return {
      success: true,
      data: bytes
    };
  }

  /**
   * Build command
   */
  buildCommand(commandId, parameters = []) {
    return this.bytesToHex([commandId, ...parameters]);
  }

  /**
   * Helpers
   */
  numberToBytes(num, length) {
    const bytes = [];
    for (let i = length - 1; i >= 0; i--) {
      bytes.push((num >> (i * 8)) & 0xFF);
    }
    return bytes;
  }

  hexToBytes(hex) {
    const cleaned = hex.replace(/\s/g, '');
    const bytes = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes.push(parseInt(cleaned.substr(i, 2), 16));
    }
    return bytes;
  }

  bytesToHex(bytes) {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
}

module.exports = { ManufacturerProtocols, VWProtocol, NissanProtocol };
