# CLAUDE.md — rcf-web

## 项目概述

RCF 叠层谱仪设计工具 Web 版。从 PyQt5 桌面版 (`new_work_GUI_RCF/`) 迁移而来，物理引擎零修改复制，GUI 层用 FastAPI + Vue 3 重写。用于设计和优化质子能谱测量系统中的 RCF 探测器叠层。

## 关键命令

```bash
# 后端
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 前端
cd frontend && npm install
npm run dev          # 开发服务器
npm run build        # 生产构建

# Docker 一键部署
docker-compose up -d   # 后端 :8000, 前端 :8080

# 测试
cd backend && python -m pytest tests/test_api.py -v
```

## 技术栈

| 层 | 选型 |
|---|---|
| 后端 | FastAPI + Pydantic v2 + NumPy + Uvicorn |
| 前端 | Vue 3 + TypeScript + Vite 5 + Element Plus + Plotly.js + Pinia |
| 部署 | Docker Compose + Nginx 反向代理 |

## 目录结构

```
rcf-web/
├── docker-compose.yml
├── nginx/default.conf
├── backend/
│   ├── main.py                  # FastAPI 入口 (56行)
│   ├── config.py                # 常量：密度、层数、默认值 (105行)
│   ├── api/                     # 路由层
│   │   ├── compute.py           # 能量扫描 + 线性设计 (147行)
│   │   ├── materials.py         # 材料管理 (46行)
│   │   ├── stack.py             # 叠层校验/导入导出 (75行)
│   │   └── websocket.py         # WS 进度推送 (60行)
│   ├── schemas/                 # Pydantic 模型
│   │   ├── compute.py           # 请求/响应 (57行)
│   │   └── stack.py             # StackLayer, MaterialInfo (16行)
│   ├── services/                # 业务逻辑（从 QThread 重构）
│   │   ├── energy_scan.py       # 能量扫描计算 (243行)
│   │   ├── linear_design.py     # 线性设计优化 (313行)
│   │   └── material_service.py  # 材料加载/注册 (168行)
│   ├── physics/                 # ⛔ 物理引擎（禁止修改）
│   │   ├── stopping_power.py    # 分段拟合阻止本领 (530行)
│   │   ├── stopping_power_bethe.py  # Bethe-Bloch (762行)
│   │   ├── layer_physics.py     # CSDA 输运 (1176行)
│   │   ├── ion.py               # 多离子定义 (562行)
│   │   └── material_registry.py # 材料注册表 (219行)
│   ├── models/rcf_model.py      # ⛔ RCF 探测器类 (185行)
│   ├── pstar_data/              # ⛔ 21个 PSTAR CSV 文件
│   └── tests/test_api.py        # API 集成测试 (118行)
├── frontend/src/
│   ├── main.ts / App.vue
│   ├── stores/                  # Pinia: stack / compute / settings
│   ├── api/                     # Axios + WebSocket 封装
│   ├── components/              # 15 个 Vue 组件
│   ├── composables/             # useComputation 等组合函数
│   ├── styles/                  # CSS 变量主题 (3套暗色)
│   └── locales/                 # 中英文切换
```

## 架构要点

### 后端三层架构

```
schemas/ (Pydantic 数据校验) → services/ (纯 Python 计算) → api/ (FastAPI 路由 + WS)
```

- `services/` 从桌面版 `computation/*_thread.py` 重构：移除 QThread/pyqtSignal，保留全部计算逻辑
- 异步计算：`asyncio.to_thread()` 运行计算，WebSocket 每 200ms 推送进度

### 物理引擎（⛔ 零修改区）

以下文件从桌面版直接复制，**禁止修改**，保证计算精度一致：
- `physics/*` — 阻止本领、CSDA 输运、离子定义、材料注册
- `models/rcf_model.py` — RCF 探测器类
- `config.py` — 物理常量
- `pstar_data/*.csv` — NIST 阻止本领数据

物理模型：CSDA 1μm 步进，S/ρ (MeV·cm²/g) × 密度 → dE/dx (MeV/μm)
Bragg 峰判定：EBT 止于第 29 层(共30)，HD 止于第 7 层(共8)
阻止本领来源：内置分段拟合 / Bethe-Bloch / PSTAR 插值

### 前端组件架构

Pinia stores：`stack`(叠层数据) / `compute`(计算结果+进度) / `settings`(主题/语言/角度)
绘图：Plotly.js — scatter(截止能量)、多线(能量沉积)、heatmap(响应矩阵)
主题：Electric Blue / Matrix Green / Red Alert（纯 CSS 变量，无动画特效）

## API 端点清单 (12个)

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/v1/health` | 健康检查 |
| POST | `/api/v1/compute/energy-scan` | 同步能量扫描 |
| POST | `/api/v1/compute/energy-scan/async` | 异步扫描，返回 task_id |
| POST | `/api/v1/compute/linear-design` | 同步线性设计 |
| POST | `/api/v1/compute/linear-design/async` | 异步线性设计 |
| WS | `/api/v1/ws/compute/{task_id}` | 进度推送 |
| GET | `/api/v1/materials/` | 列出全部材料 |
| POST | `/api/v1/materials/upload-pstar` | 上传 PSTAR CSV |
| POST | `/api/v1/materials/batch-load` | 批量加载 pstar_data/ |
| POST | `/api/v1/stack/validate` | 校验叠层配置 |
| POST | `/api/v1/stack/import-json` | 导入桌面版 JSON |
| POST | `/api/v1/stack/export-json` | 导出为桌面版 JSON |

## 开发约定

### 命名规范
- 后端：snake_case，服务函数 `run_energy_scan()` / `run_linear_design()`
- 前端：camelCase，组件 PascalCase，store `useStackStore()` / `useComputeStore()`
- API 路径：kebab-case `/api/v1/energy-scan`

### 物理引擎红线
- `physics/` `models/` `config.py` `pstar_data/` → **禁止修改**
- 新增材料 → 通过 `services/material_service.py` 注册
- 新增物理功能 → 在 `services/` 层封装，不动底层引擎

### 单位约定
能量 MeV | 厚度 μm | 密度 g/cm³ | 角度 度(非弧度) | 阻止本领 MeV·cm²/g

### 斜入射
`path_factor = 1/cos(θ)`，所有 layer 函数通过 `path_factor` 参数支持，角度范围 0-84°

## 已知问题 (详见 AUDIT.md)

| 优先级 | 位置 | 问题 |
|--------|------|------|
| H1 | `main.py:41` | CORS 允许 `["*"]`，生产环境需限制域名 |
| H2 | `api/compute.py:22` | 异步任务存内存 dict 无 TTL，长期运行会内存泄漏 |
| H3 | `api/websocket.py` | WebSocket 无认证，任意客户端可查询任意 task_id |
| H4 | `services/material_service.py:129` | 上传材料写临时目录，重启后丢失 |

## 测试

```bash
cd backend && python -m pytest tests/test_api.py -v   # 8 个用例
```

覆盖：能量扫描、材料列表、叠层校验。缺失：线性设计测试、错误场景、前端测试。
验证原则：同一组参数，Web 版 vs 桌面版输出的截止能量和响应矩阵必须完全一致。
