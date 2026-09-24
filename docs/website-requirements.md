# Minecraft Image Converter — 网站设计与开发需求文档

> 版本：v0.4（关键词 + 竞品 + 技术方案融合定稿）
> 日期：2026-09-06
> 状态：可执行（T1 关键词调研、T2 竞品调研、T3 技术方案评审均已完成）
>
> **v0.4 变更记录**：融合外部技术评审意见（Gemini 方案）。采纳：LAB 色彩空间 + CIEDE2000 色差算法规范（6.1）、Web Worker + OffscreenCanvas 渲染架构（6.1/8）、**基岩版 .mcstructure 导出——三竞品均为 Java 向，基岩玩家是空白市场**（6.1/9）、移动端 Bottom-Sheet 交互规范（6.4）、shadcn/ui + Zustand + next-intl 选型（8）。驳回并记录理由：方块素材 Base64 内嵌 JSON（改用雪碧图 + 清单，见 6.5）、纯 SPA 表述（维持 SSG/SSR 立场）、纯 LLM 生成博客（改 AI 辅助 + 人工审校，见 10.6）。
>
> **v0.3 变更记录**：新增第 3 节"竞品对标分析"（utilitycove.com / minecraft-dot.pictures / minecraftart.net）。依据竞品数据调整：`.schem/.litematic` 导出提前至 M2；多语言第一波改为 JA/ZH（日本市场被两竞品验证）；新增 `litematic-viewer` 需求线索与两条新风险（执行窗口、数据口径差异）。

---

## 1. 项目背景与目标

### 1.1 背景
围绕核心关键词 `minecraft image converter` 的 SEMrush 调研显示：
- 该词族（161 个变体）月搜索量约 3.9K（核心词 1.3K/US，全球 6.5K），KD 仅 4%（非常容易），CPC 高达 $18.20。
- SERP 前排以论坛、视频、博客内容为主，仅有 2–3 个小型独立工具站（如 utilityfov.com、neutralxhost.com），无大厂工具页卡位。
- Google Trends 显示相关词族 `minecraft pixel art generator` 长期热度高于主词，相关查询还包括 `image to minecraft`、`minecraft image generator`、`pixel image converter` 等，市场比单一"converter"更大。
- 流量高度全球化（热度 Top：古巴、巴基斯坦、日本、孟加拉、印度；SEMrush 美国库：US 1.3K、IN ~1.0K、PK ~1.0K、BR 280、VN 260），支持多语言策略。

**补充调研（Keyword Magic Tool 深挖）后修正认知**：
- `minecraft image converter` 所在的"所有关键词"视图仅 7 个词、总搜索量 1,910 —— 主词词族其实很小。
- 切换到"相关性/所有关键词"全量视图后：**375 个关键词、总搜索量 93,680、平均 KD 18%**（美国库）；问题词（Questions）33 个、13,320；英国库 67 个词、23,400。
- 真正的流量池在**像素艺术词族 + 地图教程词族**，`minecraft image converter` 只是入口，不是主体。

### 1.2 竞品验证的市场信号
三个独立工具站（详见第 3 节）合计月访问约 **18.3 万**，全部以自然搜索为主（占比 72–94%），且：
- utilitycove.com 上线仅 6 个月即达到 12.8 万访问/月、仍在高速增长 —— **市场窗口仍然敞开**；
- minecraftart.net 2025 年 12 月才注册域名，靠 4 个词 + 多语言子目录已做到 6.2 万访问/月 —— **低 KD 词族 + 多语言 = 快速起量公式**；
- 两站共同验证了日本、巴西、波兰、越南等非英语市场的价值。

### 1.3 定位
**一个免费在线的"Minecraft 像素画 & 图片工具集"网站**：上传任意图片，一键转换为 Minecraft 像素画 / 方块画 / 玩家皮肤 / 地图艺术画 / 头像图标；配合网格模板库、教程中心与作品画廊。

> 定位修正说明（v0.2）：原定位以 "Image Converter" 为中心，但数据显示 `minecraft pixel art generator`（4.4K、KD 12、**C 商业意图**、$3.43–18.20 CPC）在体量、意图质量和竞争度上全面优于 `minecraft image converter`（1.3K、I 意图）。因此品牌叙事与首页 Title 以 **Pixel Art Generator & Image Converter** 双词并列，工具本体不变（两者指向同一个转换引擎）。

### 1.4 业务目标（KPI）
| 阶段 | 时间 | 目标 | 参照基准 |
|---|---|---|---|
| 上线 | M0–M2 | 核心工具页上线，收录 | – |
| 增长 | M3–M6 | 核心词进入 Google 前排；自然流量 8,000+/月 | minecraftart.net 用 6 个月达成 6.2 万/月 |
| 规模 | M7–M12 | 词族覆盖 150+ 关键词；自然流量 30,000+/月；AdSense/高级功能变现 | utilitycove.com 6 个月达成 12.8 万/月 |

---

## 2. 关键词调研数据（摘要）

### 2.1 市场总览（Keyword Magic Tool，KD 筛选 0–29%）

| 视图 / 数据库 | 关键词数 | 总搜索量 | 平均 KD | 备注 |
|---|---|---|---|---|
| 广泛匹配·所有关键词（US） | 7 | 1,910 | 8% | 主词直接词族（很小） |
| **相关性·所有关键词（US）** | **375** | **93,680** | **18%** | 全量市场 ≈ 主词词族的 49 倍 |
| 问题（Questions, US） | 33 | 13,320 | 23% | how-to 教程流量池 |
| 相关性（UK 库） | 67 | 23,400 | 20% | 英语第二市场，验证多英语区策略 |

### 2.2 核心关键词明细（美国库，按搜索量排序）

**T1 头部词（≥1.3K）——主工具页与首页目标**

| 关键词 | Volume | KD | Intent | CPC | 备注 |
|---|---|---|---|---|---|
| minecraft pixel art generator | 4,400 | 12 | **C（商业）** | $3.43 | 全场唯一 C 意图词 → 首页主词 |
| how do i make a map in minecraft | 3,600 | 29 | I | – | 教程 |
| how do you craft a map in minecraft | 2,400 | 27 | I | – | 教程 |
| how to create a map in minecraft | 2,400 | 29 | I | – | 教程 |
| minecraft recipes map | 2,400 | 28 | I | – | 教程（合成配方） |
| pixel art minecraft | 2,400 | 21 | I | – | 信息型 Hub 页 |
| mc pixel art | 1,900 | 14 | I | $0.40 | |
| pixel art maker minecraft | 1,900 | 18 | **I+T** | – | 工具页 |
| block party schematics minecraft | 1,600 | 11 | I+T | – | 网格模板/ schematic 需求 |
| minecraft structure planner | 1,600 | 17 | I | – | 规划工具需求 |
| building planner minecraft | 1,300 | 29 | I | – | 规划工具需求 |
| minecraft image converter | 1,300 | 4 | I | $18.20 | 原主词，KD 最低 |
| minecraft map art | 1,300 | 10 | I | – | |
| minecraft pixel art creator | 1,300 | 18 | I | – | |

**T2 中部词（880–1.0K）**

| 关键词 | Volume | KD | Intent | CPC |
|---|---|---|---|---|
| image to minecraft pixel art | 1,000 | 22 | I | $18.20 |
| how to craft map in minecraft | 880 | 28 | I | – |
| image to pixel art minecraft | 880 | 18 | I | $18.20 |
| minecraft how to create a map | 880 | 26 | I | – |
| minecraft pixel art easy | 880 | 28 | I | – |
| minecraft pixel art grid | 850 | 25 | I | – |
| picture to minecraft converter | 880 | 1 | I | $18.20 |
| pixel art generator minecraft | 880 | 20 | I | – |
| easy minecraft pixel art | 720 | 28 | I | – |

**T3 长尾与英国库补充（示例）**

| 关键词 | 库 | Volume | KD | Intent |
|---|---|---|---|---|
| minecraft pixelated art | UK | 1,000 | 28 | I |
| pixel art en minecraft | UK | 1,000 | 29 | I |
| mine pixel art | UK | 880 | 22 | I |
| map art | UK | 590 | 28 | I |
| minecraft build planner | UK | 480 | 22 | I |
| minecraft pixel art | UK | 2,900 | 28 | I |
| art pixel minecraft / minecraft pixel art minecraft | UK | 1,900×2 | 27 | I |
| minecraft map art image converter | US | 70 | 8 | I |
| image to minecraft skin converter | US | 90 | 11 | I |
| convert image to minecraft blocks | US | 40 | 2 | I |

> 注：英国库中 `minecraft pixel art` 2.9K、`minecraft pixel art generator` 1.3K（CPC $3.43）——英语区多库合计后该词族实际体量远大于美国单库数字。

### 2.3 主题聚类（v0.2 修订）

| 簇 | 主题 | 体量特征 | 目标页面 | 代表关键词 |
|---|---|---|---|---|
| A | **像素画生成/转换（核心）** | 最大簇：generator/maker/creator/pixel 全家桶，含唯一 C 意图词 | 首页 + /pixel-art-generator + /image-to-pixel-art | minecraft pixel art generator 4.4K/C、pixel art maker minecraft 1.9K、image to minecraft pixel art 1.0K、picture to minecraft converter 880/KD1 |
| B | **地图艺术 + 地图合成教程** | 教程词 3.6K/2.4K/2.4K/880 + minecraft map art 1.3K | /guides/map-* 教程集群 + /image-to-map-art | how do i make a map in minecraft 3.6K、minecraft recipes map 2.4K、minecraft map art 1.3K |
| C | 皮肤 | 小而精准 | /image-to-skin | image to minecraft skin converter 90、minecraft skin from image 70 |
| D | 结构/建筑规划（新发现） | structure planner 1.6K + building planner 1.3K + block party schematics 1.6K | /grid-templates 模板库（P1）+ /structure-planner（P2） | block party schematics minecraft 1.6K、minecraft structure planner 1.6K、building planner minecraft 1.3K |
| E | 头像/图标 | 长尾 | /image-to-avatar | icon 分组词、make minecraft pictures 390 |
| F | 疑问词教程集群 | 33 问、13,320 | /guides/* + FAQ | how to make pixel art in minecraft 170、how many pixels is a minecraft block 140、how to do pixel art in minecraft 140 |
| G | 灵感/难度修饰词（新发现） | easy pixel art minecraft 880+720、pixel art grid 850 | /gallery + 模板页按难度标签 | easy minecraft pixel art 720/880、minecraft pixel art grid 850、pixel art minecraft 2.4K |

### 2.4 待补充
- 无（关键词调研数据已齐；后续可补充 SEMrush 竞品关键词交集报告以精确量化 gap）。

---

## 3. 竞品对标分析（v0.3 新增）

> 数据为 SimilarWeb / traffic.cv 口径（2026 年 7 月前后），与 SEMrush 口径存在差异，看趋势与结构而非绝对值。

### 3.1 三竞品总览

| 维度 | **utilitycove.com** | **minecraft-dot.pictures** | **minecraftart.net** |
|---|---|---|---|
| 定位 | 通用小工具集合站（MC 像素画为其明星工具） | 单一功能站：照片→MC 像素画 + litematic 查看器 | 单一功能站：litematic/原理图蓝图教程与查看 |
| 月访问量 | **12.85 万**（traffic.cv 估算） | **7.48 万**（SEMrush 口径） | **6.25 万**（traffic.cv） |
| 域名年龄 | **192 天**（2026-02 注册） | 5.6 年（2021-01 注册） | **254 天**（2025-12 注册） |
| 流量趋势 | 新站爆发式增长（半年内从 ~2 万爬升至 12.8 万） | 老站平稳略降，靠 /editor、command-help 页面群维持 | 上线后爬升中（SEMrush 月环比 +181%） |
| 自然搜索占比 | ~60%（另 ~13% 直接、~10% 外链、~10% 展示广告） | ~72% | ~74% |
| 跳出率 | 50.2% | 43.1% | 41.9% |
| 停留时长 | 00:39 | 01:12 | 00:52 |
| 设备 | 50/50 | 桌面 68% / 移动 32% | 桌面 54% / 移动 46% |
| 多语言 | 仅 EN | JA（仅一个 /ja，份额 ~1.6%） | **EN 58% / JA 9.9% / ZH 7.9% / KO 5.1%** |
| 广告 | 无 | 无明显广告 | 无 |

### 3.2 各竞品详解

**A. utilitycove.com —— 增长标杆，"工具矩阵 + 内容"打法**

- **主要页面**：`/tools/minecraft-pixel-art`（占全站 61–81%，页面访问量 6.2 万）＞ `/tools/folder-structure-generator`（7.7%）＞ 首页（4.9%）＞ `/tools/minecraft-shape-generator`（1.5%）＞ 字母头像类工具（~1%）等；另有 yes-or-no-wheel、zero-width-space 等小工具引流。
- **Top 关键词**：yes or no wheel（约 6.5K 流量/14.1K 容量，泛流量）、minecraft pixel art generator（约 4.8K/16.2K，**正是我们的主攻词**）、minecraft pixel art（约 1.2K/11.1K）、image to minecraft pixel art（约 800/2.2K）、folder tree generator（约 500/800）。
- **页面结构（截图可见）**：Hero 一句话价值主张 → 上传组件 → Art Size 预设（16/32/64/128）+ 自定义宽高 → 缩放滑杆 → "About this tool" 长文案 → **FAQ（含 is it free / download schematica / which blocks / max size / block matching 等问题，有 FAQPage 结构化数据机会）** → **Related Tools 互链**（Minecraft Art Generator、Message Digester、Pony Bead Pattern、LEGO Mosaic、Cross Stitch、Paint by Numbers）。
- 关键卖点文案：no signup / no watermark / nothing uploaded to a server / 80 blocks palette / .schem for WorldEdit、Litematica / .litematic / PNG plan。
- 启示：该站用同一引擎服务**多个相邻利基**（乐高、十字绣、串珠、Paint by Numbers——都是"像素网格化"需求），并靠奇葩小工具（yes or no wheel）获取泛流量。

**B. minecraft-dot.pictures —— 老站，功能极简但靠 litematic 生态与多语言维持**

- **主要页面**：`/command-help`（6.1K，6.2%）及其 bedrock/iphone/java 变体页（3.4K/2.6K/2.3K）＞ `/editor`（5.3K，增长 +9.96%）＞ `/ja`（679，被判定"削减"）＞ 主工具页（3.8 万）。
- **Top 关键词**：minecraft pixel art generator（约 2.9K 流量/10.3K 容量）、minecraft dot（约 900/908）、minecraft pixel art（约 790/11.1K）、minecraft image converter（约 600/2.6K）、image to minecraft blocks（约 850/600）。
- 流量来源：搜索 ~72% + 直接 ~16–22%（老站品牌复访）+ discord.com（1.8%）等社区外链（产品在 GitHub 开源，@KK_sepo_TT）。
- 产品截图显示：单一转换器，Number of horizontal blocks 输入 + 方块色板勾选（含不可获得方块排除开关），convert 即出结果；极简风格，几乎无 SEO 文案。
- 启示：command-help 内容群（命令查询）是其流量护城河，说明"工具 + 查询类内容"组合有效；litematic 相关需求真实存在。

**C. minecraftart.net —— 新站起量公式：低竞争词 + 多语言 + 蓝图教程**

- **主要页面**：`/en`（2.9 万唯一页面浏览量，占 58%）＞ `/ja`（4675，9.9%）＞ `/zh`（3731，7.9%）＞ `/ko`（2420，5.1%）；增长最快页面：`/minecraft-ore-xyz`（+831%）、`/minecraft-litematica-viewer`（+487%）、`/minecraft-pixel-art-generator`（+290%）。
- **Top 关键词**：minecraft image converter（约 2.5K 流量/2.6K 容量，CPC $12.22）、minecraft ore xyz / coordinates finder（约 400/90）、image to minecraft blocks（约 300/960）、block pixel art（约 200）、font generieren（德语小词，~200）。
- 结构：EN 主站 + 4 个语言子目录；内容为 litematica 蓝图教程 + 查看器 + 像素画生成器。
- 启示：**254 天做到 6.25 万/月**，证明该词族新站可玩；其 ore/coordinates 类"查询工具"是意外的增长点。

### 3.3 竞品 GAP 总结（我们的机会）

| # | 机会点 | 依据 | 对应动作 |
|---|---|---|---|
| 1 | **三家都没有做内容矩阵**：无真正的教程集群（map 教程 10.8K 词族无人承接） | SERP 中 map 教程前排全是 fandom/wiki/reddit，竞品工具站未布局 | M2 地图教程集群（已规划） |
| 2 | **三家都没有变现**：utilitycove 无广告、其余未见——先发者可独占 AdSense 早期收益 | traffic.cv/ SimilarWeb 无 display ads 标记 | 上线即接 AdSense（注意密度） |
| 3 | **无 .schem 在线生成体验好的站**：utilitycove 有导出但主工具页 39s 停留说明体验一般；litematic viewer 需求被 minecraftart.net 验证（+487%） | 竞品页面数据 | 导出 .schem/.litematic + 在线 3D 查看器（P1 提前） |
| 4 | **皮肤转换词族无人布局**（image to minecraft skin converter 90/KD11） | 关键词数据 + 三竞品 Top 页均无皮肤工具 | 保留 P1，低成本占位 |
| 5 | **多语言红利**：JA/ZH/KO 子目录为 minecraftart.net 贡献 ~23% 流量；minecraft-dot 的 /ja 被判定"削减"说明**做了但没做好** | 两竞品子目录数据 | M3 多语言：第一波 JA/ZH，质量优先于数量 |
| 6 | **相邻利基复用引擎**：LEGO 马赛克、十字绣、串珠图案、Paint by Numbers 与 MC 像素画同构 | utilitycove Related Tools 全是此类 | 二期：同一引擎多利基落地页 |
| 7 | **查询类小工具引流**：ore finder、command help、coordinates 是竞品隐藏增长点 | minecraftart +487%/+831% 页面、minecraft-dot command-help 14K | 二期观察名单，不进首发 |
| 8 | **基岩版无人覆盖（v0.4 新增）**：三竞品导出格式均为 Java 生态（.schem/.litematic），手游/主机/Win10 基岩玩家（.mcstructure）是空白 | utilitycove FAQ 仅提 WorldEdit/Litematica；其余两家 Java 向 | M2 导出矩阵加入 .mcstructure（独家卖点，见 6.1） |

### 3.4 我们 vs 竞品的差异化定位

```text
             竞品共性弱点                    我们的对策
┌────────────────────────────┬──────────────────────────────────────┐
│ 只做工具、无教程内容        │ 工具 + 教程双轮（承接 10.8K map 词族）│
│ 无模板库（grid/schematics） │ /grid-templates 程序化模板页         │
│ 多语言要么没有要么质量差    │ JA/ZH 优先、母语级翻译               │
│ 体验一般（39s 停留）        │ 实时预览 + 3D + 参数丰富 + CWV 达标  │
│ 无变现布局                  │ 上线即合规接 AdSense                 │
└────────────────────────────┴──────────────────────────────────────┘
```

---

## 4. 用户需求分析

| 搜索意图 | 用户痛点 | 网站解决方案 | 优先级 |
|---|---|---|---|
| 生成像素画（A 簇，4.4K+C 意图） | 不会配色、手动拼太慢 | 在线生成器：上传→色板量化→预览→导出 PNG/方块清单；主词为 generator，页面叙事强调"一键生成" | **P0** |
| 学做地图（B 簇教程词 13K+） | 不知道地图合成配方、不知道怎么把图放进地图 | 教程集群：地图合成配方（recipes map）、地图艺术全流程；教程内嵌自家工具 | **P0**（新提升） |
| 把图片变成方块画 | 需要按方块逐格施工的图纸 | 转换器输出带编号网格图 + 材料清单 + .schem | P0 |
| 想直接要"现成模板"（D/G 簇：block party schematics 1.6K、pixel art grid 850、easy pixel art） | 不想自己设计，只想照着拼 | **网格模板库**：按难度（easy/medium）与主题分类的像素画模板，每页含网格图+配色+方块清单 → 天然程序化 SEO 页面 | **P1**（新增模块） |
| 规划建筑/结构（D 簇 2.9K） | 建造前想规划布局 | 结构规划器（二期）或先用"网格画布+导出"覆盖 | P2 |
| 把照片变成皮肤（C 簇） | 不懂 64×64 皮肤格式 | 皮肤生成器 + 3D 试穿预览 | P1 |
| 学习原理/参数（F 簇） | "一个方块是几个像素？"等基础问题 | FAQ + 教程（结构化数据抢精选摘要） | P1 |
| 灵感参考（G 簇） | 想看别人作品找点子 | 作品画廊（可按难度/主题筛选，与模板库互通） | P2 |

> 意图洞察：T1 头部词里 **tutorial 类词（map 教程 4 词合计 10.8K）体量远超工具词**，且 KD 27–29 仍属可攻。"工具 + 教程"双轮驱动是本站正确姿势：教程页承接大流量并向工具导流，工具页承接高价值转化。

---

## 5. 信息架构（Sitemap，v0.2 修订）

```text
/                                     首页 = 像素画生成器（主词 minecraft pixel art generator 落地页，
│                                       Title 覆盖 generator/converter 双词）
├── /pixel-art-generator              生成器（=首页同引擎的独立落地页，承接 maker/creator 词）
├── /image-to-pixel-art               图片→像素画（converter 词族落地页）
│   └── /image-to-pixel-art/[size]    程序化页：16x16 / 32x32 / 64x64 / 128x128 变体
├── /grid-templates                   网格模板库（聚合页：pixel art grid 850、block party schematics 1.6K）
│   ├── /grid-templates/[theme]       主题分类页（动物/角色/物品/建筑…）
│   └── /grid-templates/[slug]        模板详情：网格图+调色板+方块清单+难度标签（程序化 SEO）
├── /image-to-map-art                 图片→地图艺术（minecraft map art 1.3K）
├── /image-to-skin                    图片→玩家皮肤
├── /image-to-avatar                  图片→头像/图标
├── /guides                           教程中心（聚合页）
│   ├── /guides/map/                  地图教程集群（承接 10.8K 教程词，集群内互链）
│   │   ├── how-to-make-a-map-in-minecraft          ← how do i make a map 3.6K
│   │   ├── how-to-craft-a-map-in-minecraft         ← craft a map 2.4K + recipes map 2.4K
│   │   ├── how-to-create-map-in-minecraft          ← create a map 2.4K（合并变体）
│   │   └── how-to-make-map-art-in-minecraft        ← map art 教程+工具导流
│   ├── /guides/pixel-art/
│   │   ├── how-to-make-pixel-art-in-minecraft      ← 170 + 变体
│   │   └── how-many-pixels-is-a-minecraft-block    ← 140，featured snippet 目标
│   ├── /guides/skin/                 皮肤教程集群
│   └── /faq                          FAQ 总页（问题词 33 个入库）
├── /gallery                          作品画廊（UGC，按难度/主题筛选）
├── /blog                             博客（更新日志、案例、榜单如 "50 easy minecraft pixel art ideas"）
└── /about /privacy /terms            合规页（AdSense 必需）
```

**页面 ↔ 关键词映射（核心 SEO 决策）**

| 页面 | 主关键词 | 辅关键词 | 预估月流量潜力 |
|---|---|---|---|
| / （首页） | minecraft pixel art generator (4.4K, C) | pixel art maker minecraft、pixel art generator minecraft | 6K+ |
| /image-to-pixel-art | image to minecraft pixel art (1.0K) | picture to minecraft converter (880, KD1)、minecraft image converter (1.3K) | 3K+ |
| /image-to-map-art | minecraft map art (1.3K) | minecraft map art image converter | 1.5K |
| /guides/map/* | how do i make a map in minecraft (3.6K) 等 4 篇 | 全部 craft/create 变体 | 10K+ |
| /grid-templates/* | minecraft pixel art grid (850)、block party schematics (1.6K) | easy minecraft pixel art (720+)、按主题长尾 | 5K+（随模板数量增长） |
| /image-to-skin | image to minecraft skin converter (90) | minecraft skin from image | 200 |

**URL 与标题模板**

| 页面 | Title 模板 |
|---|---|
| / | Minecraft Pixel Art Generator & Image Converter — Free Online |
| /grid-templates/[slug] | {名称} Minecraft Pixel Art Template — {尺寸} Grid + Block List |
| /guides/{slug} | How to {动词短语} in Minecraft（{年份} Guide） |
| /image-to-pixel-art/{size} | Image to Minecraft Pixel Art ({size}) — Free Converter |

---

## 6. 核心功能需求

### 6.1 转换引擎（P0）

**图像处理流水线（v0.4 定稿，Web Worker 层执行）**

```text
上传文件 → 解码为 ImageData → [Worker] LAB 色彩空间转换
  → CIEDE2000 色差匹配 blocks-palette.json 色板
  → （可选）Floyd–Steinberg 抖动
  → 输出方块 ID 二维矩阵 → 主线程 Canvas 渲染 / 导出模块
```

1. **上传**：拖拽/粘贴/选择文件，支持 PNG/JPG/WEBP，≤10MB，并限制最大像素分辨率（防内存溢出，建议源图 ≤ 4096×4096）；纯前端处理，图片不上传服务器（隐私卖点 + 零带宽成本）。
2. **色彩匹配算法（v0.4 明确规范）**：
   - **放弃 RGB 欧氏距离匹配**，将源图与方块色板的 RGB 值转换至 **CIELAB 色彩空间**；
   - 使用 **CIEDE2000** 色差公式遍历匹配 `blocks-palette.json` 中每个方块的**平均颜色**（色板数据需预计算 LAB 值缓存，避免每次转换重复计算）；
   - 色板内容：Minecraft 1.12+ 混凝土/陶土/羊毛/玻璃等可获取方块（对齐 utilitycove 的 "80 blocks" 宣传点，我们可做到 80–100 种并支持手动勾选排除）。
3. **像素化参数**：输出分辨率预设（16/32/64/128/256 + 自定义宽高）、色板选择（完整方块色板 / 16 色染料 / 自定义子集）、抖动算法开关（Floyd–Steinberg / 无）、亮度/对比度/饱和度微调。
4. **实时预览**：Canvas 渲染方块效果；支持滚轮缩放/平移（桌面）与双指缩放（移动端）；可放大查看单方块。
5. **导出（v0.4 扩展为全平台矩阵）**：

| 目标人群 | 格式 | 实现要点 | 里程碑 |
|---|---|---|---|
| 所有用户 | 像素画 PNG（含/不含网格线与坐标轴） | Canvas 离屏绘制，底部可附材料清单 | M1 |
| 原版生存玩家 | 材料清单（CSV/文本：方块种类与数量） | 由方块矩阵统计 | M1 |
| Java 1.13+ 玩家 | **.schem**（Sponge NBT 规范） | 开源库（如 prismarine-schematic 类）或自实现 NBT 序列化；WorldEdit 直读 | M2 |
| 生电/建筑圈 | **.litematic**（Litematica regions 嵌套 NBT） | 同上，遵循 Litematica 格式 | M2 |
| **基岩版玩家（手机/主机/Win10）** | **.mcstructure**（独家卖点） | 基岩版结构方块格式；移动端支持"用 Minecraft 打开"直接唤醒游戏——**三竞品均未覆盖基岩版，差异化空白** | M2 |
| 皮肤需求 | 64×64 皮肤 PNG | 符合皮肤 UV 规范 | M2 |

6. **3D 预览（P1）**：Three.js 渲染方块画/皮肤/litematic 3D 效果。

### 6.2 内容功能（P1）
- **网格模板库（新增，程序化 SEO）**：种子数据 = 精选 100–300 个热门图案（动物/食物/游戏角色/建筑，注意版权：优先原创图案与 CC0 素材）；每模板存储：网格矩阵、调色板、方块清单、难度标签、尺寸；页面模板渲染 + "用生成器打开此图案" CTA；支持 sitemap 批量生成。
- 教程中心：MDX 编写，图文 + 内嵌视频 + 步骤结构化；地图教程集群按 2.3 节 B 簇词规划。
- FAQ：每工具页底部 5–8 条常见问题（结构化数据），含 "how many pixels is a minecraft block → 16×16" 类基础问题。
- 作品画廊：用户自愿上传成品（缩略图 + 标题 + 难度标签），带审核队列；画廊条目可一键"查看模板"。

### 6.3 通用功能
- 移动端适配（Trends 显示大量新兴市场移动流量，竞品设备占比 32–46% 为移动端）。
- 多语言：EN 默认，**第一波 JA/ZH**（竞品验证），第二波 KO/PT。
- 深色模式；工具参数本地记忆（localStorage：语言偏好、上次勾选的方块调色板、输出尺寸）。

### 6.4 UI/UX 与移动端优先规范（v0.4 新增）
- **移动端（Mobile-First）**：全屏显示预览画布；所有控制项（尺寸滑块、算法选择、调色板勾选、导出按钮）收纳于**底部吸附抽屉（Bottom Sheet）**，支持上滑展开——shadcn/ui `Drawer` 组件实现。
- **桌面端**：经典"左侧控制栏 + 右侧大预览区"分栏布局。
- **画布操控**：桌面支持滚轮缩放、中键平移；移动端支持双指缩放（Pinch-to-zoom）与单指拖拽。
- **加载反馈**：Worker 运算期间主线程 UI 显示带百分比进度的骨架屏/Loading 动画（进度通过 Worker postMessage 上报）。
- **性能红线**：算法运算必须在 Web Worker 中进行，主线程只做渲染与交互，杜绝长任务阻塞 INP。

### 6.5 静态资源规范：方块图标采用雪碧图方案（v0.4 决策）
**决策：使用单张雪碧图（Sprite Atlas）+ JSON 清单，不采用 Base64 内嵌 JSON 字典。**

理由：
1. Base64 使体积膨胀 ~33%，几十上百个方块图标内嵌会显著拖慢首屏 JS 与 JSON 解析；雪碧图仅一次图片加载。
2. 雪碧图是独立静态资源，浏览器/CDN 缓存友好；视觉资源与元数据分离，升级互不影响（`atlas-v2.png` 平行发布）。
3. Canvas `drawImage(atlas, sx, sy, sw, sh, dx, dy, dw, dh)` 裁切绘制性能最优，与 Worker 流水线天然配合。
4. 后续扩展（多版本色板、模板缩略图、UI 图标）路径清晰。

资源结构：

```text
/public
  /atlas
    blocks-atlas-v1.png          # 所有方块图标雪碧图
    blocks-atlas-v1@2x.png       # 高分屏版本
  /data
    blocks-palette-v1.json       # 元数据清单（含预计算 LAB 值）
```

`blocks-palette.json` 数据结构示例：

```json
{
  "version": "v1",
  "mcVersion": "1.20+",
  "blocks": [
    {
      "id": "minecraft:stone",
      "name": { "en": "Stone", "zh": "石头", "ja": "石" },
      "x": 0, "y": 0, "w": 16, "h": 16,
      "lab": [53.6, 0.0, 0.0],
      "avgColor": "#7d7d7d",
      "category": "natural",
      "obtainable": true
    }
  ]
}
```

> 说明：LAB 值在构建期预计算写入 JSON（Worker 运行时零等待）；`obtainable` 对应竞品的"排除不可获得方块"开关。Base64 仅限 ≤3KB 的极小 UI 状态图标场景。

---

## 7. SEO 与流量获取（硬性）

| 类别 | 要求 |
|---|---|
| 渲染 | 全站 SSG/SSR（工具交互部分客户端水合）；禁止纯 CSR 落地页 |
| 结构化数据 | 每个工具页 `SoftwareApplication`；教程页 `HowTo`；FAQ 页/模块 `FAQPage`（竞品 utilitycove 已在 FAQ 上抢结构化位）；全站 `BreadcrumbList`、`Organization`/`WebSite` |
| Meta | 每页独立 title/description（模板化）；canonical；OG/Twitter 卡片 |
| Sitemap | `sitemap.xml` 自动生成（含所有工具页、教程、模板、博客）；`robots.txt`；**llms.txt**（面向 AI 答案引擎） |
| 多语言 | `hreflang` 标签；URL 路径子目录；**第一波 JA/ZH**（竞品数据显示 JA 9.9% + ZH 7.9% 流量贡献），第二波 KO/PT |
| 性能 | Core Web Vitals 达标：LCP < 2.5s、INP < 200ms、CLS < 0.1；工具 JS 按需加载；图片全部 AVIF/WebP |
| 内链 | 工具页 ↔ 教程页 ↔ 模板库 ↔ 画廊互链（对标 utilitycove "Related Tools" 卡片模式）；面包屑导航 |
| 工具页内容结构 | 工具预览区下方固定渲染三段富文本："How it works" 说明 + FAQ（5–8 条，配 FAQPage 结构化数据）+ Related Tools 网格——为 SSR 硬编码渲染，不进客户端组件 |
| 外链/AEO | GitHub 开源核心转换组件（minecraft-dot.pictures 从 github.com/discord.com 各获 1.8% 引流，可复制）；FAQ 首句直接给答案，便于 AI Overviews / ChatGPT 引用 |
| 监控 | Google Search Console、GA4；上线后每周跟踪词族排名与竞品新页面 |

---

## 8. 技术选型建议

| 层 | 推荐方案 | 理由 |
|---|---|---|
| 前端框架 | **Next.js（App Router）+ TypeScript + Tailwind CSS + shadcn/ui** | SSG/SSR、ISR、SEO 生态成熟、图片优化内置；shadcn 无头组件（Drawer/Slider/Switch）契合移动端交互 |
| 图像处理 | **Web Worker + OffscreenCanvas + Canvas API**（LAB/CIEDE2000 量化，见 6.1）；Three.js（3D 预览）；NBT 序列化用开源库（prismarine-nbt 类）或自实现 Sponge 规范，注意浏览器端 Buffer 兼容 | 主线程零阻塞；数据不出浏览器、零服务器成本、隐私；Worker 不可用时回退主线程执行 |
| 状态管理 | **Zustand** | 轻量管理上传图片数据、调色板勾选状态、输出尺寸等跨组件状态 |
| 国际化 | **next-intl** | 静态文案翻译 + `[lang]` 路由，配合 SSG |
| 后端 | Next.js Route Handlers（轻量 API：画廊、反馈、计数）；如无动态需求可几乎无后端 | 降低运维成本 |
| 数据库/存储 | Cloudflare D1 或 Supabase(Postgres) + R2（画廊图片对象存储） | 免费额度充足 |
| 部署 | **Cloudflare Pages** 或 Vercel | 全球 CDN（覆盖新兴市场）、免费 SSL、自动构建 |
| 分析 | GA4 + Search Console + Plausible（可选） | 流量与排名监控 |

---

## 9. 页面优先级与里程碑（v0.3 修订）

| 里程碑 | 交付 | 对应关键词/竞品依据 |
|---|---|---|
| M1（2 周） | 生成器主工具（首页 + /pixel-art-generator + /image-to-pixel-art）：实时预览、色板勾选、尺寸预设、PNG/网格图/方块清单导出 + 基础 SEO + AdSense 位预留 | 主词 4.4K/C；utilitycove 81% 流量来自同款页面，证明单页可扛全站 |
| M2（4 周） | **全平台导出矩阵（.schem/.litematic/.mcstructure）** + 地图教程集群 4 篇 + FAQ + /image-to-map-art + 皮肤转换器 | 竞品验证导出是核心卖点（utilitycove FAQ 前两条即导出问题）；教程词族 10.8K 无竞品承接；.mcstructure 为独家差异化 |
| M3（6 周） | 网格模板库（首批 50–100 模板）+ 画廊 + **多语言框架（JA/ZH）** | minecraftart.net 多语言贡献 23%+ 流量；JA 9.9%/ZH 7.9% 已验证 |
| M4（8 周+） | **在线 litematic 3D 查看器**、头像生成器、相邻利基落地页（LEGO/十字绣/串珠）、变现全量接入 | minecraftart.net 的 litematic-viewer 页面增长 +487%；utilitycove 靠多利基矩阵起量 |
| 观察名单 | 查询类小工具（ore finder、command help、coordinates） | minecraftart +487%/+831% 增长页、minecraft-dot 14K 流量，但与主定位稍远，视团队产能决定 |

**v0.3 变更说明**：`.schem/.litematic` 导出从 M4 提前到 M2（两个竞品的 FAQ/增长页均指向该需求为转化关键）；多语言第一波由 JA/PT/VI/HI/ES 修改为 **JA/ZH**（唯一被竞品数据验证的组合）；新增 litematic 查看器与相邻利基两个二期模块。

## 10. 风险与注意事项
1. **版权与商标**：Minecraft 为 Mojang 商标，页面文案避免暗示官方出品，遵守 Mojang 使用指引；模板库图案**必须原创或 CC0**（竞品 utilitycove 的 Related Tools 中出现 Mario 等角色模板属侵权高危操作，不要跟随）；用户上传内容需声明版权责任。
2. **执行窗口风险（新增）**：utilitycove 仅用 6 个月达到 12.8 万访问/月并仍在 +187% 增长，minecraftart.net 用 254 天达到 6.25 万——该窗口正在被新站快速填补，**建议 2 个月内完成 M1**，先占 `minecraft pixel art generator`（KD 12）与 `picture to minecraft converter`（KD 1）。
3. **数据口径风险（新增）**：竞品数据来自 SimilarWeb/traffic.cv 估算（两平台间本身相差可达 20%+），且 keyword 容量 vs 流量比异常（如 utilitycove 用 6.5K 流量承接 14.1K 容量的泛词），规划时以趋势与结构为准，不锚定绝对值；关键决策点建议用 SEMrush Organic Research 复核一遍三竞品的关键词交集。
4. **高 CPC 词的广告合规**：$18.20 CPC 说明该词广告竞争激烈，AdSense 收益潜力大，但需保证页面加载速度与广告密度平衡。
5. **教程词的意图落差**：`how to make a map in minecraft` 等词的原始意图是"游戏内合成地图物品"，教程必须先 100% 回答该问题（配方、步骤），再顺势引出地图艺术工具——直接堆工具广告会导致跳出率高、排名下滑。
6. **模板化页面的质量红线**：/grid-templates 与多语言子目录是程序化 SEO，若只做浅层翻译/套壳会被判定 doorway pages（minecraft-dot.pictures 的 /ja 被标记"削减"即前车之鉴），每个语言版本需独立本地化文案而非机器直译。
7. **AI 辅助内容的质量红线（v0.4 新增）**：博客与长尾页可由 AI 辅助起草（初期目标 10–15 篇），但**必须人工审校并事实核查**（游戏版本号、合成配方、模组名称等随版本快速变化，AI 极易过时/幻觉）；E-E-A-T 信号（作者署名、实截图）决定教程词群的长期排名，纯机发内容不值得做。
8. **浏览器兼容（v0.4 新增）**：OffscreenCanvas 在较旧浏览器（Safari <16.4 等）不可用，Worker 内检测失败时需回退主线程运算 + 分片 `requestIdleCallback` 处理，保证功能不缺失。
