# VWConnApp - Linux Installation Guide

## 🐧 Installing VWConnApp on Linux

VWConnApp works great on Linux! Here's how to install and run it.

---

## Method 1: Build from Source (Recommended)

### Prerequisites

1. **Install Node.js 20+**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Fedora
   sudo dnf install nodejs
   
   # Arch Linux
   sudo pacman -S nodejs npm
   ```

2. **Install Build Dependencies**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y build-essential git python3
   
   # Fedora
   sudo dnf install gcc-c++ make git python3
   
   # Arch Linux
   sudo pacman -S base-devel git python
   ```

3. **Install Serial Port Permissions**
   ```bash
   # Add your user to the dialout group for serial port access
   sudo usermod -a -G dialout $USER
   
   # Log out and back in for group changes to take effect
   ```

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kodiakbadd/VehicleDiagnostic.git
   cd VehicleDiagnostic
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build for Linux:**
   ```bash
   npm run build:linux
   ```

4. **Install the package:**
   
   **For Ubuntu/Debian (.deb):**
   ```bash
   sudo dpkg -i dist/VWConnApp_0.0.1_amd64.deb
   # Or double-click the .deb file in your file manager
   ```
   
   **For Fedora/RHEL/CentOS (.rpm):**
   ```bash
   sudo rpm -i dist/VWConnApp-0.0.1.x86_64.rpm
   # Or use dnf/yum
   sudo dnf install dist/VWConnApp-0.0.1.x86_64.rpm
   ```
   
   **For Universal Linux (AppImage):**
   ```bash
   chmod +x dist/VWConnApp-0.0.1.AppImage
   ./dist/VWConnApp-0.0.1.AppImage
   ```

---

## Method 2: Run in Development Mode

If you just want to test without building:

```bash
git clone https://github.com/kodiakbadd/VehicleDiagnostic.git
cd VehicleDiagnostic
npm install
npm start
```

---

## Serial Port Configuration

### Finding Your OBD-II Adapter

1. **Plug in your OBD-II adapter**

2. **List available serial ports:**
   ```bash
   ls /dev/ttyUSB*
   ls /dev/ttyACM*
   
   # Or use dmesg to see device info
   dmesg | grep tty
   ```

3. **Common device names:**
   - USB adapters: `/dev/ttyUSB0`, `/dev/ttyUSB1`
   - ACM adapters: `/dev/ttyACM0`, `/dev/ttyACM1`
   - Bluetooth: `/dev/rfcomm0`

### Grant Permissions

If you get "Permission denied" errors:

```bash
# Temporary fix (until reboot)
sudo chmod 666 /dev/ttyUSB0

# Permanent fix (add user to dialout group)
sudo usermod -a -G dialout $USER
# Then log out and back in
```

### Verify Access

```bash
# Check group membership
groups

# Test serial port access
ls -l /dev/ttyUSB0
# Should show: crw-rw---- 1 root dialout
```

---

## Bluetooth OBD-II Adapters

For Bluetooth adapters (ELM327 Bluetooth):

1. **Pair the adapter:**
   ```bash
   bluetoothctl
   [bluetooth]# scan on
   [bluetooth]# pair XX:XX:XX:XX:XX:XX
   [bluetooth]# trust XX:XX:XX:XX:XX:XX
   [bluetooth]# exit
   ```

2. **Create serial connection:**
   ```bash
   sudo rfcomm bind 0 XX:XX:XX:XX:XX:XX 1
   ```

3. **Your device will be at:**
   ```
   /dev/rfcomm0
   ```

---

## Distribution-Specific Instructions

### Ubuntu 22.04 / 24.04

```bash
# Install dependencies
sudo apt update
sudo apt install -y nodejs npm git build-essential python3

# Clone and build
git clone https://github.com/kodiakbadd/VehicleDiagnostic.git
cd VehicleDiagnostic
npm install
npm run build:linux

# Install
sudo dpkg -i dist/VWConnApp_0.0.1_amd64.deb

# Run
vwconnapp
# Or find it in Applications menu
```

### Fedora 39+

```bash
# Install dependencies
sudo dnf install nodejs npm git gcc-c++ make python3

# Clone and build
git clone https://github.com/kodiakbadd/VehicleDiagnostic.git
cd VehicleDiagnostic
npm install
npm run build:linux

# Install
sudo dnf install dist/VWConnApp-0.0.1.x86_64.rpm

# Run
vwconnapp
```

### Arch Linux / Manjaro

```bash
# Install dependencies
sudo pacman -S nodejs npm git base-devel python

# Clone and build
git clone https://github.com/kodiakbadd/VehicleDiagnostic.git
cd VehicleDiagnostic
npm install
npm run build:linux

# Install AppImage (no root needed)
chmod +x dist/VWConnApp-0.0.1.AppImage
./dist/VWConnApp-0.0.1.AppImage

# Or create symlink
sudo ln -s $(pwd)/dist/VWConnApp-0.0.1.AppImage /usr/local/bin/vwconnapp
```

---

## Troubleshooting

### Serial Port Not Found

**Problem:** Can't see /dev/ttyUSB0 or /dev/ttyACM0

**Solution:**
```bash
# Check if USB-Serial drivers are loaded
lsmod | grep usbserial
lsmod | grep cdc_acm

# Install drivers if needed (Ubuntu/Debian)
sudo apt install linux-modules-extra-$(uname -r)

# Reload USB
sudo modprobe usbserial
sudo modprobe cdc_acm
```

### Permission Denied

**Problem:** "Error: Error: Permission denied, cannot open /dev/ttyUSB0"

**Solution:**
```bash
# Add user to dialout group
sudo usermod -a -G dialout $USER

# Apply changes (or log out/in)
newgrp dialout

# Verify
groups | grep dialout
```

### Native Module Build Errors

**Problem:** "Error compiling @serialport/bindings-cpp"

**Solution:**
```bash
# Install build tools
sudo apt install build-essential python3  # Ubuntu/Debian
sudo dnf install gcc-c++ make python3     # Fedora
sudo pacman -S base-devel python          # Arch

# Rebuild native modules
npm rebuild

# Or rebuild specific module
npm rebuild @serialport/bindings-cpp --build-from-source
```

### AppImage Won't Run

**Problem:** "cannot execute binary file"

**Solution:**
```bash
# Make it executable
chmod +x dist/VWConnApp-0.0.1.AppImage

# If using FUSE, install it
sudo apt install fuse libfuse2  # Ubuntu/Debian
sudo dnf install fuse fuse-libs # Fedora

# Extract and run without FUSE
./dist/VWConnApp-0.0.1.AppImage --appimage-extract
./squashfs-root/vwconnapp
```

### Blank Window / Display Issues

**Problem:** App opens but shows blank window

**Solution:**
```bash
# Try with software rendering
vwconnapp --disable-gpu

# Or run with Wayland support
vwconnapp --enable-features=UseOzonePlatform --ozone-platform=wayland
```

---

## Performance Optimization

### Using Hardware Acceleration

```bash
# Enable GPU acceleration (if available)
vwconnapp --enable-gpu-rasterization

# Check GPU status
vwconnapp --gpu-launcher
```

### Reduce Memory Usage

```bash
# Limit memory
vwconnapp --js-flags="--max-old-space-size=512"
```

---

## Uninstallation

### Ubuntu/Debian
```bash
sudo apt remove vwconnapp
```

### Fedora
```bash
sudo dnf remove VWConnApp
```

### AppImage
```bash
# Just delete the file
rm dist/VWConnApp-0.0.1.AppImage
```

---

## Building Different Formats

You can build specific package types:

```bash
# AppImage only (universal, no installation needed)
npx electron-builder --linux AppImage

# Debian package only
npx electron-builder --linux deb

# RPM package only
npx electron-builder --linux rpm

# Snap package
npx electron-builder --linux snap

# All formats
npm run build:linux
```

---

## System Requirements

**Minimum:**
- 64-bit Linux (x86_64 or ARM64)
- 2 GB RAM
- 500 MB disk space
- USB port for OBD-II adapter

**Recommended:**
- Modern Linux distribution (kernel 4.15+)
- 4 GB RAM
- 1 GB disk space
- OpenGL support for better performance

**Tested Distributions:**
- Ubuntu 22.04, 24.04
- Fedora 39, 40
- Arch Linux (latest)
- Debian 12
- Linux Mint 21
- Pop!_OS 22.04

---

## Next Steps

1. **Connect your OBD-II adapter** to your vehicle
2. **Launch VWConnApp** from your applications menu or terminal
3. **Select COM port** (e.g., /dev/ttyUSB0)
4. **Choose your vehicle** (VW Tiguan or Nissan Titan XD 2017)
5. **Start diagnostics!**

---

## Additional Resources

- **GitHub Repository:** https://github.com/kodiakbadd/VehicleDiagnostic
- **Issue Tracker:** https://github.com/kodiakbadd/VehicleDiagnostic/issues
- **Documentation:** See README.md in the repository

---

## Security Note

VWConnApp accesses vehicle ECUs directly. Always:
- ✅ Create backups before making changes
- ✅ Enable Safe Mode when not editing
- ✅ Understand what you're modifying
- ⚠️ Use at your own risk - modifications can void warranty

---

**Enjoy full ECU diagnostics on Linux!** 🐧🚗
