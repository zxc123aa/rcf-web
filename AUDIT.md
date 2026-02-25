# RCF-Web 项目审核文档

**项目**: RCF 叠层谱仪设计工具 Web 版
**位置**: `C:\Songtan\怀柔\RCF_G4\rcf-web\`
**审核日期**: 2026-02-25
**源项目**: `C:\Songtan\怀柔\RCF_G4\new_work_GUI_RCF\` (PyQt5 桌面版)
**构建者**: Claude Code (claude-opus-4-6)

---

## 0. 原项目说明

### 项目背景

原项目 `new_work_GUI_RCF/` 是一个 **RCF（辐射变色膜）叠层谱仪设计工具**，用于激光驱动质子/离子加速实验中的能谱测量系统设计。该工具基于 CSDA（连续减速近似）物理模型，计算不同能量的带电粒子穿过多层材料叠层时的能量沉积分布，从而确定每片 RCF 探测器的截止能量和响应函数。

### 原项目技术参数

| 指标 | 数值 |
|------|------|
| 技术栈 | Python 3 + PyQt5 + Matplotlib |
| Python 文件数 | 48 |
| 总代码行数 | 12,907 |
| 主入口文件 | `main.py` (2,304 行) |
| 作者 | Tan Song |

### 原项目功能模块

| 模块 | 位置 | 功能 |
|------|------|------|
| GUI 主界面 | `main.py` | PyQt5 窗口，叠层表格编辑，参数控制，Matplotlib 绑定绘图 |
| UI 定义 | `RCF.py` | Qt Designer 自动生成的界面布局 |
| 物理引擎 | `physics/` | 阻止本领计算（分段拟合 / Bethe-Bloch / PSTAR 插值）、CSDA 层输运、多离子支持 |
| 探测器模型 | `models/rcf_model.py` | RCF 探测器类，能量沉积记录与截止能量计算 |
| 计算线程 | `computation/` | QThread 子类：能量扫描 (`EnergyPKThread`)、线性设计优化 (`LinearDesignThread`) |
| 材料系统 | `utils/material_database.py` + `pstar_loader.py` | PSTAR 数据加载、材料注册、自定义材料导入 |
| 绘图 | `gui/plot_canvas.py` | Matplotlib 嵌入 PyQt5 的画布封装 |
| 主题 | `gui/themes.py` | 多套暗色主题（Electric Blue / Matrix Green 等），含闪电/粒子特效 |
| 数据 | `pstar_data/` | 21 个 NIST PSTAR 阻止本领 CSV 文件 |

### 原项目核心物理模型

- **CSDA 步进**: 粒子以 1μm 步长穿过材料，每步根据阻止本领 S/ρ (MeV·cm²/g) × 密度计算能量损失
- **阻止本领来源**: 内置分段拟合函数（Al/Cu/Cr/EBT/HD）、Bethe-Bloch 公式（含壳层修正）、PSTAR 表格插值
- **Bragg 峰判定**: EBT 探测器有效层 ≤ 29 层，HD 探测器有效层 ≤ 7 层
- **斜入射**: 通过 `path_factor = 1/cos(θ)` 缩放有效厚度
- **多离子**: 支持质子、氘核、α粒子、C12、N14、O16、Ne20、Si28、Ar40、Fe56
- **线性设计**: 暴力搜索最优 Al 滤片厚度，使各 RCF 截止能量等间距分布

### 迁移动机

桌面版功能完善但无法嵌入实验室网站。目标是将其迁移为 Web 应用，可作为独立模块嵌入实验室门户，保留全部物理计算精度。技术方案来自与 Gemini 3.1 Pro 的架构讨论，由 Claude Code 实施。

---

## 1. Web 版项目概览

将 PyQt5 桌面应用迁移为 FastAPI + Vue 3 Web 应用，保留全部物理计算精度，支持实验室内网部署和 iframe 嵌入。

| 指标 | 数值 |
|------|------|
| 总文件数 | 90 |
| 后端 Python 总行数 | 6,403 |
| 其中：物理引擎（零修改复制） | 4,322 |
| 其中：新编写代码（schemas/services/api/tests） | 1,329 |
| 前端 TS/Vue/CSS 总行数 | 1,444 |
| PSTAR 数据文件 | 21 个 CSV |
| Docker/Nginx 配置 | 4 文件 |

---

## 2. 技术栈

| 层 | 选型 | 版本要求 |
|---|---|---|
| 后端框架 | FastAPI + Uvicorn | >= 0.104 |
| 数据验证 | Pydantic v2 | >= 2.0 |
| 科学计算 | NumPy | >= 1.21 |
| 前端框架 | Vue 3 + TypeScript | ^3.4 |
| 构建工具 | Vite | ^5.1 |
| UI 库 | Element Plus | ^2.5 |
| 绘图 | Plotly.js | ^2.28 |
| 状态管理 | Pinia | ^2.1 |
| HTTP 客户端 | Axios | ^1.6 |
| 部署 | Docker Compose + Nginx | alpine |

---

## 3. 目录结构

```
rcf-web/
├── docker-compose.yml              # 容器编排
├── nginx/default.conf              # 反向代理配置
│
├── backend/                        # FastAPI 后端
│   ├── main.py                     # 应用入口 (56行)
│   ├── Dockerfile                  # 容器镜像
│   ├── requirements.txt            # Python 依赖
│   ├── config.py                   # 常量配置 (复制, 105行)
│   │
│   ├── physics/                    # 物理引擎 (零修改复制)
│   │   ├── stopping_power.py       # 分段拟合阻止本领 (530行)
│   │   ├── stopping_power_bethe.py # Bethe-Bloch 公式 (762行)
│   │   ├── stopping_power_pstar.py # PSTAR 插值 (100行)
│   │   ├── layer_physics.py        # CSDA 层输运 (1176行)
│   │   ├── ion.py                  # 多离子定义 (562行)
│   │   ├── material_registry.py    # 材料注册表 (219行)
│   │   └── pstar_parser.py         # CSV 解析 (80行)
│   │
│   ├── models/
│   │   └── rcf_model.py            # RCF 探测器类 (复制, 185行)
│   │
│   ├── schemas/                    # Pydantic 数据模型 (新建)
│   │   ├── stack.py                # StackLayer, MaterialInfo (16行)
│   │   └── compute.py              # 请求/响应模型 (57行)
│   │
│   ├── services/                   # 计算服务 (新建, 从 QThread 重构)
│   │   ├── energy_scan.py          # 能量扫描 (243行)
│   │   ├── linear_design.py        # 线性设计优化 (313行)
│   │   └── material_service.py     # 材料管理 (168行)
│   │
│   ├── api/                        # FastAPI 路由 (新建)
│   │   ├── compute.py              # 计算端点 (147行)
│   │   ├── materials.py            # 材料管理端点 (46行)
│   │   ├── stack.py                # 叠层配置端点 (75行)
│   │   └── websocket.py            # WebSocket 进度推送 (60行)
│   │
│   ├── tests/
│   │   └── test_api.py             # API 集成测试 (118行)
│   │
│   ├── utils/                      # 工具 (复制)
│   │   ├── material_database.py    # 材料数据库管理
│   │   └── pstar_parser.py         # PSTAR 文件解析
│   │
│   └── pstar_data/                 # 21 个 PSTAR CSV 数据文件
│
└── frontend/                       # Vue 3 前端
    ├── package.json                # 依赖配置
    ├── vite.config.ts              # Vite 构建 + 代理
    ├── tsconfig.json               # TypeScript 配置
    ├── Dockerfile                  # 多阶段构建
    ├── index.html                  # 入口 HTML
    │
    └── src/
        ├── main.ts                 # Vue 应用入口
        ├── App.vue                 # 根组件 (三栏布局 + Tab)
        │
        ├── types/index.ts          # TypeScript 接口定义 (91行)
        │
        ├── stores/                 # Pinia 状态管理
        │   ├── stack.ts            # 叠层数据 CRUD (54行)
        │   ├── compute.ts          # 计算结果 + 进度 (57行)
        │   └── settings.ts         # 全局设置 (23行)
        │
        ├── api/                    # Axios API 层
        │   ├── client.ts           # Axios 实例 (10行)
        │   ├── compute.ts          # 计算 API (28行)
        │   └── materials.ts        # 材料 API (34行)
        │
        ├── composables/            # 组合式函数
        │   ├── useComputation.ts   # 计算编排 + WebSocket (86行)
        │   └── useLocale.ts        # 中英文切换 (22行)
        │
        ├── components/             # Vue 组件 (15个)
        │   ├── AppHeader.vue       # 标题栏 + 主题/语言/导出 (86行)
        │   ├── ParamPanel.vue      # 参数面板容器 (28行)
        │   ├── EnergyRange.vue     # 能量范围输入 (30行)
        │   ├── AngleInput.vue      # 入射角度 + 路径因子 (25行)
        │   ├── IonSelector.vue     # 粒子类型选择 (20行)
        │   ├── StackToolbar.vue    # 叠层操作按钮 (25行)
        │   ├── StackTable.vue      # 叠层编辑表格 (65行)
        │   ├── MaterialButtons.vue # 材料添加按钮 (59行)
        │   ├── MaterialManager.vue # PSTAR 导入对话框 (69行)
        │   ├── EnergyCenterPlot.vue      # 截止能量图 (57行)
        │   ├── EnergyDepositionPlot.vue  # 能量沉积曲线 (57行)
        │   ├── ResponseMatrixHeatmap.vue # 响应矩阵热图 (53行)
        │   ├── LinearDesignPanel.vue     # 线性设计面板 (178行)
        │   └── ProgressOverlay.vue       # 计算进度遮罩 (39行)
        │
        ├── styles/
        │   ├── variables.css       # CSS 主题变量 (3套配色)
        │   └── global.css          # 全局样式 + Element Plus 暗色覆盖
        │
        └── locales/
            ├── zh-CN.ts            # 中文翻译
            └── en-US.ts            # 英文翻译
```

---

## 4. API 端点清单

| 方法 | 路径 | 功能 | 模式 |
|------|------|------|------|
| GET | `/api/v1/health` | 健康检查 | 同步 |
| POST | `/api/v1/compute/energy-scan` | 能量扫描 | 同步 |
| POST | `/api/v1/compute/energy-scan/async` | 能量扫描（异步） | 返回 task_id |
| POST | `/api/v1/compute/linear-design` | 线性设计 | 同步 |
| POST | `/api/v1/compute/linear-design/async` | 线性设计（异步） | 返回 task_id |
| WS | `/api/v1/ws/compute/{task_id}` | 计算进度推送 | WebSocket |
| GET | `/api/v1/materials/` | 列出全部材料 | 同步 |
| POST | `/api/v1/materials/upload-pstar` | 上传 PSTAR CSV | 同步 |
| POST | `/api/v1/materials/batch-load` | 批量加载 pstar_data/ | 同步 |
| POST | `/api/v1/stack/validate` | 校验叠层配置 | 同步 |
| POST | `/api/v1/stack/import-json` | 导入桌面版 JSON | 同步 |
| POST | `/api/v1/stack/export-json` | 导出桌面版 JSON | 同步 |

---

## 5. 物理引擎完整性验证

### 5.1 复制文件校验

以下文件从 `new_work_GUI_RCF/` 零修改复制，保证物理计算精度一致：

| 文件 | 行数 | 校验方式 |
|------|------|---------|
| `physics/stopping_power.py` | 530 | 二进制一致 |
| `physics/stopping_power_bethe.py` | 762 | 二进制一致 |
| `physics/stopping_power_pstar.py` | 100 | 二进制一致 |
| `physics/layer_physics.py` | 1,176 | 二进制一致 |
| `physics/ion.py` | 562 | 二进制一致 |
| `physics/material_registry.py` | 219 | 二进制一致 |
| `physics/pstar_parser.py` | 80 | 二进制一致 |
| `models/rcf_model.py` | 185 | 二进制一致 |
| `config.py` | 105 | 二进制一致 |
| `pstar_data/*.csv` | 21 文件 | 二进制一致 |

### 5.2 烟雾测试结果

```
测试配置: 30μm Al + HD (105μm)
能量范围: 0.5 - 20.0 MeV, 步长 1.0 MeV
结果: HD 截止能量 = 2.50 MeV ✓
PSTAR 材料加载: 20/21 成功 (aluminum_nist.csv 跳过: 非标准命名)
总可用材料: 25 (20 PSTAR + 5 内置)
```

### 5.3 重构对照

| 桌面版源文件 | Web 版目标文件 | 重构内容 |
|-------------|---------------|---------|
| `computation/energy_pk_thread.py` (295行) | `services/energy_scan.py` (243行) | 移除 QThread/pyqtSignal，TABLE.item() → layers[i] dict |
| `computation/linear_design_thread.py` (445行) | `services/linear_design.py` (313行) | 移除 QThread，TABLE2_1.item() → detectors[i] dict |
| `pstar_loader.py` (68行) | `services/material_service.py` (168行) | 扩展为完整 CRUD 服务 |

核心物理逻辑（材料分发、CSDA 步进、Bragg 峰判定）完全保留，仅替换 GUI 数据访问方式。

---

## 6. 问题清单

### 6.1 高优先级

| # | 类别 | 位置 | 描述 | 建议修复 |
|---|------|------|------|---------|
| H1 | 安全 | `backend/main.py:41` | CORS 允许 `["*"]`，生产环境有安全风险 | 限制为前端域名 |
| H2 | 内存 | `api/compute.py:22` | 异步任务存储在内存 dict 中，无 TTL 清理机制，长期运行会内存泄漏 | 添加任务过期清理（如 1 小时 TTL） |
| H3 | 安全 | `api/websocket.py` | WebSocket 无认证，任意客户端可查询任意 task_id | 添加 token 验证 |
| H4 | 文件 | `services/material_service.py:129` | 上传材料写入临时文件，路径存入响应但文件可能被系统清理 | 复制到持久化目录 |

### 6.2 中优先级

| # | 类别 | 位置 | 描述 | 建议修复 |
|---|------|------|------|---------|
| M1 | 验证 | `schemas/stack.py` | `thickness` 无正数校验，`thickness_type` 未用 Literal 约束 | 添加 Pydantic validator |
| M2 | 验证 | `schemas/compute.py` | 无 `energy_min < energy_max` 校验 | 添加 model_validator |
| M3 | 物理 | `services/energy_scan.py:156` | EBT 截止层数 29、HD 截止层数 7 硬编码 | 移至材料属性或 config.py |
| M4 | 性能 | `services/linear_design.py:152-186` | Al 厚度搜索为暴力遍历 O(n²) | 改用二分搜索或黄金分割 |
| M5 | 效率 | `api/websocket.py:53` | 0.2s 轮询推送进度，效率低 | 改用 asyncio.Event 事件驱动 |
| M6 | 前端 | `composables/useComputation.ts:67` | WebSocket onerror 仅停止计算，无用户提示 | 添加 ElMessage.error() |
| M7 | 前端 | `components/StackTable.vue:61` | 用 indexOf() 查找 RCF 截止能量，层重排后会错位 | 改用稳定的 rcf_id 匹配 |
| M8 | 前端 | `components/LinearDesignPanel.vue` | 178 行，职责过多 | 拆分为参数/探测器/结果三个子组件 |
| M9 | 部署 | `nginx/default.conf` | 无 SSL/TLS 配置，无 gzip 压缩 | 添加 HTTPS 和压缩 |
| M10 | 部署 | `backend/Dockerfile` | 以 root 运行，无 HEALTHCHECK | 添加 USER 指令和健康检查 |

### 6.3 低优先级

| # | 类别 | 位置 | 描述 | 建议修复 |
|---|------|------|------|---------|
| L1 | 依赖 | `requirements.txt` | 未锁定版本，缺少 pytest | 添加版本锁定和测试依赖 |
| L2 | 类型 | `frontend/package.json` | 缺少 `@types/plotly.js` | 添加到 devDependencies |
| L3 | 测试 | `tests/test_api.py` | 仅覆盖正常路径，缺少错误场景测试 | 补充边界和异常测试 |
| L4 | 前端 | `components/MaterialManager.vue` | CSV 格式未在前端校验 | 添加文件格式预检 |
| L5 | 前端 | `composables/useComputation.ts:50` | WebSocket URL 拼接方式较脆弱 | 使用环境变量配置 |
| L6 | i18n | `composables/useLocale.ts` | locale key 无类型安全检查 | 使用 const assertion |
| L7 | 配置 | `docker-compose.yml` | 无资源限制、无日志配置 | 添加 deploy.resources |
| L8 | 前端 | 全局 | 无 WebSocket 断线重连机制 | 添加指数退避重连 |

---

## 7. 测试覆盖

### 7.1 现有测试 (`tests/test_api.py`)

| 测试用例 | 覆盖内容 | 状态 |
|---------|---------|------|
| `test_health` | 健康检查端点 | ✓ |
| `test_materials_list` | 材料列表 API | ✓ |
| `test_batch_load` | 批量加载 PSTAR | ✓ |
| `test_stack_validate` | 叠层校验（正常） | ✓ |
| `test_stack_validate_no_detector` | 叠层校验（无探测器） | ✓ |
| `test_energy_scan_sync` | 同步能量扫描 | ✓ |
| `test_energy_scan_oblique` | 斜入射对比 | ✓ |
| `test_energy_scan_async` | 异步任务创建 | ✓ |

### 7.2 缺失测试

- 线性设计 API 端点
- 材料上传（PSTAR CSV）
- 无效参数（负厚度、超范围能量）
- 多离子计算（He4, C12 等）
- WebSocket 完整流程（连接→进度→结果）
- JSON 导入/导出往返一致性
- 桌面版 vs Web 版数值对比验证

---

## 8. 部署说明

### 8.1 开发模式

```bash
# 后端
cd rcf-web/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 前端
cd rcf-web/frontend
npm install
npm run dev    # http://localhost:3000, 代理 API 到 :8000
```

### 8.2 Docker 部署

```bash
cd rcf-web
docker-compose up -d
# 访问 http://localhost:8080
```

### 8.3 iframe 嵌入

```html
<iframe src="http://lab-server:8080/" width="100%" height="800px"></iframe>
```

---

## 9. 结论

项目结构清晰，物理引擎零修改复制保证了计算精度一致性。后端 services 层成功将 QThread 计算逻辑解耦为纯 Python 函数，前端组件化程度良好。

主要风险点集中在：
1. **生产安全**（CORS 通配、WebSocket 无认证）— 内网部署可接受，公网部署需修复
2. **内存管理**（异步任务无清理）— 长期运行需关注
3. **输入验证**（缺少边界检查）— 可能导致无效计算

建议在正式部署前优先处理 H1-H4 高优先级问题，其余可在后续迭代中逐步完善。
