# Whistle 客户端
Whistle 客户端是基于 [Whistle (命令行版本)](https://github.com/avwo/whistle) + [Electron](https://github.com/electron/electron) 开发的支持 Mac 和 Windows 的客户端，它不仅保留了命令行版本的除命令行以外的所有功能，且新增以下功能代替复杂的命令行操作，让用户使用门槛更低、操作更简单：

1. 无需安装 Node，客户端下载安装后即可使用
2. 打开客户端自动设置系统代理（可以通过下面的 `Proxy Settings` 关闭该功能，`v1.2.4` 版本开始默认不自动设置系统代理，需要通过 `Proxy Settings` 设置面板开启）
3. 通过界面手动开启或关闭系统代理（相当于命令行命令 `w2 proxy port` 或 `w2 proxy 0`）
4. 通过界面设置系统代理白名单（相当于命令行命令 `w2 proxy port -x domains`）
5. 通过界面修改代理的端口（客户端默认端口为 `8888`）
6. 通过界面新增或删除 Socks5 代理（相当于命令行启动时设置参数 `--socksPort`）
7. 通过界面指定监听的网卡地址（相当于命令行启动时设置参数 `-H`）
8. 通过界面设置代理的用户名和密码（相当于命令行启动时设置参数 `-n xxx -w yyy`）
9. 通过界面重启 Whistle
10. 通过界面安装 Whistle 插件

# 安装或更新

Whistle 客户端目前只支持 Mac 和 Windows 系统，如果需要在 Linux、 Docker、服务端等其它环境使用，可以用命令行版本：[https://github.com/avwo/whistle](https://github.com/avwo/whistle)。

安装和更新的方法是一样的，下面以安装过程为例：

#### Windows

1. 下载名为 [Whistle-v版本号-win-x64.exe](https://github.com/avwo/whistle-client/releases) 最新版本号的安装包
   > 没有管理员权限的用户可以下载 [Whistle-user-installer-v版本号-win-x64.exe](https://github.com/avwo/whistle-client/releases) 用户版本安装包，跟默认版本的区别是 **User Installer** 不支持伪协议（`whistle://client`）

2. 打开安装包可能会弹出以下对话框，点击 `是` 、`确定`、`允许访问` 按钮即可

   <img width="360" alt="image" src="https://github.com/avwo/whistle/assets/11450939/1b496557-6d3e-4966-a8a4-bd16ed643e28">

   <img width="500" alt="image" src="https://github.com/user-attachments/assets/57afaf41-3d5c-4d74-b0bf-415d4e2c1f27">

   <img width="500" alt="image" src="https://github.com/user-attachments/assets/8ca1f00f-2a8a-49f2-8d14-2118fe471137">

   <img src="https://github.com/avwo/whistle/assets/11450939/d44961bb-db5b-4ce3-ab02-56879f90f3b0" width="360" />

   <img width="300" alt="image" src="https://github.com/avwo/whistle/assets/11450939/7e415273-a88d-492d-80ca-1a83dfc389b6">

   > 一些公司的软件可能会把 Whistle.exe 以及里面让系统代理设置立即生效的 refresh.exe 文件误认为问题软件，直接点击允许放过即可，如果还有问题可以跟公司的安全同事沟通下给软件加白

#### Mac

Mac 有 Intel 和 M1 两种芯片类型，不同类型芯片需要下载不同的安装包，其中：

1. M1 Pro、M2 Pro 等 M1 芯片的机型下载名为 [Whistle-v版本号-mac-arm64.dmg](https://github.com/avwo/whistle-client/releases) 的最新版本号的安装包
2. 其它非 M1 芯片机型下载名为 [Whistle-v版本号-mac-x64.dmg](https://github.com/avwo/whistle-client/releases) 的最新版本号的安装包

下载成功点击开始安装（将 Whistle 图标拖拽到 Applications / 应用程序）：

<img width="420" alt="image" src="https://github.com/avwo/whistle/assets/11450939/6a6246e6-203f-4db4-9b74-29df6a9b96b6">

安装完成在桌面上及应用程序可以看到 Whistle 的图标：

<img width="263" alt="image" src="https://github.com/avwo/whistle/assets/11450939/3fb34e25-6d32-484f-a02a-f8b5022ef662">

点击桌边图标打开 Whistle，第一次打开时可能遇到系统弹窗，可以在“系统偏好设置”中，点按“安全性与隐私”，然后点按“通用”。点按锁形图标，并输入您的密码以进行更改。在“允许从以下位置下载的 App”标题下面选择“App Store”，或点按“通用”面板中的“仍要打开”按钮：

<img src="https://github.com/avwo/whistle/assets/11450939/a89910bd-d4d4-4ea2-9f18-5a1e44ce03a7" alt="image" width="600" />


> 打开客户端会自动设置系统代理，第一次可能需要用户输入开机密码

<img width="1080" alt="image" src="https://github.com/avwo/whistle/assets/11450939/d641af14-f933-4b8a-af45-8c69c648b799">

> 一些公司的软件可能会把客户端里面引用的设置代理的 whistle 文件误认为问题软件，直接点击允许放过即可，如果还有问题可以跟公司的安全同事沟通下给软件加白

# 基本用法

1. 顶部 `Whistle` 菜单
   - Proxy Settings
   - Install Root CA
   - Check Update
   - Set As System Proxy
   - Restart
   - Quit
2. 安装插件
3. 其它功能

## 顶部菜单

<img width="390" alt="image" src="https://github.com/avwo/whistle/assets/11450939/6de659d6-9f81-4ff2-89f1-504c785b55dd">

#### Proxy Settings

<img width="470" alt="image" src="https://github.com/avwo/whistle/assets/11450939/c7a54333-2daf-4231-9cd2-4c75ffa49be0">

1. `Proxy Port`：必填项，代理端口，默认为 `8888`
2. `Socks Port`：新增 Socksv5 代理端口
3. `Bound Host`：指定监听的网卡
4. `Proxy Auth`：设置用户名和密码对经过代理的请求进行鉴权
5. `Bypass List`：不代理的白名单域名，支持以下三种格式：
   - IP：`127.0.0.1`
   - 域名：`www.test.com`
   - 通配符：`*.test.com`（这包含 `test.com` 的所有子代域名）
6. `Use whistle's default storage directory`：存储是否切回命令行版本的目录，这样可以保留之前的配置数据（勾选后要停掉命令行版本，否则配置可能相互覆盖）
7. `Set system proxy at startup`：是否在启动时自动设置系统代理

#### Install Root CA

安装系统根证书，安装根证书后可能因为某些客户端不支持自定义证书导致请求失败，可以通过在  `Proxy Settings` 的 `Bypass List` 设置以下规则（空格或换行符分隔）：

``` txt
*.cdn-apple.com *.icloud.com .icloud.com.cn *.office.com *.office.com.cn *.office365.cn *.apple.com *.mzstatic.com *.tencent.com *.icloud.com.cn
```

如果还未完全解决问题，可以把抓包列表出现的以下有问题的请求域名填到  `Bypass List` ：

<img width="900" alt="image" src="https://github.com/avwo/whistle/assets/11450939/513ab963-a1a3-447a-ba84-147273451f78">

#### Check Update

点击查看是否有新版本，如果有最新版本建议立即升级。

#### Set As System Proxy

> 托盘图标右键也支持该功能

开启或关闭系统代理，如果想在客户端启动的时候是否自动设置系统代理需要通过 `Proxy Settings` 的 `Set system proxy at startup` 设置。

#### Restart

重启客户端。

#### Quit

退出客户端，退出客户端会自动关闭系统代理。

## 安装插件

打开界面左侧的 `Plugins` Tab，点击上方 `Install` 按钮，输入要安装插件的名称（多个插件用空格或换行符分隔），如果需要特殊的 npm registry 可以手动输入 `--registry=xxx` 或在对话框下方选择之前使用过的 npm registry。

<img width="1080" alt="image" src="https://github.com/avwo/whistle/assets/11450939/b60498fd-4d22-4cd9-93ff-96b8ed94c30b">

如输入：

``` txt
whistle.script whistle.vase --registry=https://registry.npmmirror.com
```

> 后面的版本会提供统一的插件列表页面，用户只需选择安装即可，无需手动输入插件包名

## 其他功能

除了上述功能，其它非命令行操作跟命令行版的 Whistle 一样，详见：https://github.com/avwo/whistle

# 常见问题
#### 1. 设置系统代理后，某些客户端（如：outlook、word 等）出现请求异常问题的原因及解决方法

在  `Proxy Settings` 的 `Bypass List` 设置以下规则：
``` txt
*.cdn-apple.com *.icloud.com .icloud.com.cn *.office.com *.office.com.cn *.office365.cn *.apple.com *.mzstatic.com *.tencent.com *.icloud.com.cn
```

如果还未完全解决，可以把抓包列表出现的以下有问题的请求域名填到  `Bypass List` ：

<img width="900" alt="image" src="https://github.com/avwo/whistle/assets/11450939/513ab963-a1a3-447a-ba84-147273451f78">

#### 2. 如何更新客户端？

​	打开左上角 Whistle 菜单 / Check Update 按钮，检查是否有最新版本，如果有按更新指引操作，或者直接访问 https://github.com/avwo/whistle-client/releases 下载系统相关的版本

#### 3. 如何同步之前的数据？
Whistle 客户端默认使用独立的目录，如果要复用之前命令行版本的目录，可以通过  `Proxy Settings` 的 `Use whistle's default storage directory` 切回命令行的默认目录：

<img width="360" alt="image" src="https://github.com/avwo/whistle/assets/11450939/5ac91087-f6d9-4ede-8ecd-aa753a8ebde5">



> 要确保同一目录只有一个实例，否则会导致配置相互覆盖

如果想让客户端保持独立的目录，也可以通过以下方式手动同步数据：

1. 手动同步 Rules：从老 Whistle / Rules / Export / ExportAll 导出规则后，再通过 Whistle 客户端 / Rules / Import 导入
2. 手动同步 Values：从老 Whistle / Values / Export / ExportAll 导出规则后，再通过 Whistle 客户端 / Values / Import 导入
3. 手动同步 Plugins：通过 Plugins：从老 Whistle / Plugins / ReinstallAll / Copy 按钮复制所有插件名称，再通过客户端 Plugins / Install / 粘贴 / Install 按钮安装

<img width="900" alt="image" src="https://github.com/avwo/whistle/assets/11450939/c3f49078-8820-470d-86bd-e98190a5b9e2">

# License
[MIT](./LICENSE)
