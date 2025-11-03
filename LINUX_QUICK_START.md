# Quick Linux Installation Summary

## 🐧 TL;DR - Install VWConnApp on Linux

### One-Line Install (from source):

```bash
git clone https://github.com/kodiakbadd/VehicleDiagnostic.git && cd VehicleDiagnostic && npm install && npm run build:linux
```

---

## Three Ways to Run on Linux:

### 1️⃣ **AppImage (Recommended - Universal)** ✅
```bash
# No installation needed, runs anywhere
chmod +x VWConnApp-0.0.1.AppImage
./VWConnApp-0.0.1.AppImage
```
**Pros:** Works on any Linux distro, no root needed, portable  
**Cons:** Slightly larger file size

---

### 2️⃣ **Debian/Ubuntu Package (.deb)**
```bash
sudo dpkg -i VWConnApp_0.0.1_amd64.deb
vwconnapp
```
**Pros:** Integrates with system, appears in app menu  
**Cons:** Requires root

---

### 3️⃣ **Fedora/RHEL Package (.rpm)**
```bash
sudo dnf install VWConnApp-0.0.1.x86_64.rpm
vwconnapp
```
**Pros:** Native package manager integration  
**Cons:** Requires root

---

## Serial Port Setup (CRITICAL!)

```bash
# Add yourself to dialout group (one time)
sudo usermod -a -G dialout $USER

# Log out and back in, then verify
groups | grep dialout

# Your OBD-II adapter will show up as:
ls /dev/ttyUSB*    # Usually /dev/ttyUSB0
ls /dev/ttyACM*    # Or /dev/ttyACM0
```

**Without this, you'll get "Permission denied" errors!**

---

## Build Commands:

| Command | Output |
|---------|--------|
| `npm run build:linux` | All formats (AppImage, deb, rpm) |
| `npm run build:win` | Windows installer |
| `npm run build:mac` | macOS DMG |
| `npm start` | Development mode (no build) |

---

## Supported Distros:

✅ Ubuntu 22.04, 24.04  
✅ Debian 12+  
✅ Fedora 39+  
✅ Arch Linux  
✅ Linux Mint 21+  
✅ Pop!_OS 22.04+  
✅ Any modern distro with Node.js 20+

---

## Files You'll Get:

After `npm run build:linux`:

```
dist/
├── VWConnApp-0.0.1.AppImage          ← Universal (170 MB)
├── VWConnApp_0.0.1_amd64.deb        ← Ubuntu/Debian
├── VWConnApp-0.0.1.x86_64.rpm       ← Fedora/RHEL
└── linux-unpacked/                   ← Extracted files
```

---

## Full Documentation:

📖 **[LINUX_INSTALLATION.md](LINUX_INSTALLATION.md)** - Complete guide with troubleshooting

---

## Quick Test:

```bash
# After building
cd VehicleDiagnostic

# Make AppImage executable
chmod +x dist/VWConnApp-0.0.1.AppImage

# Run it
./dist/VWConnApp-0.0.1.AppImage

# Connect to /dev/ttyUSB0 and you're ready!
```

---

**That's it! Full ECU diagnostics on Linux in 5 minutes.** 🚗💨
