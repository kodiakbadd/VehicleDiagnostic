# Build Instructions

## Building VWConnApp from Source

Since the compiled executables are excluded from the repository (they're too large for GitHub), you'll need to build the application yourself.

### Prerequisites

- Node.js >= 20
- npm or yarn
- Windows 10/11 (for Windows builds)

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

3. **Build the application:**
   ```bash
   npm run build
   ```

4. **Find your installer:**
   The Windows installer will be created at:
   ```
   dist/VWConnApp Setup 0.0.1.exe
   ```

### Development Mode

To run the application in development mode without building:

```bash
npm start
```

This will launch the Electron app directly from source.

### Build Output

The build process creates:
- `dist/VWConnApp Setup 0.0.1.exe` - Windows installer (NSIS)
- `dist/win-unpacked/` - Unpacked application folder
- `dist/builder-effective-config.yaml` - Build configuration

### Troubleshooting

**Native Module Issues:**
If you encounter issues with the `serialport` module:
```bash
npm rebuild @serialport/bindings-cpp --build-from-source
```

**Build Errors:**
Make sure you have the latest version of electron-builder:
```bash
npm install electron-builder@latest --save-dev
```

**Windows Code Signing:**
The build process attempts to sign the executable. If you don't have a code signing certificate, you can ignore the warnings.

### File Size Note

The built executable is approximately:
- Installer: ~86 MB
- Unpacked: ~201 MB

This is normal for Electron applications as they bundle Node.js and Chromium.

### GitHub Large File Storage (LFS)

If you want to store the built executables in your repository, consider using Git LFS:
```bash
git lfs install
git lfs track "dist/*.exe"
git add .gitattributes
```

However, for most use cases, building from source is recommended to ensure you have the latest version.
