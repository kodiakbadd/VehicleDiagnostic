/**
 * ISO-TP (ISO 15765-2) Transport Protocol
 * Implements CAN Transport Protocol for multi-frame messaging
 */

class ISOTP {
  constructor() {
    this.frameTypes = {
      SINGLE: 0x00,
      FIRST: 0x10,
      CONSECUTIVE: 0x20,
      FLOW_CONTROL: 0x30
    };
    
    this.flowStatus = {
      CONTINUE: 0x00,
      WAIT: 0x01,
      OVERFLOW: 0x02
    };

    this.maxDataLength = 4095; // Max data length for ISO-TP
    this.blockSize = 0; // 0 = no blocking
    this.separationTime = 0; // Minimum separation time in ms
  }

  /**
   * Encode data into ISO-TP frames
   */
  encode(data, canId) {
    const dataBytes = this.hexToBytes(data);
    const frames = [];

    // Single frame (data length <= 7 bytes)
    if (dataBytes.length <= 7) {
      const frame = [
        (this.frameTypes.SINGLE | dataBytes.length),
        ...dataBytes,
        ...Array(7 - dataBytes.length).fill(0x00) // Padding
      ];
      frames.push({
        type: 'single',
        canId,
        data: this.bytesToHex(frame)
      });
    } else {
      // Multi-frame transmission
      
      // First frame
      const firstFrameData = dataBytes.slice(0, 6);
      const dataLength = dataBytes.length;
      const firstFrame = [
        (this.frameTypes.FIRST | ((dataLength >> 8) & 0x0F)),
        dataLength & 0xFF,
        ...firstFrameData
      ];
      frames.push({
        type: 'first',
        canId,
        data: this.bytesToHex(firstFrame),
        totalLength: dataLength
      });

      // Consecutive frames
      let sequenceNumber = 1;
      let offset = 6;
      
      while (offset < dataBytes.length) {
        const chunk = dataBytes.slice(offset, offset + 7);
        const consecutiveFrame = [
          (this.frameTypes.CONSECUTIVE | (sequenceNumber & 0x0F)),
          ...chunk,
          ...Array(7 - chunk.length).fill(0x00) // Padding
        ];
        
        frames.push({
          type: 'consecutive',
          canId,
          data: this.bytesToHex(consecutiveFrame),
          sequenceNumber
        });

        sequenceNumber = (sequenceNumber + 1) & 0x0F;
        offset += 7;
      }
    }

    return frames;
  }

  /**
   * Decode ISO-TP frames
   */
  decode(frames) {
    if (frames.length === 0) {
      return null;
    }

    const firstFrame = this.hexToBytes(frames[0]);
    const frameType = (firstFrame[0] >> 4) & 0x0F;

    // Single frame
    if (frameType === 0x00) {
      const length = firstFrame[0] & 0x0F;
      return this.bytesToHex(firstFrame.slice(1, 1 + length));
    }

    // Multi-frame
    if (frameType === 0x01) {
      const dataLength = ((firstFrame[0] & 0x0F) << 8) | firstFrame[1];
      let data = firstFrame.slice(2);

      // Process consecutive frames
      for (let i = 1; i < frames.length; i++) {
        const frame = this.hexToBytes(frames[i]);
        const consecutiveType = (frame[0] >> 4) & 0x0F;
        
        if (consecutiveType === 0x02) {
          data = [...data, ...frame.slice(1)];
        }
      }

      return this.bytesToHex(data.slice(0, dataLength));
    }

    return null;
  }

  /**
   * Generate flow control frame
   */
  generateFlowControl(status = this.flowStatus.CONTINUE, blockSize = 0, separationTime = 0) {
    return this.bytesToHex([
      (this.frameTypes.FLOW_CONTROL | status),
      blockSize,
      separationTime
    ]);
  }

  /**
   * Parse flow control frame
   */
  parseFlowControl(frame) {
    const bytes = this.hexToBytes(frame);
    
    return {
      status: bytes[0] & 0x0F,
      blockSize: bytes[1],
      separationTime: bytes[2]
    };
  }

  /**
   * Calculate timing for consecutive frames
   */
  calculateSeparationTime(stMin) {
    if (stMin <= 0x7F) {
      return stMin; // Milliseconds
    } else if (stMin >= 0xF1 && stMin <= 0xF9) {
      return (stMin - 0xF0) / 10; // Microseconds (0.1 - 0.9 ms)
    }
    return 0;
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

module.exports = ISOTP;
