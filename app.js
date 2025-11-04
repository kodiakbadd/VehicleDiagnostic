// VWConnApp Professional Edition - Main UI Handler
console.log('VWConnApp Professional Edition - Loading...');

let isConnected = false;
let currentPorts = [];

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabName + '-tab').classList.add('active');
  event.target.classList.add('active');
}

function logMessage(msg, type='info') {
  const output = document.getElementById('output');
  const p = document.createElement('p');
  const colors = {success:'#00ff00',error:'#ff4444',warning:'#ffaa00',info:'#00ff00'};
  p.innerHTML = '<span style="color:#00aaff;">['+new Date().toLocaleTimeString()+']</span> <span style="color:'+colors[type]+';">'+msg+'</span>';
  output.appendChild(p);
  output.scrollTop = output.scrollHeight;
}

async function refreshPorts() {
  try {
    currentPorts = await window.api.listPorts();
    const portSelect = document.getElementById('portSelect');
    portSelect.innerHTML = '<option value="">Select COM Port</option>';
    
    currentPorts.forEach(port => {
      const option = document.createElement('option');
      option.value = port.path;
      option.textContent = `${port.path} - ${port.manufacturer}`;
      portSelect.appendChild(option);
    });
    
    logMessage(`Found ${currentPorts.length} serial ports`);
  } catch (error) {
    logMessage(`Error listing ports: ${error.message}`, 'error');
  }
}

async function connect() {
  const portPath = document.getElementById('portSelect').value;
  
  if (!portPath) {
    logMessage('Please select a COM port', 'warning');
    return;
  }
  
  logMessage('═══════════════════════════════════════════', 'info');
  logMessage('CONNECTION DIAGNOSTICS - ELM327 Adapter Test', 'info');
  logMessage('═══════════════════════════════════════════', 'info');
  logMessage(`Connecting to ${portPath}...`, 'info');
  
  document.getElementById('connectBtn').disabled = true;
  
  try {
    const result = await window.api.connect(portPath);
    
    // Display diagnostic log
    if (result.diagnosticLog) {
      logMessage('--- Diagnostic Log ---', 'info');
      result.diagnosticLog.forEach(log => {
        const type = log.includes('ERROR') ? 'error' : 
                    log.includes('FAIL') ? 'error' :
                    log.includes('Response:') ? 'success' : 'info';
        logMessage(log, type);
      });
      logMessage('--- End Diagnostic Log ---', 'info');
    }
    
    if (result.success) {
      logMessage('✓ CONNECTION SUCCESSFUL!', 'success');
      if (result.adapterInfo) {
        logMessage(`✓ Adapter: ${result.adapterInfo}`, 'success');
      }
      if (result.baudRate) {
        logMessage(`✓ Baud Rate: ${result.baudRate}`, 'success');
      }
      logMessage(`✓ Found ${result.ecus.length} ECU(s)`, 'success');
      
      isConnected = true;
      document.getElementById('connectBtn').disabled = true;
      document.getElementById('disconnectBtn').disabled = false;
      document.getElementById('connectionStatus').textContent = 'Connected';
      document.getElementById('connectionStatus').className = 'status-connected';
      
      logMessage('═══════════════════════════════════════════', 'success');
      logMessage('DIAGNOSIS: ADAPTER IS WORKING CORRECTLY', 'success');
      logMessage('═══════════════════════════════════════════', 'success');
      
    } else {
      logMessage('✗ CONNECTION FAILED', 'error');
      logMessage(`Error: ${result.error}`, 'error');
      
      if (result.recommendation) {
        logMessage('═══════════════════════════════════════════', 'warning');
        logMessage(`DIAGNOSIS: ${result.recommendation}`, 'warning');
        logMessage('═══════════════════════════════════════════', 'warning');
      }
      
      logMessage('', 'info');
      logMessage('Troubleshooting Steps:', 'warning');
      logMessage('1. Verify vehicle ignition is ON (not just ACC)', 'warning');
      logMessage('2. Check adapter is fully inserted in OBD-II port', 'warning');
      logMessage('3. Try a different COM port from the dropdown', 'warning');
      logMessage('4. Restart the vehicle and try again', 'warning');
      logMessage('5. Check if adapter LED is blinking/lit', 'warning');
      
      document.getElementById('connectBtn').disabled = false;
    }
    
  } catch (error) {
    logMessage(`✗ CRITICAL ERROR: ${error.message}`, 'error');
    logMessage('DIAGNOSIS: Software error - please report this', 'error');
    document.getElementById('connectBtn').disabled = false;
  }
}

async function disconnect() {
  try {
    await window.api.disconnect();
    isConnected = false;
    
    document.getElementById('connectBtn').disabled = false;
    document.getElementById('disconnectBtn').disabled = true;
    document.getElementById('connectionStatus').textContent = 'Not Connected';
    document.getElementById('connectionStatus').className = 'status-disconnected';
    
    logMessage('Disconnected', 'warning');
  } catch (error) {
    logMessage(`Error disconnecting: ${error.message}`, 'error');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  logMessage('═══════════════════════════════════════════', 'success');
  logMessage('VWConnApp Professional Edition v2.0 Ready', 'success');
  logMessage('Advanced Diagnostic Features Enabled', 'success');
  logMessage('═══════════════════════════════════════════', 'success');
  logMessage('', 'info');
  logMessage('Instructions:', 'info');
  logMessage('1. Click "Refresh Ports" to scan for adapters', 'info');
  logMessage('2. Select your ELM327 adapter from dropdown', 'info');
  logMessage('3. Ensure vehicle ignition is ON', 'info');
  logMessage('4. Click "Connect" to run diagnostics', 'info');
  logMessage('', 'info');
  
  // Connection tab event listeners
  document.getElementById('listPorts').addEventListener('click', refreshPorts);
  document.getElementById('connectBtn').addEventListener('click', connect);
  document.getElementById('disconnectBtn').addEventListener('click', disconnect);
  document.getElementById('readVIN').addEventListener('click', readVIN);
  document.getElementById('startSession').addEventListener('click', startDiagnosticSession);
  
  // Diagnostics tab event listeners
  document.getElementById('readLiveData').addEventListener('click', readLiveData);
  document.getElementById('startLogging').addEventListener('click', startLogging);
  document.getElementById('stopLogging').addEventListener('click', stopLogging);
  document.getElementById('readDTC').addEventListener('click', readDTC);
  document.getElementById('clearDTC').addEventListener('click', clearDTC);
  
  // Auto-refresh ports on load
  refreshPorts();
});

// VIN Reading
async function readVIN() {
  if (!isConnected) {
    logMessage('Not connected to vehicle', 'error');
    return;
  }
  
  try {
    logMessage('Reading VIN...', 'info');
    const result = await window.api.readVIN();
    
    if (result.success) {
      logMessage(`✓ VIN: ${result.vin}`, 'success');
      document.getElementById('vinDisplay').textContent = result.vin;
    } else {
      logMessage(`✗ Error reading VIN: ${result.error}`, 'error');
    }
  } catch (error) {
    logMessage(`✗ VIN read failed: ${error.message}`, 'error');
  }
}

// Diagnostic Session
async function startDiagnosticSession() {
  if (!isConnected) {
    logMessage('Not connected to vehicle', 'error');
    return;
  }
  
  try {
    logMessage('Starting diagnostic session...', 'info');
    const result = await window.api.startDiagnosticSession();
    
    if (result.success) {
      logMessage('✓ Diagnostic session started', 'success');
    } else {
      logMessage(`✗ Failed to start session: ${result.error}`, 'error');
    }
  } catch (error) {
    logMessage(`✗ Session start failed: ${error.message}`, 'error');
  }
}

// Live Data Reading
let loggingInterval = null;

async function readLiveData() {
  if (!isConnected) {
    logMessage('Not connected to vehicle', 'error');
    return;
  }
  
  try {
    const result = await window.api.readLiveData();
    
    if (result.success) {
      const liveDataDiv = document.getElementById('liveData');
      liveDataDiv.innerHTML = `
        <div style="font-family: monospace;">
          <strong>RPM:</strong> ${result.data.rpm} RPM<br>
          <strong>Speed:</strong> ${result.data.speed} km/h<br>
          <strong>Coolant Temp:</strong> ${result.data.coolant}°C<br>
          <strong>Throttle:</strong> ${result.data.throttle.toFixed(1)}%<br>
          <strong>Engine Load:</strong> ${result.data.engineLoad.toFixed(1)}%<br>
          <strong>Fuel Level:</strong> ${result.data.fuelLevel.toFixed(1)}%
        </div>
      `;
      logMessage('✓ Live data updated', 'success');
    } else {
      logMessage(`✗ Error reading live data: ${result.error}`, 'error');
    }
  } catch (error) {
    logMessage(`✗ Live data read failed: ${error.message}`, 'error');
  }
}

async function startLogging() {
  if (!isConnected) {
    logMessage('Not connected to vehicle', 'error');
    return;
  }
  
  if (loggingInterval) {
    logMessage('Logging already running', 'warning');
    return;
  }
  
  logMessage('Started live data logging (1 Hz)', 'success');
  document.getElementById('startLogging').disabled = true;
  document.getElementById('stopLogging').disabled = false;
  
  loggingInterval = setInterval(async () => {
    await readLiveData();
  }, 1000);
}

async function stopLogging() {
  if (loggingInterval) {
    clearInterval(loggingInterval);
    loggingInterval = null;
    logMessage('Stopped live data logging', 'warning');
    document.getElementById('startLogging').disabled = false;
    document.getElementById('stopLogging').disabled = true;
  }
}

// DTC Functions
async function readDTC() {
  if (!isConnected) {
    logMessage('Not connected to vehicle', 'error');
    return;
  }
  
  try {
    logMessage('Reading diagnostic trouble codes...', 'info');
    const result = await window.api.readDTC();
    
    if (result.success) {
      const dtcDiv = document.getElementById('dtcCodes');
      
      if (result.codes && result.codes.length > 0) {
        let html = '<div style="font-family: monospace;">';
        html += `<strong>Found ${result.codes.length} DTC(s):</strong><br><br>`;
        result.codes.forEach(code => {
          html += `<div style="background:#363636; padding:8px; margin:5px 0; border-left:3px solid #e74c3c;">
            <strong style="color:#e74c3c;">${code}</strong>
          </div>`;
        });
        html += '</div>';
        dtcDiv.innerHTML = html;
        logMessage(`✓ Found ${result.codes.length} trouble code(s)`, 'warning');
      } else {
        dtcDiv.innerHTML = '<div style="color:#2ecc71;">✓ No trouble codes found</div>';
        logMessage('✓ No trouble codes - vehicle OK', 'success');
      }
    } else {
      logMessage(`✗ Error reading DTCs: ${result.error}`, 'error');
    }
  } catch (error) {
    logMessage(`✗ DTC read failed: ${error.message}`, 'error');
  }
}

async function clearDTC() {
  if (!isConnected) {
    logMessage('Not connected to vehicle', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to clear all diagnostic trouble codes? This will turn off the check engine light.')) {
    return;
  }
  
  try {
    logMessage('Clearing diagnostic trouble codes...', 'info');
    const result = await window.api.clearDTC();
    
    if (result.success) {
      logMessage('✓ Diagnostic trouble codes cleared', 'success');
      document.getElementById('dtcCodes').innerHTML = '<div style="color:#2ecc71;">✓ DTCs cleared successfully</div>';
    } else {
      logMessage(`✗ Error clearing DTCs: ${result.error}`, 'error');
    }
  } catch (error) {
    logMessage(`✗ DTC clear failed: ${error.message}`, 'error');
  }
}
