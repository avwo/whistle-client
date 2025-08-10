# Whistle Client

[中文](./README.md) · English

[Whistle](https://github.com/avwo/whistle) is a powerful cross-platform network packet capture and debugging tool. This client is the official desktop version and supports the following operating systems:
1. macOS
2. Windows
3. Linux (Fedora/Ubuntu)

> If the system you are using does not support the Whistle Client (such as a server without a graphical interface or a special device), you can use the Whistle: https://github.com/avwo/whistle

# Installation
Please select the corresponding installation steps according to your operating system.

<details>
  <summary>macOS</summary>

##### 1. Select the correct installation package

Select the corresponding version according to your Mac processor type:
- Apple Silicon chip (M1/M2/M3 series) → Download ARM 64-bit version: [Whistle-vx.y.z-mac-arm64.dmg](https://github.com/avwo/whistle-client/releases)
- Intel/AMD chip → Download x86_64 version: [Whistle-vx.y.z-mac-x64.dmg](https://github.com/avwo/whistle-client/releases)

##### 2. Installation steps

1. After downloading, double-click the downloaded `.dmg` file

2. Drag the Whistle icon to the Applications folder

    <img width="520" alt="install mac client" src="https://github.com/user-attachments/assets/ef60276a-520c-4f4c-8612-10bdac2df30a" />
3. If the following situations occur:

   - "Application already exists" → Select "Overwrite"

   - Unable to overwrite → Please exit the running Whistle client first

##### 3. Security Tips

Some enterprise security software may give false positives. Suggestions:

- Select "Allow" when running for the first time

- If there is continuous interception, please contact the IT department to add Whistle to the whitelist

</details>

<details>
  <summary>Windows</summary>

##### 1. Download the installation package

Choose the appropriate version according to your permission requirements:

- [Recommended] Standard Edition (Administrator permissions required): [Whistle-vx.y.z-win-x64.exe](https://github.com/avwo/whistle-client/releases)
    > Supports full functionality, including pseudo-protocols (whistle://client)
- User version (no administrator privileges required): [Whistle-user-installer-vx.y.z-win-x64.exe](https://github.com/avwo/whistle-client/releases)
    > Functional limitations: pseudo-protocol calls are not supported

##### 2. Run the installer

After double-clicking the downloaded installation package, you may see the following security prompts. Please follow the instructions in order:

1. User Account Control prompt → Click "Yes" to continue the installation

  <img width="360" alt="Image" src="https://github.com/user-attachments/assets/c4e78f37-13f3-4d39-bf22-9ee8645178a3" />
2. Installation wizard interface → Follow the prompts to complete step by step

</details>

<details>
  <summary>Linux (Fedora/Ubuntu)</summary>

This client currently supports two Linux distributions: Fedora and Ubuntu.

Download the installation package:
- Intel/AMD 64-bit (x86_64): [Whistle-vx.y.z-linux-x86_64.AppImage](https://github.com/avwo/whistle-client/releases)
- ARM 64-bit (arm64): [Whistle-vx.y.z-linux-arm64.AppImage](https://github.com/avwo/whistle-client/releases)

Installation method reference: https://itsfoss.com/cant-run-appimage-ubuntu/
</details>

# Usage

### Start the client
After installation, please start it in the following way:
1. Click the Whistle icon on the desktop
2. Or find Whistle through the system application menu

After starting, please follow the steps below to complete the necessary initial settings (must be done when running for the first time):
1. Open the `Whistle` menu item at the top of the client
2. Click `Install Root CA`: Install the system root certificate for parsing HTTPS Request
3. Enable `Set As System Proxy`: Set the system proxy to capture the system's web requests

### Top menu

<img width="277" alt="Image" src="https://github.com/user-attachments/assets/ae22a3c9-ecda-4643-a4d5-de5c7173a828" />

1. `Proxy Settings`: See Proxy Settings below
2. `Install Root CA`: Install the root certificate
3. `Check Update`: Check if there is a new version
4. `Set As System Proxy`: Set the system proxy
5. `Start At Login`: Whether to automatically start the Whistle client at startup
6. `Restart`: Restart the client
7. `Quit`: Exit the client

### Proxy Settings

<img width="460" alt="Proxy Settings" src="https://github.com/user-attachments/assets/0ca0f123-96ff-41d7-8acf-7b3468d92605">

1. `Proxy Port`: Required, proxy port, default is `8888`

2. `Socks Port`: Add Socksv5 proxy port

3. `Bound Host`: Specify the listening network card

4. `Proxy Auth`: Set the username and password to authenticate the request through the proxy

5. `Bypass List`: Whitelist domain name that is not proxied, supports the following three formats:

   - IP: `127.0.0.1`
   - Domain name: `www.test.com`
   - Wildcard: `*.test.com` (this includes all sub-domains of `test.com`)

6. `Use whistle's default storage directory`: The directory that stores whether to switch back to the command line version, so that the previous configuration data can be retained (after checking, the command line version must be stopped, otherwise the configuration may overwrite each other)

### Install plugins

1. Click the Plugins tab in the left navigation bar

2. Click the Install button at the top

3. Enter the plugin name in the pop-up window (supports installing multiple plugins at the same time):

   - Multiple plugins are separated by spaces or line breaks

   - Custom npm mirror sources can be specified:

     - Directly add --registry=mirror address after the plugin name

     - Or select a mirror source that has been used in the past from the drop-down list

<img width="1000" alt="install plugins" src="https://github.com/user-attachments/assets/53bfc7b1-81a8-4cdb-b874-c0f9ab58b65a" />

**Example**:

``` txt
w2 install whistle.script whistle.inspect
```

### Other functions

For more information about Whistle functions, please visit: https://wproxy.org/en/docs/getting-started.html

# FAQ

#### 1. Enable the client to set the system proxy. Some applications (such as Outlook, Word, etc.) may have network connection exceptions
Check whether there is the following `captureError` exception request in the packet capture interface:

<img width="900" alt="image" src="https://github.com/avwo/whistle/assets/11450939/513ab963-a1a3-447a-ba84-147273451f78">

Configure the domain name with such exceptions to the `Bypass List` rule of `Proxy Settings`:

<img width="460" alt="Bypass List" src="https://github.com/user-attachments/assets/e0250e69-4fe5-4b6f-8638-6e64fdc306c7" />

#### 2. How to update the client?

- Check for new versions: Click the Whistle menu in the upper left corner → Check Update → Follow the prompts to complete the update

- Manually download updates: Visit [GitHub Releases](https://github.com/avwo/whistle-client/releases) to download the latest version and reinstall according to the above document

#### 3. How to synchronize previous data?
By default, the Whistle client uses an independent storage directory. If you want to continue using the directory of the command line version, you can switch back to the default directory of the command line through `Use whistle's default storage directory` in `Proxy Settings`:

<img width="470" alt="image" src="https://github.com/user-attachments/assets/ef6805d0-e05e-48bf-adbc-88677fd22b0c" />

> Note: Only a single Whistle instance should access this directory simultaneously. Running multiple instances concurrently will lead to configuration conflicts and data corruption!

# License

[MIT](./LICENSE)
