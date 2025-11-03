/**
 * UDS Protocol Implementation (ISO 14229)
 * Unified Diagnostic Services
 */

class UDS {
  constructor() {
    // Service IDs
    this.services = {
      DIAGNOSTIC_SESSION_CONTROL: 0x10,
      ECU_RESET: 0x11,
      SECURITY_ACCESS: 0x27,
      COMMUNICATION_CONTROL: 0x28,
      TESTER_PRESENT: 0x3E,
      ACCESS_TIMING_PARAMETER: 0x83,
      SECURED_DATA_TRANSMISSION: 0x84,
      CONTROL_DTC_SETTING: 0x85,
      RESPONSE_ON_EVENT: 0x86,
      LINK_CONTROL: 0x87,
      READ_DATA_BY_IDENTIFIER: 0x22,
      READ_MEMORY_BY_ADDRESS: 0x23,
      READ_SCALING_DATA: 0x24,
      READ_DATA_BY_PERIODIC_ID: 0x2A,
      DYNAMICALLY_DEFINE_DATA_ID: 0x2C,
      WRITE_DATA_BY_IDENTIFIER: 0x2E,
      WRITE_MEMORY_BY_ADDRESS: 0x3D,
      CLEAR_DTC: 0x14,
      READ_DTC: 0x19,
      INPUT_OUTPUT_CONTROL: 0x2F,
      ROUTINE_CONTROL: 0x31,
      REQUEST_DOWNLOAD: 0x34,
      REQUEST_UPLOAD: 0x35,
      TRANSFER_DATA: 0x36,
      REQUEST_TRANSFER_EXIT: 0x37,
      REQUEST_FILE_TRANSFER: 0x38
    };

    // Session types
    this.sessions = {
      DEFAULT: 0x01,
      PROGRAMMING: 0x02,
      EXTENDED: 0x03,
      SAFETY_SYSTEM: 0x04
    };

    // Reset types
    this.resetTypes = {
      HARD_RESET: 0x01,
      KEY_OFF_ON: 0x02,
      SOFT_RESET: 0x03,
      ENABLE_RAPID_POWER_SHUTDOWN: 0x04,
      DISABLE_RAPID_POWER_SHUTDOWN: 0x05
    };

    // DTC report types
    this.dtcReportTypes = {
      NUMBER_OF_DTC_BY_STATUS_MASK: 0x01,
      DTC_BY_STATUS_MASK: 0x02,
      DTC_SNAPSHOT_IDENTIFICATION: 0x03,
      DTC_SNAPSHOT_BY_DTC_NUMBER: 0x04,
      DTC_EXTENDED_DATA_BY_DTC_NUMBER: 0x06,
      SUPPORTED_DTC: 0x0A,
      FIRST_TEST_FAILED_DTC: 0x0B,
      FIRST_CONFIRMED_DTC: 0x0C,
      MOST_RECENT_TEST_FAILED_DTC: 0x0D,
      MOST_RECENT_CONFIRMED_DTC: 0x0E
    };

    // Routine control types
    this.routineControlTypes = {
      START_ROUTINE: 0x01,
      STOP_ROUTINE: 0x02,
      REQUEST_ROUTINE_RESULTS: 0x03
    };

    // Negative response codes
    this.nrc = {
      GENERAL_REJECT: 0x10,
      SERVICE_NOT_SUPPORTED: 0x11,
      SUB_FUNCTION_NOT_SUPPORTED: 0x12,
      INCORRECT_MESSAGE_LENGTH: 0x13,
      RESPONSE_TOO_LONG: 0x14,
      BUSY_REPEAT_REQUEST: 0x21,
      CONDITIONS_NOT_CORRECT: 0x22,
      REQUEST_SEQUENCE_ERROR: 0x24,
      REQUEST_OUT_OF_RANGE: 0x31,
      SECURITY_ACCESS_DENIED: 0x33,
      INVALID_KEY: 0x35,
      EXCEED_NUMBER_OF_ATTEMPTS: 0x36,
      REQUIRED_TIME_DELAY_NOT_EXPIRED: 0x37,
      UPLOAD_DOWNLOAD_NOT_ACCEPTED: 0x70,
      TRANSFER_DATA_SUSPENDED: 0x71,
      GENERAL_PROGRAMMING_FAILURE: 0x72,
      WRONG_BLOCK_SEQUENCE_COUNTER: 0x73,
      RESPONSE_PENDING: 0x78,
      SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION: 0x7E,
      SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION: 0x7F
    };

    this.currentSession = this.sessions.DEFAULT;
    this.securityLevel = 0;
  }

  /**
   * Diagnostic Session Control
   */
  diagnosticSessionControl(sessionType) {
    return this.buildCommand(
      this.services.DIAGNOSTIC_SESSION_CONTROL,
      [sessionType]
    );
  }

  /**
   * ECU Reset
   */
  ecuReset(resetType) {
    return this.buildCommand(
      this.services.ECU_RESET,
      [resetType]
    );
  }

  /**
   * Security Access - Request Seed
   */
  securityAccessRequestSeed(level) {
    return this.buildCommand(
      this.services.SECURITY_ACCESS,
      [level * 2 - 1] // Odd numbers for seed request
    );
  }

  /**
   * Security Access - Send Key
   */
  securityAccessSendKey(level, key) {
    const keyBytes = this.hexToBytes(key);
    return this.buildCommand(
      this.services.SECURITY_ACCESS,
      [level * 2, ...keyBytes] // Even numbers for key send
    );
  }

  /**
   * Tester Present
   */
  testerPresent(suppressResponse = false) {
    return this.buildCommand(
      this.services.TESTER_PRESENT,
      [suppressResponse ? 0x80 : 0x00]
    );
  }

  /**
   * Read Data By Identifier
   */
  readDataByIdentifier(dataIdentifier) {
    const did = typeof dataIdentifier === 'string' 
      ? this.hexToBytes(dataIdentifier)
      : [(dataIdentifier >> 8) & 0xFF, dataIdentifier & 0xFF];
    
    return this.buildCommand(
      this.services.READ_DATA_BY_IDENTIFIER,
      did
    );
  }

  /**
   * Write Data By Identifier
   */
  writeDataByIdentifier(dataIdentifier, data) {
    const did = typeof dataIdentifier === 'string' 
      ? this.hexToBytes(dataIdentifier)
      : [(dataIdentifier >> 8) & 0xFF, dataIdentifier & 0xFF];
    
    const dataBytes = typeof data === 'string' 
      ? this.hexToBytes(data)
      : [data];
    
    return this.buildCommand(
      this.services.WRITE_DATA_BY_IDENTIFIER,
      [...did, ...dataBytes]
    );
  }

  /**
   * Read Memory By Address
   */
  readMemoryByAddress(address, size, addressLength = 3, sizeLength = 2) {
    const addressBytes = this.numberToBytes(address, addressLength);
    const sizeBytes = this.numberToBytes(size, sizeLength);
    
    return this.buildCommand(
      this.services.READ_MEMORY_BY_ADDRESS,
      [
        (addressLength << 4) | sizeLength,
        ...addressBytes,
        ...sizeBytes
      ]
    );
  }

  /**
   * Write Memory By Address
   */
  writeMemoryByAddress(address, data, addressLength = 3) {
    const addressBytes = this.numberToBytes(address, addressLength);
    const dataBytes = typeof data === 'string' ? this.hexToBytes(data) : data;
    
    return this.buildCommand(
      this.services.WRITE_MEMORY_BY_ADDRESS,
      [
        (addressLength << 4) | dataBytes.length,
        ...addressBytes,
        ...dataBytes
      ]
    );
  }

  /**
   * Clear Diagnostic Information
   */
  clearDTC(groupOfDTC = 0xFFFFFF) {
    return this.buildCommand(
      this.services.CLEAR_DTC,
      [
        (groupOfDTC >> 16) & 0xFF,
        (groupOfDTC >> 8) & 0xFF,
        groupOfDTC & 0xFF
      ]
    );
  }

  /**
   * Read DTC Information
   */
  readDTC(reportType, statusMask = 0xFF) {
    return this.buildCommand(
      this.services.READ_DTC,
      [reportType, statusMask]
    );
  }

  /**
   * Input/Output Control By Identifier
   */
  inputOutputControl(identifier, controlParameter, controlOption) {
    const idBytes = this.hexToBytes(identifier);
    const paramBytes = this.hexToBytes(controlParameter);
    
    return this.buildCommand(
      this.services.INPUT_OUTPUT_CONTROL,
      [...idBytes, ...paramBytes, controlOption]
    );
  }

  /**
   * Routine Control
   */
  routineControl(routineControlType, routineIdentifier, routineOption = []) {
    const ridBytes = typeof routineIdentifier === 'string'
      ? this.hexToBytes(routineIdentifier)
      : [(routineIdentifier >> 8) & 0xFF, routineIdentifier & 0xFF];
    
    return this.buildCommand(
      this.services.ROUTINE_CONTROL,
      [routineControlType, ...ridBytes, ...routineOption]
    );
  }

  /**
   * Request Download (for flashing)
   */
  requestDownload(memoryAddress, memorySize, dataFormat = 0x00) {
    const addressBytes = this.numberToBytes(memoryAddress, 4);
    const sizeBytes = this.numberToBytes(memorySize, 4);
    
    return this.buildCommand(
      this.services.REQUEST_DOWNLOAD,
      [
        dataFormat,
        0x44, // 4 bytes address, 4 bytes size
        ...addressBytes,
        ...sizeBytes
      ]
    );
  }

  /**
   * Request Upload (for reading flash)
   */
  requestUpload(memoryAddress, memorySize, dataFormat = 0x00) {
    const addressBytes = this.numberToBytes(memoryAddress, 4);
    const sizeBytes = this.numberToBytes(memorySize, 4);
    
    return this.buildCommand(
      this.services.REQUEST_UPLOAD,
      [
        dataFormat,
        0x44,
        ...addressBytes,
        ...sizeBytes
      ]
    );
  }

  /**
   * Transfer Data
   */
  transferData(blockSequenceCounter, data) {
    const dataBytes = typeof data === 'string' ? this.hexToBytes(data) : data;
    
    return this.buildCommand(
      this.services.TRANSFER_DATA,
      [blockSequenceCounter, ...dataBytes]
    );
  }

  /**
   * Request Transfer Exit
   */
  requestTransferExit() {
    return this.buildCommand(this.services.REQUEST_TRANSFER_EXIT, []);
  }

  /**
   * Control DTC Setting
   */
  controlDTCSetting(settingType) {
    return this.buildCommand(
      this.services.CONTROL_DTC_SETTING,
      [settingType]
    );
  }

  /**
   * Parse UDS response
   */
  parseResponse(response) {
    const bytes = this.hexToBytes(response);
    
    if (bytes.length === 0) {
      return { success: false, error: 'Empty response' };
    }

    // Negative response
    if (bytes[0] === 0x7F) {
      const serviceId = bytes[1];
      const nrcCode = bytes[2];
      return {
        success: false,
        negative: true,
        service: serviceId,
        nrc: nrcCode,
        nrcDescription: this.getNRCDescription(nrcCode)
      };
    }

    // Positive response
    const serviceId = bytes[0] - 0x40; // Response is service + 0x40
    
    return {
      success: true,
      service: serviceId,
      data: this.bytesToHex(bytes.slice(1))
    };
  }

  /**
   * Get negative response code description
   */
  getNRCDescription(nrc) {
    const descriptions = {
      0x10: 'General Reject',
      0x11: 'Service Not Supported',
      0x12: 'Sub-Function Not Supported',
      0x13: 'Incorrect Message Length',
      0x21: 'Busy - Repeat Request',
      0x22: 'Conditions Not Correct',
      0x31: 'Request Out Of Range',
      0x33: 'Security Access Denied',
      0x35: 'Invalid Key',
      0x36: 'Exceed Number Of Attempts',
      0x37: 'Required Time Delay Not Expired',
      0x78: 'Response Pending'
    };
    
    return descriptions[nrc] || `Unknown NRC: 0x${nrc.toString(16)}`;
  }

  /**
   * Build UDS command
   */
  buildCommand(serviceId, parameters) {
    return this.bytesToHex([serviceId, ...parameters]);
  }

  /**
   * Helper: Convert number to byte array
   */
  numberToBytes(num, length) {
    const bytes = [];
    for (let i = length - 1; i >= 0; i--) {
      bytes.push((num >> (i * 8)) & 0xFF);
    }
    return bytes;
  }

  /**
   * Helper: Convert hex string to byte array
   */
  hexToBytes(hex) {
    const cleaned = hex.replace(/\s/g, '');
    const bytes = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes.push(parseInt(cleaned.substr(i, 2), 16));
    }
    return bytes;
  }

  /**
   * Helper: Convert byte array to hex string
   */
  bytesToHex(bytes) {
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
}

module.exports = UDS;
