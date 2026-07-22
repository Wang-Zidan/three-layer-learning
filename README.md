# 三层学习法 · 交互式知识探索网站

> 当前进度：**Phase 0 → 5 + 上传资料功能已完成**（界面、AI 生成图谱、真实对话、真实卡片、本地持久化、手机端响应式、导入/导出备份、多学科历史、**上传资料生成图谱**）。

## 怎么跑起来

### 第一步：确认 npm 能用

在 Trae 的终端（项目根目录 `three-layer-learning`）里输入：

```powershell
npm -v
```

- 如果显示版本号（比如 `10.x.x`），说明你只是刚才命令打错了，请用：
  ```powershell
  npm run dev
  ```
- 如果显示 **"无法加载文件 D:\app\npm.ps1，因为在此系统上禁止运行脚本"**，这是 Windows PowerShell 的**执行策略**限制，见下方「PowerShell 报执行策略错误怎么办」。
- 如果显示"无法将 npm 识别为命令"，说明当前终端 PATH 里找不到 npm，见下方「当前终端找不到 npm 怎么办」。

### PowerShell 报执行策略错误怎么办（最常见）

Windows 默认不允许 PowerShell 直接运行 `.ps1` 脚本，所以 `npm run dev` 会去调 `npm.ps1`，然后被系统拒绝。

**最快解决方式：改用 CMD 跑**

在 PowerShell 终端里输入：

```powershell
cmd /c npm run dev
```

这样 npm 会走 `npm.cmd` 而不是被禁用的 `npm.ps1`，一般立刻就能跑起来。

**次快方式：用 PowerShell 调用运算符**

如果你非要用纯 PowerShell 命令，输入：

```powershell
& "D:\app\npm.cmd" run dev
```

注意前面的 `&` 和后面的空格不能少，这是告诉 PowerShell"把这个路径当命令执行"。

**一劳永逸方式：修改执行策略**

在 PowerShell 终端输入：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

按 `Y` 确认。这样当前用户就能运行本地脚本了，之后直接 `npm run dev` 即可。

### 当前终端找不到 npm 怎么办

如果 `npm -v` 报"无法识别"，说明 PATH 没包含 Node。你机器上有两套可用 npm，任选其一：

```powershell
cmd /c "D:\app\npm.cmd" run dev
```

或

```powershell
cmd /c "C:\Users\王子丹真人\.workbuddy\binaries\node\versions\22.22.2\npm.cmd" run dev
```

### 给 Trae Agent 用的命令

让 Trae Agent 直接执行：

```powershell
cmd /c npm run dev
```

## 一次性解决方案：把 npm 加到系统 PATH

每次都输绝对路径很麻烦，建议把 Node 路径加进环境变量：

1. 按 `Win + S` 搜索"编辑系统环境变量"，打开。
2. 点"环境变量"。
3. 在"用户变量"里找到 `Path`，双击编辑。
4. 点"新建"，加入：`D:\app`
5. 一路点"确定"，**重启 Trae**。
6. 重启后终端输入 `npm -v` 应该能显示版本，以后直接 `npm run dev` 即可。

> 注意：即使 PATH 加好了，如果 PowerShell 执行策略仍是 Restricted，第一次还是要执行 `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`。

## 使用流程

1. 启动后看到首页，先点右上角 **「⚙ 设置」**。
2. 填入你的阿里云百炼 API Key（base_url 和 model 已有默认值，一般不用改）。
3. 保存后回到首页，输入学科名（如"金融风控"），点「生成知识地图」。
   - **（可选）上传资料**：点「📎 上传资料」展开后，可粘贴文本或上传 `.txt` / `.pdf` / `.docx` / `.pptx` 文件。上传后 AI 会**基于你的资料**生成图谱，而非凭空编造——适合期末复习上传老师 PPT、上传教材某章生成知识地图。
4. AI 生成三层图谱后：
   - 左侧力导向图，**节点大小=层级、颜色=掌握状态**（灰=未学、蓝=学习中、绿=已掌握）。
   - 点击**非叶子节点** → 右侧打开 AI 对话（引擎层），可自由追问，带上下文。
   - 点击**叶子节点** → 右侧自动生成知识卡片（像素层）：定义 / 关键公式 / 经典案例 / 推荐资源。
  - 底部状态按钮可标记「未学 / 学习中 / 已掌握」，图谱节点颜色实时变化。
  - 卡片下方「我的笔记」可记笔记。
5. **手机端（响应式）**：窗口宽度 < 768px（如手机）时，点节点后右侧面板会变为**全屏覆盖**，顶部有「← 返回图谱」按钮，点它回到图谱；桌面端仍是左右分栏。
6. **备份与迁移**：点「⚙ 设置」→ 底部「导出备份」下载一个 JSON 文件；换设备 / 清缓存前先导出，之后在该设备「导入备份」选这个文件即可恢复所有学科和 API 设置。

## 数据存在哪里（Phase 4 + 多学科学科历史）

所有学习数据**自动保存在浏览器 localStorage**，刷新页面、关掉重开都还在，且**支持多门学科并存**——想学现代管理学又想学金融风控，两门课的数据各自独立保存，互不覆盖。

- 多学科学科集合：所有学科存在 `tll_v1_subjects` 里（每门含图谱 / 进度 / 对话 / 卡片 / 笔记 / 展开状态），`tll_v1_current` 记录当前打开的是哪一门。
- 首页「学习历史」列出所有学科，点「打开」即恢复该学科的全部数据；点「删除」才真正清除（有二次确认弹窗）。
- 图谱视图顶部「返回首页」只是退到首页看历史 / 新建，**不会清空任何学科数据**。
- 保存位置：浏览器本地（按域名隔离）。**清除浏览器数据 / 换设备 / 换浏览器都会清空**，这是纯前端方案的已知限制，但已通过「设置 → 导出备份 / 导入备份」解决（详见下方「怎么备份与迁移」）。
- localStorage key 前缀统一为 `tll_v1_*`。
- 损坏的旧数据会在启动时自动丢弃并回到首页，不会导致白屏。
- 旧版（Phase 4）的单份数据会在首次启动时自动迁移为第一个学科，不会丢失。

### 怎么备份与迁移（导入 / 导出）

纯前端方案数据只存在当前浏览器，换设备 / 清缓存会丢。解决办法：

- **导出**：「⚙ 设置」→ 底部「导出备份」，下载 `three-layer-learning-backup-时间戳.json`，包含全部学科数据 + API 设置。
- **导入**：「⚙ 设置」→「导入备份」，选择导出的 JSON 文件。导入会与现有学科**合并**（同名学科覆盖、新学科新增），导入成功后自动跳转到备份中的学科，并恢复其中的 API 设置。
- 备份文件就是普通 JSON，可存到网盘 / U 盘，作为换设备或防丢失的手段。

## 项目结构

- `src/App.jsx`：主布局 + 首页/图谱视图切换 + AI 生成调用 + 持久化
- `src/components/GraphView.jsx`：力导向图谱渲染
- `src/components/ChatPanel.jsx`：非叶子节点的 AI 对话（Phase 2，真实调模型）
- `src/components/CardPanel.jsx`：叶子节点的知识卡片（Phase 3，真实生成 + 笔记）
- `src/components/SidePanel.jsx`：右侧面板容器，按节点类型分流
- `src/components/LandingPage.jsx`：首页搜索生成界面
- `src/components/SettingsModal.jsx`：API Key / Base / Model 配置弹窗
- `src/services/llm.js`：统一 AI 调用封装（OpenAI 兼容）
- `src/services/storage.js`：localStorage 设置读写 + 多学科学业数据持久化（含旧数据迁移）
- `src/services/fileParser.js`：文件解析服务（txt / pdf / docx / pptx → 纯文本）
- `src/prompts.js`：三套冻结的系统提示词（生成图谱 / 对话 / 卡片）+ 带参考资料的图谱提示词
- `src/utils/graphValidator.js`：AI 返回图谱 JSON 的校验器
- `src/data/mockGraph.js`：演示用三层图谱数据（Phase 0 遗留，可删）
- `src/constants.js`：冻结的色值、状态、节点半径常量

## 已知限制

- 纯前端方案，无自动跨设备同步；但通过「导出 / 导入备份」可手动迁移（见上）。
- **多人共用时需各自带 API Key**：数据存各人浏览器 localStorage，每个体验者需在自己浏览器的「⚙ 设置」里填自己的 阿里云百炼 Key 才能生成图谱/对话/卡片。内测时请提前告知体验者这一点。
- **上传资料的限制**：扫描版 PDF（图片型）无法提取文字；资料超过 8000 字会自动截断（避免超出模型上下文限制）；PPT 解析提取的是文字内容，不保留排版和图片。

## 代码备份（Git）

项目已初始化 Git 仓库，本地有完整提交历史。推送到 GitHub 远程备份的步骤：
1. 在 github.com 注册账号（如已有跳过）。
2. 新建一个仓库（如 `three-layer-learning`），**不要勾选** README / .gitignore / license（本地已有）。
3. 在项目根目录终端执行（替换成你的仓库地址）：
   ```powershell
   git remote add origin https://github.com/你的用户名/three-layer-learning.git
   git push -u origin master
   ```
4. 之后每次改完代码，`git add -A && git commit -m "说明"` 再 `git push` 即可备份。

## 部署上线（让他人也能打开）

本项目是纯静态网站（构建产物在 `dist/`）。部署 = 把 `dist/` 挂到静态托管平台，拿到一个 `https://` 网址。

- **当前内测网址**（2026-07-21 部署，CloudStudio 沙箱，仅供社群内测、不被搜索引擎收录）：
  `https://78ad2ff5abd444f9a599bdf7b946bfc0.app.codebuddy.work`
- 想迁到自己名下（如 Cloudflare Pages / Vercel）：在本地 `npm run build` 生成最新 `dist/`，然后到对应平台网页拖拽上传 `dist/` 文件夹即可，无需下载软件。
- 部署时建议关闭搜索引擎收录（平台设置里勾选"不索引"），符合"社群内测、不公开"的策略。
