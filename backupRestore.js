/**
 * ECU Backup and Restore System
 * Comprehensive backup/restore functionality for ECU parameters
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BackupRestore {
  constructor(userDataPath) {
    this.backupDir = path.join(userDataPath, 'ecu_backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create comprehensive ECU backup
   */
  async createBackup(backupData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = crypto.randomBytes(8).toString('hex');
    
    const backup = {
      id: backupId,
      timestamp: new Date().toISOString(),
      vehicle: backupData.vehicle,
      vin: backupData.vin,
      ecu: backupData.ecu,
      ecuAddress: backupData.ecuAddress,
      ecuInfo: backupData.ecuInfo,
      parameters: backupData.parameters || {},
      coding: backupData.coding || null,
      adaptation: backupData.adaptation || {},
      memory: backupData.memory || {},
      dtcSnapshot: backupData.dtcs || [],
      metadata: {
        appVersion: backupData.appVersion || '1.0.0',
        backupType: backupData.backupType || 'manual',
        notes: backupData.notes || ''
      },
      checksum: null
    };

    // Calculate checksum
    backup.checksum = this.calculateChecksum(backup);

    // Save to file
    const filename = `backup_${backupData.vehicle.replace(/\s/g, '_')}_${backupData.ecu}_${timestamp}_${backupId}.json`;
    const filepath = path.join(this.backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    return {
      success: true,
      backupId,
      filepath,
      filename
    };
  }

  /**
   * Restore ECU from backup
   */
  async restoreBackup(backupId, options = {}) {
    const backup = this.loadBackup(backupId);

    if (!backup) {
      return { success: false, error: 'Backup not found' };
    }

    // Verify checksum
    const calculatedChecksum = this.calculateChecksum(backup);
    if (calculatedChecksum !== backup.checksum) {
      return { success: false, error: 'Backup file corrupted - checksum mismatch' };
    }

    // Verify VIN if requested
    if (options.verifyVIN && options.currentVIN !== backup.vin) {
      return { 
        success: false, 
        error: 'VIN mismatch - backup is from a different vehicle' 
      };
    }

    // Prepare restore data
    const restoreData = {
      parameters: backup.parameters,
      coding: backup.coding,
      adaptation: backup.adaptation,
      restoreType: options.restoreType || 'full' // full, parameters, coding, adaptation
    };

    return {
      success: true,
      backup,
      restoreData
    };
  }

  /**
   * List all backups
   */
  listBackups(filters = {}) {
    const files = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.json'));
    const backups = [];

    for (const file of files) {
      try {
        const filepath = path.join(this.backupDir, file);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        // Apply filters
        if (filters.vehicle && data.vehicle !== filters.vehicle) continue;
        if (filters.ecu && data.ecu !== filters.ecu) continue;
        if (filters.vin && data.vin !== filters.vin) continue;

        backups.push({
          id: data.id,
          filename: file,
          timestamp: data.timestamp,
          vehicle: data.vehicle,
          vin: data.vin,
          ecu: data.ecu,
          backupType: data.metadata.backupType,
          notes: data.metadata.notes,
          size: fs.statSync(filepath).size
        });
      } catch (e) {
        console.error(`Error reading backup ${file}:`, e);
      }
    }

    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Load backup by ID
   */
  loadBackup(backupId) {
    const files = fs.readdirSync(this.backupDir);
    
    for (const file of files) {
      if (file.includes(backupId)) {
        const filepath = path.join(this.backupDir, file);
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
      }
    }

    return null;
  }

  /**
   * Delete backup
   */
  deleteBackup(backupId) {
    const files = fs.readdirSync(this.backupDir);
    
    for (const file of files) {
      if (file.includes(backupId)) {
        const filepath = path.join(this.backupDir, file);
        fs.unlinkSync(filepath);
        return { success: true };
      }
    }

    return { success: false, error: 'Backup not found' };
  }

  /**
   * Export backup to external location
   */
  exportBackup(backupId, exportPath) {
    const backup = this.loadBackup(backupId);
    
    if (!backup) {
      return { success: false, error: 'Backup not found' };
    }

    const files = fs.readdirSync(this.backupDir);
    for (const file of files) {
      if (file.includes(backupId)) {
        const sourcePath = path.join(this.backupDir, file);
        fs.copyFileSync(sourcePath, exportPath);
        return { success: true, exportPath };
      }
    }

    return { success: false, error: 'Export failed' };
  }

  /**
   * Import backup from external file
   */
  importBackup(importPath) {
    try {
      const data = JSON.parse(fs.readFileSync(importPath, 'utf8'));
      
      // Verify it's a valid backup
      if (!data.id || !data.timestamp || !data.vehicle) {
        return { success: false, error: 'Invalid backup file format' };
      }

      // Verify checksum
      const calculatedChecksum = this.calculateChecksum(data);
      if (calculatedChecksum !== data.checksum) {
        return { success: false, error: 'Backup file corrupted' };
      }

      // Copy to backup directory
      const filename = path.basename(importPath);
      const destPath = path.join(this.backupDir, filename);
      fs.copyFileSync(importPath, destPath);

      return { 
        success: true, 
        backupId: data.id,
        filename 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Compare two backups
   */
  compareBackups(backupId1, backupId2) {
    const backup1 = this.loadBackup(backupId1);
    const backup2 = this.loadBackup(backupId2);

    if (!backup1 || !backup2) {
      return { success: false, error: 'One or both backups not found' };
    }

    const differences = {
      parameters: this.findDifferences(backup1.parameters, backup2.parameters),
      coding: backup1.coding !== backup2.coding,
      adaptation: this.findDifferences(backup1.adaptation, backup2.adaptation)
    };

    return {
      success: true,
      differences,
      backup1: { id: backup1.id, timestamp: backup1.timestamp },
      backup2: { id: backup2.id, timestamp: backup2.timestamp }
    };
  }

  /**
   * Create automatic pre-modification backup
   */
  async createPreModificationBackup(currentState, modificationType) {
    return await this.createBackup({
      ...currentState,
      backupType: 'auto-pre-modification',
      notes: `Automatic backup before ${modificationType}`
    });
  }

  /**
   * Get latest backup for specific ECU
   */
  getLatestBackup(vehicle, ecu, vin = null) {
    const filters = { vehicle, ecu };
    if (vin) filters.vin = vin;

    const backups = this.listBackups(filters);
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Calculate checksum for backup integrity
   */
  calculateChecksum(backup) {
    const backupCopy = { ...backup };
    delete backupCopy.checksum;
    
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(backupCopy));
    return hash.digest('hex');
  }

  /**
   * Find differences between two objects
   */
  findDifferences(obj1, obj2) {
    const diffs = [];
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of allKeys) {
      if (obj1[key] !== obj2[key]) {
        diffs.push({
          parameter: key,
          oldValue: obj1[key],
          newValue: obj2[key]
        });
      }
    }

    return diffs;
  }

  /**
   * Clean old backups (keep only N most recent)
   */
  cleanOldBackups(keepCount = 10, filters = {}) {
    const backups = this.listBackups(filters);
    
    if (backups.length <= keepCount) {
      return { success: true, deleted: 0 };
    }

    const toDelete = backups.slice(keepCount);
    let deleted = 0;

    for (const backup of toDelete) {
      // Only delete auto backups, not manual ones
      if (backup.backupType === 'auto-pre-modification') {
        this.deleteBackup(backup.id);
        deleted++;
      }
    }

    return { success: true, deleted };
  }
}

module.exports = BackupRestore;
