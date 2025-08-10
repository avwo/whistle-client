# Whistle 客户端

中文 · [English](./README-en_US.md)

[Whistle](https://github.com/avwo/whistle) 是一款功能强大的跨平台网络抓包调试工具，本客户端为官方桌面版本，支持以下操作系统：
1. macOS
2. Windows
3. Linux (Fedora/Ubuntu)

> 如果您使用的系统不支持 Whistle Client（如无图形界面的服务器或特殊设备），可以用 Whistle：https://github.com/avwo/whistle

# 安装
请根据你的操作系统选择对应的安装步骤。

<details>
  <summary>macOS</summary>

##### 1. 选择正确的安装包

根据你的 Mac 处理器类型选择对应版本：
- Apple Silicon 芯片 (M1/M2/M3系列) → 下载 ARM 64位版本：[Whistle-vx.y.z-mac-arm64.dmg](https://github.com/avwo/whistle-client/releases) 
- Intel/AMD 芯片 → 下载 x86_64 版本：[Whistle-vx.y.z-mac-x64.dmg](https://github.com/avwo/whistle-client/releases) 

##### 2. 安装步骤

1. 下载完成后，双击下载的 `.dmg` 文件
2. 将 Whistle 图标拖拽至 Applications 文件夹
   
   <img width="520" alt="install mac client" src="https://github.com/user-attachments/assets/ef60276a-520c-4f4c-8612-10bdac2df30a" />
3. 如遇以下情况：
   - 提示 "应用已存在" → 选择 "覆盖"
   - 无法覆盖 → 请先退出正在运行的 Whistle 客户端

##### 3. 安全提示

某些企业安全软件可能误报，建议：
- 首次运行时选择 "允许" 操作
- 如有持续拦截，请联系IT部门将 Whistle 加入白名单
</details>

<details>
  <summary>Windows</summary>

##### 1. 下载安装包

根据你的权限需求选择适合的版本：

- 【推荐】标准版（需管理员权限）：[Whistle-vx.y.z-win-x64.exe](https://github.com/avwo/whistle-client/releases)
    > 支持完整功能，包括伪协议 (whistle://client)
- 用户版（无需管理员权限）：[Whistle-user-installer-vx.y.z-win-x64.exe](https://github.com/avwo/whistle-client/releases)
    > 功能限制：不支持伪协议调用

##### 2. 运行安装程序

双击下载的安装包后，你可能会看到以下安全提示，请按顺序操作：

1. 用户账户控制提示 → 点击 "是" 继续安装

   <img width="360" alt="image" src="https://github.com/avwo/whistle/assets/11450939/1b496557-6d3e-4966-a8a4-bd16ed643e28">
2. 安装向导界面 → 按照提示逐步完成
</details>

<details>
  <summary>Linux（Fedora/Ubuntu）</summary>
本客户端目前支持 Fedora 和 Ubuntu 两个 Linux 发行版。

下载安装包：
- Intel/AMD 64位（x86_64）：[Whistle-vx.y.z-linux-x86_64.AppImage](https://github.com/avwo/whistle-client/releases) 
- ARM 64位（arm64）：[Whistle-vx.y.z-linux-arm64.AppImage](https://github.com/avwo/whistle-client/releases) 

安装方法参考：https://zhuanlan.zhihu.com/p/517734580
</details>

# 用法

### 启动客户端
安装完成后，请通过以下方式启动：
1. 点击桌面上的 Whistle 图标
2. 或通过系统应用程序菜单找到 Whistle

启动后，请按以下步骤完成必要的初始设置（首次运行时必做）：
1. 打开客户端顶部 `Whistle` 菜单项
2. 点击 `Install Root CA`：安装系统根证书，用于解析 HTTPS 请求
3. 开启 `Set As System Proxy`：设置系统代理，用于捕获系统的 Web 请求

### 顶部菜单

<img width="277" alt="Image" src="https://github.com/user-attachments/assets/ae22a3c9-ecda-4643-a4d5-de5c7173a828" />

1. `Proxy Settings`：见下方 Proxy Settings
2. `Install Root CA`：安装根证书
3. `Check Update`：查看是否有新版本
4. `Set As System Proxy`：设置系统代理
5. `Start At Login`：是否开机自动启动 Whistle 客户端
6. `Restart`：重启客户端
7. `Quit`：退出客户端

### Proxy Settings

<img width="460" alt="Proxy Settings" src="https://github.com/user-attachments/assets/0ca0f123-96ff-41d7-8acf-7b3468d92605">

1. `Proxy Port`：必填项，代理端口，默认为 `8888`
2. `Socks Port`：新增 Socksv5 代理端口
3. `Bound Host`：指定监听的网卡
4. `Proxy Auth`：设置用户名和密码对经过代理的请求进行鉴权
5. `Bypass List`：不代理的白名单域名，支持以下三种格式：
   - IP：`127.0.0.1`
   - 域名：`www.test.com`
   - 通配符：`*.test.com`（这包含 `test.com` 的所有子代域名）
6. `Use whistle's default storage directory`：存储是否切回命令行版本的目录，这样可以保留之前的配置数据（勾选后要停掉命令行版本，否则配置可能相互覆盖）

### 安装插件

1. 点击左侧导航栏的 Plugins 标签页
2. 点击顶部的 Install 按钮
3. 在弹出窗口中输入插件名称（支持同时安装多个插件）：
   - 多个插件用空格或换行符分隔
   - 可指定自定义 npm 镜像源：
     - 直接在插件名后添加 --registry=镜像地址
     - 或从下拉列表选择历史使用过的镜像源

<img width="1000" alt="install plugins" src="https://github.com/user-attachments/assets/53bfc7b1-81a8-4cdb-b874-c0f9ab58b65a" />

**示例**（安装两个插件并使用国内镜像源）：

``` txt
w2 install --registry=https://registry.npmmirror.com whistle.script whistle.inspect
```

### 其他功能

Whistle 功能详见：https://wproxy.org/docs/getting-started.html

# 常见问题

#### 1. 启用客户端设置系统代理，部分应用（如 Outlook、Word 等）可能出现网络连接异常
查看抓包界面是否有如下的 `captureError` 异常请求：

<img width="900" alt="captureError" src="https://github.com/avwo/whistle/assets/11450939/513ab963-a1a3-447a-ba84-147273451f78">

将出现此类异常的域名配置到 `Proxy Settings` 的 `Bypass List` 规则里面：

<img width="460" alt="Bypass List" src="https://github.com/user-attachments/assets/e0250e69-4fe5-4b6f-8638-6e64fdc306c7" />

#### 2. 如何更新客户端？
- 检查新版本：点击左上角 Whistle 菜单 → Check Update → 按照提示完成更新
- 手动下载更新：访问 [GitHub Releases](https://github.com/avwo/whistle-client/releases) 下载最新版本，按上面的文档重新安装

#### 3. 如何同步之前的数据？
Whistle 客户端默认使用独立的存储目录，如果要继续用命令行版本的目录，可以通过  `Proxy Settings` 的 `Use whistle's default storage directory` 切回命令行的默认目录：

<img width="470" alt="image" src="https://github.com/user-attachments/assets/ef6805d0-e05e-48bf-adbc-88677fd22b0c" />

> 注意：请确保同一时间只有一个 Whistle 实例访问该目录，多实例同时运行会造成配置冲突和数据覆盖！

# License
[MIT](./LICENSE)
