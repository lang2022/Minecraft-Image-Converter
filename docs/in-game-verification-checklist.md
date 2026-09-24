# 导出文件游戏内实测清单

> 用途：M2 导出矩阵（.schem / .litematic / .mcstructure）的端到端验收。
> 原则：每个格式先做"最小可控样本"（8×8 纯色块阵），再做"真实样本"（你实际转的图），问题才能定位到格式层还是数据层。

---

## 0. 生成测试样本

1. 启动 `npm run dev`，打开 `/pixel-art-generator`。
2. 上传一张**强对比、四象限颜色**的测试图（左上红/右上绿/左下蓝/右下黄），选 **16×16**，关闭抖动。
3. 分别点击三个导出按钮，得到：
   - `xxx.schem`（WorldEdit / FAWE）
   - `xxx.litematic`（Litematica）
   - `xxx.mcstructure`（基岩版结构方块）

> 为什么用四象限图：如果某个格式把坐标轴搞反（x/y 颠倒、上下翻转），四个色块的位置会明显错位，比随机图案容易判断得多。16×16 时每个象限 8×8，肉眼即可核对。

---

## 1. `.schem` — Java 版 + WorldEdit/FAWE

### 环境要求
- Minecraft **Java 1.20.1**（与导出的 DataVersion 3465 一致；其他 1.13+ 版本 WorldEdit 会自动转换，但首次验收建议用同版本排除变量）
- 单人世界开启作弊，或安装了 WorldEdit/FAWE 的服务端

### 步骤
1. 找到 schematics 目录：
   - 单人：`.minecraft/config/worldedit/schematics/`
   - 服务端：`plugins/WorldEdit/schematics/`（FAWE 同路径）
2. 把 `xxx.schem` 放进去。
3. 进游戏，执行：
   ```
   //schem load xxx
   //paste
   ```
   （输入 `//schem list` 应能看到文件名）

### 预期结果
- [ ] `//schem load` 能列出并加载，无报错
- [ ] `//paste` 粘贴出 16×16×1 的一层方块
- [ ] **四个象限颜色方位正确**（红在左上——注意粘贴后你面对的方向，WorldEdit 以玩家朝向粘贴，若整体旋转 90°/180° 属于正常现象，镜像/颠倒才是 bug）
- [ ] 图案是"躺着"的一层（1 格深），不是竖着的墙
- [ ] `//copy` 后站在图案上看：图片的**顶部行**在**世界里较高的 y**（导出时做了上下翻转，顶部行 = 高 y；如果你看到图案上下颠倒，说明翻转逻辑有 bug，请回报）

### 常见失败症状 → 对应原因
| 症状 | 大概率原因 |
|---|---|
| load 时 "Unknown format" / 解析错误 | NBT 结构问题（gzip、根 compound 名、字段类型） |
| 加载成功但粘贴后缺方块/全空气 | BlockData varint 解码或调色板索引错位 |
| 图案上下颠倒 | 导出时 y 翻转方向写反 |
| 颜色错乱但形状正确 | Palette 索引与 BlockData 对不上 |

---

## 2. `.litematic` — Java 版 + Litematica

### 环境要求
- Minecraft Java 1.20.1 + Fabric + **Litematica** mod（+ MaLiLib 依赖）

### 步骤
1. 放入 `.minecraft/schematics/` 目录。
2. 进游戏，按 `M`（Litematica 菜单）→ **Load Schematics** → 选中 `xxx.litematic` → 点击加载。
3. 加载后按 `M` → Schematic Placement，确认已放置；可开启 "Schematic Veil/Outline" 查看轮廓。

### 预期结果
- [ ] 列表能看到文件并能正常加载（无 "failed to parse" 弹窗）
- [ ] 菜单里 Region 信息显示 Size: 16×16×1、RegionCount: 1
- [ ] 幽灵方块轮廓与原图四个象限方位一致
- [ ] 若用 "Paste Schematic using Schematica-style printer" 或手动摆放，最终成品颜色正确

### 常见失败症状 → 对应原因
| 症状 | 大概率原因 |
|---|---|
| 加载报错 / 列表里显示损坏 | 非跨 long 位打包（BlockStates）或 bits 计算与 Litematica 预期不符 |
| 能加载但整体变一色 | palette list 结构（BlockStatePalette 的 Name 字段）问题 |
| 高度方向颠倒 | y 翻转问题（同 .schem） |

---

## 3. `.mcstructure` — 基岩版（手机/平板/Win10）

### 环境要求
- 基岩版（1.20+），任意平台
- 一个开启作弊/实验玩法的本地世界（结构方块仅作弊可用）

### 步骤
1. 找到世界的 structures 目录：
   - Win10：`%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\minecraftWorlds\<世界ID>\structures\`
   - 手机（Android）：`Android/data/com.mojang.minecraftpe/files/games/com.mojang/minecraftWorlds/<世界ID>/structures/`
   - iOS 通过"文件"App 类似路径访问
2. 把 `xxx.mcstructure` 放进 `structures/` 下（可建子文件夹如 `mytests/`）。
3. 进入该世界（确保作弊开启），执行：
   ```
   /structure load mytests/xxx ~ ~ ~
   ```
   （站在空地上执行；或用结构方块：Place 模式设为 Load，填入路径 `mytests:xxx`）

### 预期结果
- [ ] 命令/结构方块加载成功，无 "structure could not be found" 报错
- [ ] 生成 16×16×1 一层方块
- [ ] 四象限方位正确（基岩 /structure load 以命令执行点为原点，不含旋转）
- [ ] 图片顶部行在较高 y

### 常见失败症状 → 对应原因
| 症状 | 大概率原因 |
|---|---|
| 报错找不到结构 | 文件放错世界目录 / 路径名带扩展名 |
| 加载成功但方块全变成同一种 | block_palette 结构或 block_indices 索引错位 |
| 加载成功但多了一层"水" | layer 1 未全填 -1 |
| 形状对但整体镜像 | x 轴方向与基岩迭代顺序理解相反（需要回报，这个我们按 x→z→y 外层 y 实现） |

---

## 4. 三平台横向核对矩阵

用同一张四象限图在三个平台各自导出、加载后，按此表打勾：

| 检查项 | .schem | .litematic | .mcstructure |
|---|---|---|---|
| 文件能被工具识别/加载 | ☐ | ☐ | ☐ |
| 尺寸 16×16×1 | ☐ | ☐ | ☐ |
| 四象限方位正确 | ☐ | ☐ | ☐ |
| 上下方向正确（顶行在高 y） | ☐ | ☐ | ☐ |
| 颜色与预览 canvas 一致 | ☐ | ☐ | ☐ |
| 1 格深（躺平不立墙） | ☐ | ☐ | ☐ |

全绿 = M2 导出矩阵验收通过。

---

## 5. 发现问题后怎么反馈

最有效的 bug 报告包含：

1. **格式 + 加载工具 + 工具版本**（如 `.schem + FAWE 2.x + Paper 1.20.1`）
2. **症状归类**（上表哪一行，或"其他"）
3. **测试图描述**（四象限图还是真实图片；真实图片的话描述"哪边应该是什么颜色、实际是什么"）

这三个信息足够我定位到：NBT 结构层、调色板/索引层、还是坐标翻转层——不用重新推导整个格式。

---

## 附：文件放不进目录时的快速自查

- **WorldEdit 找不到文件**：确认扩展名是 `.schem` 而不是 `.schem.txt`（浏览器下载常见问题）
- **基岩世界目录有两个世界**：`minecraftWorlds` 下每个文件夹是一个世界，看 `levelname.txt` 确认是目标世界
- **Litematica 列表为空**：确认放在 `.minecraft/schematics/`（不是 `config/` 下），且游戏内路径设置指向该目录
