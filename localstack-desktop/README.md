# LocalStack Manager Desktop

> **Native Desktop Application** by CloudStack Solutions

A cross-platform Electron desktop application for managing LocalStack resources with a native user experience.

![Electron](https://img.shields.io/badge/Electron-Desktop%20App-blue?style=for-the-badge&logo=electron)
![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- LocalStack running (see main project README)
- LocalStack Manager API server running

### Installation & Launch

1. **Install Dependencies**

   ```bash
   cd localstack-desktop
   npm install
   ```

2. **Start the Application**

   ```bash
   npm start
   ```

3. **Development Mode** (with DevTools)
   ```bash
   npm run dev
   ```

## 🎯 Features

### Native Desktop Experience

- **Cross-platform**: Windows, macOS, Linux
- **System Tray**: Background operation with quick access
- **Native Window**: Professional desktop application
- **Offline Capability**: Works without internet connection

### Professional Interface

- **CloudStack Branding**: Enterprise design throughout
- **Real-time Updates**: Live status and resource monitoring
- **Resource Management**: Create/destroy AWS resources
- **Log Viewer**: Real-time log monitoring with filtering

### Enterprise Features

- **Secure**: No sensitive data exposure
- **Network Ready**: Accessible across development team
- **Professional UI**: Enterprise-grade interface design
- **Configuration Management**: Project and environment settings

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   Main Process  │    │      Renderer Process       │ │
│  │                 │    │                             │ │
│  │ • Window Mgmt   │◄──►│ • Next.js Web App          │ │
│  │ • System Tray   │    │ • React Components         │ │
│  │ • Native APIs   │    │ • Real-time Updates        │ │
│  │ • Security      │    │ • Resource Management      │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Express API    │
                    │   (Port 3001)   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   LocalStack    │
                    │   (Port 4566)   │
                    └─────────────────┘
```

## 🛠️ Development

### Project Structure

```
localstack-desktop/
├── 📄 main.js              # Electron main process
├── 📄 package.json         # Dependencies and scripts
├── 📄 README.md            # This file
└── 📁 assets/              # Application assets
    ├── 📄 icon.png         # Application icon
    └── 📄 tray-icon.png    # System tray icon
```

### Scripts

| Script          | Description                    |
| --------------- | ------------------------------ |
| `npm start`     | Launch the desktop application |
| `npm run dev`   | Launch with DevTools open      |
| `npm run build` | Build the application          |
| `npm run dist`  | Create distributable packages  |

### Configuration

#### Main Process (main.js)

- **Window Management**: Size, position, and behavior
- **System Tray**: Background operation and quick access
- **Security**: Content security policies
- **Native Integration**: Platform-specific features

#### Development Mode

```bash
# Start with development features
npm run dev

# This will:
# - Open DevTools automatically
# - Enable hot reloading
# - Show detailed error messages
```

## 🔧 Configuration

### Environment Variables

```bash
# Development mode
NODE_ENV=development

# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3031

# LocalStack endpoint
LOCALSTACK_ENDPOINT=http://localhost:4566
```

### Application Settings

- **Window Size**: 1400x900 (minimum 1200x800)
- **Title**: "LocalStack Manager - CloudStack Solutions"
- **Icon**: Custom CloudStack Solutions logo
- **Tray**: System tray with context menu

## 🚀 Building & Distribution

### Prerequisites

```bash
npm install -g electron-builder
```

### Build Commands

```bash
# Build for current platform
npm run build

# Build for all platforms
npm run dist

# Build for specific platform
npm run dist:mac
npm run dist:win
npm run dist:linux
```

### Distribution Options

- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` and `.deb` packages

## 🔒 Security

### Content Security Policy

- **Node Integration**: Disabled for security
- **Context Isolation**: Enabled
- **Remote Content**: Restricted to trusted sources
- **File Access**: Limited to application directory

### Best Practices

- No sensitive data in logs
- Secure API communication
- Regular security updates
- Sandboxed renderer process

## 🐛 Troubleshooting

### Common Issues

**Application won't start**

```bash
# Check Node.js version
node --version  # Should be 18+

# Check dependencies
npm install

# Check API server
curl http://localhost:3031/health
```

**System tray not working**

- **macOS**: Check notification permissions
- **Windows**: Check system tray settings
- **Linux**: Check desktop environment support

**Window not displaying**

```bash
# Check if port is in use
lsof -i :3030

# Check API server
curl http://localhost:3031/health
```

### Debug Mode

```bash
# Start with debug logging
DEBUG=* npm start

# Check main process logs
# Check renderer process in DevTools
```

## 📊 Performance

### Optimization

- **Lazy Loading**: Components loaded on demand
- **Memory Management**: Automatic cleanup
- **Background Processes**: Efficient system tray operation
- **Network Requests**: Optimized API calls

### Monitoring

- **Memory Usage**: Built-in monitoring
- **CPU Usage**: Process monitoring
- **Network**: API call tracking
- **Errors**: Comprehensive error logging

## 🔄 Updates

### Auto-update (Future Feature)

- **macOS**: Sparkle framework
- **Windows**: Squirrel.Windows
- **Linux**: AppImage updates

### Manual Updates

1. Download new version
2. Replace application files
3. Restart application

## 📚 Integration

### API Server

The desktop app requires the LocalStack Manager API server:

```bash
cd ../localstack-api
npm start
```

### LocalStack

LocalStack must be running:

```bash
docker-compose up -d
```

### Web GUI Alternative

If you prefer web interface:

```bash
cd ../localstack-gui
npm run dev
```

## 🎨 Customization

### Branding

- **Logo**: Replace `assets/icon.png`
- **Colors**: Update CSS variables
- **Title**: Modify `main.js` window title

### Features

- **Tray Menu**: Customize in `main.js`
- **Window Behavior**: Modify window options
- **Security**: Adjust CSP settings

## 📄 License

**LocalStack Manager Desktop** by CloudStack Solutions

- **License**: MIT
- **Copyright**: © 2024 CloudStack Solutions
- **Electron**: Apache 2.0 License

## 🆘 Support

### Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [CloudStack Solutions](https://cloudstacksolutions.com/)

### Community

- GitHub Issues for bug reports
- Feature requests welcome
- Documentation improvements

### Enterprise

- Professional support available
- Custom development services
- Training and consulting

---

**Built with ❤️ by CloudStack Solutions**

_Enterprise AWS Development Tools_
