/**
 * ECU Parameter Database
 * Comprehensive database of ECU parameters with validation rules
 */

class ParameterDatabase {
  constructor() {
    this.parameters = this.initializeDatabase();
  }

  initializeDatabase() {
    return {
      // VW/Audi Parameters
      vw: {
        engine: {
          '0x2001': {
            name: 'Throttle Response',
            description: 'Throttle pedal response characteristic',
            unit: 'mode',
            dataType: 'uint8',
            min: 0,
            max: 3,
            default: 1,
            values: { 0: 'Economy', 1: 'Normal', 2: 'Sport', 3: 'Individual' },
            safety: 'medium',
            requiresSecurity: true
          },
          '0x2002': {
            name: 'Idle Speed',
            description: 'Target idle RPM',
            unit: 'RPM',
            dataType: 'uint16',
            min: 600,
            max: 1000,
            default: 800,
            safety: 'high',
            requiresSecurity: true,
            warning: 'Incorrect idle speed may cause engine stalling'
          },
          '0x2003': {
            name: 'Rev Limiter',
            description: 'Maximum engine RPM',
            unit: 'RPM',
            dataType: 'uint16',
            min: 5000,
            max: 7500,
            default: 6500,
            safety: 'critical',
            requiresSecurity: true,
            warning: 'Increasing may cause engine damage'
          },
          '0x2004': {
            name: 'Fuel Injection Timing',
            description: 'Injection timing offset',
            unit: 'degrees',
            dataType: 'int8',
            min: -10,
            max: 10,
            default: 0,
            safety: 'high',
            requiresSecurity: true
          },
          '0x2005': {
            name: 'Boost Pressure Limit',
            description: 'Maximum turbo boost pressure',
            unit: 'kPa',
            dataType: 'uint16',
            min: 100,
            max: 250,
            default: 180,
            safety: 'critical',
            requiresSecurity: true,
            warning: 'Excessive boost may damage engine'
          }
        },
        transmission: {
          '0x3001': {
            name: 'Shift Points',
            description: 'Automatic transmission shift RPM',
            unit: 'RPM',
            dataType: 'uint16',
            min: 2000,
            max: 6000,
            default: 3500,
            safety: 'medium',
            requiresSecurity: true
          },
          '0x3002': {
            name: 'Shift Speed',
            description: 'Gear change speed',
            unit: 'mode',
            dataType: 'uint8',
            min: 0,
            max: 2,
            default: 1,
            values: { 0: 'Comfort', 1: 'Normal', 2: 'Sport' },
            safety: 'low',
            requiresSecurity: false
          },
          '0x3003': {
            name: 'Torque Converter Lock',
            description: 'TC lockup speed threshold',
            unit: 'km/h',
            dataType: 'uint8',
            min: 30,
            max: 80,
            default: 50,
            safety: 'medium',
            requiresSecurity: true
          }
        },
        abs: {
          '0x4001': {
            name: 'ABS Intervention Threshold',
            description: 'Wheel slip threshold for ABS activation',
            unit: '%',
            dataType: 'uint8',
            min: 5,
            max: 20,
            default: 10,
            safety: 'critical',
            requiresSecurity: true,
            warning: 'Affects braking safety'
          },
          '0x4002': {
            name: 'Traction Control Level',
            description: 'TC intervention aggressiveness',
            unit: 'mode',
            dataType: 'uint8',
            min: 0,
            max: 2,
            default: 1,
            values: { 0: 'Off', 1: 'Normal', 2: 'Sport' },
            safety: 'high',
            requiresSecurity: true
          }
        },
        instrument: {
          '0x5001': {
            name: 'Speed Warning Threshold',
            description: 'Speed limit warning activation',
            unit: 'km/h',
            dataType: 'uint8',
            min: 0,
            max: 200,
            default: 120,
            safety: 'low',
            requiresSecurity: false
          },
          '0x5002': {
            name: 'Service Interval',
            description: 'Service reminder distance',
            unit: 'km',
            dataType: 'uint16',
            min: 5000,
            max: 30000,
            default: 15000,
            safety: 'low',
            requiresSecurity: false
          },
          '0x5003': {
            name: 'Daytime Running Lights',
            description: 'DRL activation',
            unit: 'boolean',
            dataType: 'uint8',
            min: 0,
            max: 1,
            default: 1,
            values: { 0: 'Off', 1: 'On' },
            safety: 'low',
            requiresSecurity: false
          }
        }
      },

      // Nissan Parameters
      nissan: {
        engine: {
          '0x6001': {
            name: 'Throttle Map',
            description: 'Accelerator pedal mapping',
            unit: 'mode',
            dataType: 'uint8',
            min: 0,
            max: 2,
            default: 1,
            values: { 0: 'Eco', 1: 'Standard', 2: 'Power' },
            safety: 'medium',
            requiresSecurity: true
          },
          '0x6002': {
            name: 'Idle Control',
            description: 'Idle speed target',
            unit: 'RPM',
            dataType: 'uint16',
            min: 550,
            max: 950,
            default: 700,
            safety: 'high',
            requiresSecurity: true
          },
          '0x6003': {
            name: 'Fuel Cut RPM',
            description: 'Fuel cutoff limit',
            unit: 'RPM',
            dataType: 'uint16',
            min: 5500,
            max: 7000,
            default: 6200,
            safety: 'critical',
            requiresSecurity: true,
            warning: 'Modifying may void warranty'
          },
          '0x6004': {
            name: 'VVEL Timing',
            description: 'Variable valve event timing',
            unit: 'degrees',
            dataType: 'int8',
            min: -15,
            max: 15,
            default: 0,
            safety: 'high',
            requiresSecurity: true
          }
        },
        transmission: {
          '0x7001': {
            name: 'Shift Logic',
            description: 'Transmission shift pattern',
            unit: 'mode',
            dataType: 'uint8',
            min: 0,
            max: 1,
            default: 0,
            values: { 0: 'Normal', 1: 'Sport' },
            safety: 'low',
            requiresSecurity: false
          },
          '0x7002': {
            name: 'Line Pressure',
            description: 'Hydraulic line pressure adjustment',
            unit: '%',
            dataType: 'int8',
            min: -10,
            max: 10,
            default: 0,
            safety: 'high',
            requiresSecurity: true,
            warning: 'Incorrect pressure may damage transmission'
          }
        },
        abs: {
          '0x8001': {
            name: 'VDC Threshold',
            description: 'Vehicle Dynamic Control activation threshold',
            unit: '%',
            dataType: 'uint8',
            min: 10,
            max: 30,
            default: 20,
            safety: 'critical',
            requiresSecurity: true
          }
        }
      },

      // Standard OBD-II PIDs (all manufacturers)
      standard: {
        engine: {
          '0x010C': { name: 'Engine RPM', unit: 'RPM', readonly: true },
          '0x010D': { name: 'Vehicle Speed', unit: 'km/h', readonly: true },
          '0x0105': { name: 'Coolant Temperature', unit: '°C', readonly: true },
          '0x010F': { name: 'Intake Air Temperature', unit: '°C', readonly: true },
          '0x0111': { name: 'Throttle Position', unit: '%', readonly: true },
          '0x0104': { name: 'Engine Load', unit: '%', readonly: true },
          '0x0110': { name: 'MAF Sensor', unit: 'g/s', readonly: true },
          '0x012F': { name: 'Fuel Level', unit: '%', readonly: true },
          '0x010E': { name: 'Timing Advance', unit: '°', readonly: true },
          '0x010A': { name: 'Fuel Pressure', unit: 'kPa', readonly: true }
        }
      }
    };
  }

  /**
   * Get parameter by ID
   */
  getParameter(manufacturer, module, parameterId) {
    const mfg = manufacturer.toLowerCase();
    
    if (this.parameters[mfg] && this.parameters[mfg][module]) {
      return this.parameters[mfg][module][parameterId];
    }
    
    // Check standard parameters
    if (this.parameters.standard[module]) {
      return this.parameters.standard[module][parameterId];
    }
    
    return null;
  }

  /**
   * Get all parameters for a module
   */
  getModuleParameters(manufacturer, module) {
    const mfg = manufacturer.toLowerCase();
    
    if (this.parameters[mfg] && this.parameters[mfg][module]) {
      return this.parameters[mfg][module];
    }
    
    return {};
  }

  /**
   * Validate parameter value
   */
  validateValue(manufacturer, module, parameterId, value) {
    const param = this.getParameter(manufacturer, module, parameterId);
    
    if (!param) {
      return { valid: false, error: 'Parameter not found in database' };
    }

    if (param.readonly) {
      return { valid: false, error: 'Parameter is read-only' };
    }

    // Type validation
    const numValue = typeof value === 'string' ? parseInt(value, 16) : value;
    
    if (isNaN(numValue)) {
      return { valid: false, error: 'Invalid numeric value' };
    }

    // Range validation
    if (numValue < param.min || numValue > param.max) {
      return { 
        valid: false, 
        error: `Value out of range (${param.min}-${param.max} ${param.unit})` 
      };
    }

    // Value set validation
    if (param.values && !param.values[numValue]) {
      return { 
        valid: false, 
        error: `Invalid value. Allowed: ${Object.entries(param.values).map(([k,v]) => `${k}=${v}`).join(', ')}` 
      };
    }

    return { 
      valid: true, 
      param,
      value: numValue,
      warning: param.warning || null
    };
  }

  /**
   * Search parameters by name or description
   */
  searchParameters(manufacturer, searchTerm) {
    const results = [];
    const mfg = manufacturer.toLowerCase();
    
    if (!this.parameters[mfg]) {
      return results;
    }

    const term = searchTerm.toLowerCase();
    
    for (const [module, params] of Object.entries(this.parameters[mfg])) {
      for (const [id, param] of Object.entries(params)) {
        if (param.name.toLowerCase().includes(term) || 
            param.description.toLowerCase().includes(term)) {
          results.push({
            module,
            id,
            ...param
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Get parameters by safety level
   */
  getParametersBySafety(manufacturer, safetyLevel) {
    const results = [];
    const mfg = manufacturer.toLowerCase();
    
    if (!this.parameters[mfg]) {
      return results;
    }

    for (const [module, params] of Object.entries(this.parameters[mfg])) {
      for (const [id, param] of Object.entries(params)) {
        if (param.safety === safetyLevel) {
          results.push({
            module,
            id,
            ...param
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Add custom parameter (for extending database)
   */
  addParameter(manufacturer, module, parameterId, paramConfig) {
    const mfg = manufacturer.toLowerCase();
    
    if (!this.parameters[mfg]) {
      this.parameters[mfg] = {};
    }
    
    if (!this.parameters[mfg][module]) {
      this.parameters[mfg][module] = {};
    }
    
    this.parameters[mfg][module][parameterId] = paramConfig;
  }
}

module.exports = ParameterDatabase;
