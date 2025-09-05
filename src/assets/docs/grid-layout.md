# 网格布局(grid)

CSS Grid 布局（Grid Layout）是一个**二维**的布局系统，相比传统的布局方法（如 float、inline-block、positioning 或 flex），Grid 布局可以同时处理行和列，使得复杂的页面结构变得简洁而直观。`display: grid;` 是 CSS 中用于创建网格布局的强大工具，它允许你将容器元素转换为网格容器，其直接子元素成为网格项，通过二维网格（行和列）来精确控制布局。
网格布局特别适合创建复杂的二维布局，如仪表盘、画廊、卡片布局等，相比传统布局方式更加灵活和强大。

### 核心属性及用法

#### 1. 网格容器属性

- `display: grid;`：将元素定义为网格容器，其子元素自动成为网格项

  ```css
  .container {
    display: grid;
  }
  ```

- `grid-template-columns`：定义列的数量和宽度

  ```css
  .container {
    grid-template-columns: 100px 200px auto; /* 3列，宽度分别为100px、200px和自适应 */
    grid-template-columns: repeat(3, 1fr); /* 3列，每列宽度相等 */
  }
  ```

- `grid-template-rows`：定义行的数量和高度

  ```css
  .container {
    grid-template-rows: 100px 200px; /* 2行，高度分别为100px和200px */
    grid-template-rows: repeat(2, minmax(100px, auto)); /* 2行，最小100px */
  }
  ```

- `gap` / `grid-gap`：设置网格项之间的间距（行间距和列间距）

  ```css
  .container {
    gap: 10px; /* 行和列间距都是10px */
    gap: 10px 20px; /* 行间距10px，列间距20px */
  }
  ```

- `grid-template-areas`：通过命名区域布局（配合 `grid-area` 使用）

  ```css
  .container {
    grid-template-areas:
      'header header'
      'sidebar main'
      'footer footer';
  }
  ```

- `justify-items` / `align-items`：网格项在其单元格内的对齐方式

  ```css
  .container {
    justify-items: center; /* 水平方向居中 start、end、center、stretch */
    align-items: center; /* 垂直方向居中 start、end、center、stretch */
  }
  ```

- `justify-content` / `align-content`：整个网格在容器中的对齐方式
  ```css
  .container {
    justify-content: center; /* 水平方向居中 start、end、center、space-between、space-around、space-evenly */
    align-content: center; /* 垂直方向居中 start、end、center、space-between、space-around、space-evenly */
  }
  ```
- `grid-auto-columns` / `grid-auto-rows`：自动创建的网格项的列宽/行高

  ```css
  .container {
    grid-auto-columns: 100px; /* 自动创建的网格项的列宽为100px */
    grid-auto-rows: 100px; /* 自动创建的网格项的行高为100px */
  }
  ```

- `grid-auto-flow`：自动布局算法，决定网格项如何填充网格

  ```css
  .container {
    grid-auto-flow: row; /* 按行填充（默认） */
    grid-auto-flow: column; /* 按列填充 */
    grid-auto-flow: dense; /* 填充时尽量填充已存在的网格项,使用一种“稠密”堆积算法，如果后面出现了稍小的元素，则会试图去填充网格中前面留下的空白。这样做会填上稍大元素留下的空白，但同时也可能导致原来出现的次序被打乱。如果省略它，使用一种「稀疏」算法，在网格中布局元素时，布局算法只会「向前」移动，永远不会倒回去填补空白。这保证了所有自动布局元素「按照次序」出现，即使可能会留下被后面元素填充的空白。 */
    grid-auto-flow: row dense; /* 按行填充，且尽量填充已存在的网格项 */
    grid-auto-flow: column dense; /* 按列填充，且尽量填充已存在的网格项 */
  }
  ```

#### 2. 网格项属性

- `grid-column` / `grid-row`：指定网格项占据的列/行范围

  ```css
  .item {
    grid-column: 1 / 3; /* 从第1列开始，到第3列结束（跨越2列） */
    grid-row: 1 / 2; /* 占据第1行 */
  }
  ```

  - grid-column: 1 / 3;：这是网格子元素的属性，用于指定元素在列方向上的占据范围，值由两个部分组成：起始列线 / 结束列线。
  - 在 1fr 1fr 的布局中，网格会自动生成 3 条列线（列线数量 = 列数 + 1）：
    - 第 1 条列线：容器最左侧边缘
    - 第 2 条列线：两列之间的分隔线（容器中间）
    - 第 3 条列线：容器最右侧边缘
  - 因此 1 / 3 表示：元素从第 1 条列线开始，到第 3 条列线结束，刚好跨越了整个容器的两列，最终占满 100% 宽度。

- `grid-column-start` / `grid-row-start`：指定网格项占据的列/行开始位置

  ```css
  .item {
    grid-column-start: 1; /* 从第1列开始 */
    grid-row-start: 1; /* 从第1行开始 */
  }
  ```

- `grid-column-end` / `grid-row-end`：指定网格项占据的列/行结束位置

  ```css
  .item {
    grid-column-end: 3; /* 占据第3列 */
    grid-row-end: 2; /* 占据第2行 */
  }
  ```

- `grid-area`：指定网格项属于哪个命名区域（配合 `grid-template-areas` 使用）

  ```css
  .header {
    grid-area: header;
  }
  ```

- `justify-self` / `align-self`：单个网格项在其单元格内的对齐方式
  ```css
  .item {
    justify-self: end; /* 单元格内水平靠右 start、end、center、stretch */
    align-self: center; /* 单元格内垂直居中 start、end、center、stretch */
  }
  ```

### 单位与函数

- `fr`：比例单位，分配剩余空间（`1fr` 表示一份）
- `repeat()`：重复创建相同配置的列或行
- `minmax(min, max)`：设置尺寸范围
- `auto-fit` / `auto-fill`：自动调整列数以适应容器

### 示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>grid-template-areas 示例</title>
    <style>
      .container {
        display: grid;
        /* 定义3列，比例为1:3:1 */
        grid-template-columns: 200px 1fr 200px;
        /* 定义3行，高度分别为80px、自动适应内容、60px */
        grid-template-rows: 80px 1fr 60px;
        /* 定义网格区域模板 */
        grid-template-areas:
          'header header header' /* 第一行：header区域横跨三列 */
          'sidebar main rightbar' /* 第二行：sidebar、main、rightbar各占一列 */
          'footer footer footer'; /* 第三行：footer区域横跨三列 */
        gap: 10px; /* 网格项之间的间距 */
        height: 100vh; /* 占满整个视口高度 */
        padding: 10px;
        box-sizing: border-box;
      }

      /* 各个区域的样式和grid-area设置 */
      .header {
        grid-area: header; /* 对应模板中的header区域 */
        background-color: #4caf50;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .sidebar {
        grid-area: sidebar; /* 对应模板中的sidebar区域 */
        background-color: #2196f3;
        color: white;
        padding: 15px;
      }

      .main {
        grid-area: main; /* 对应模板中的main区域 */
        background-color: #ff9800;
        color: white;
        padding: 15px;
      }

      .rightbar {
        grid-area: rightbar; /* 对应模板中的rightbar区域 */
        background-color: #f44336;
        color: white;
        padding: 15px;
      }

      .footer {
        grid-area: footer; /* 对应模板中的footer区域 */
        background-color: #9c27b0;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">头部区域</div>
      <div class="sidebar">左侧边栏</div>
      <div class="main">主内容区域</div>
      <div class="rightbar">右侧边栏</div>
      <div class="footer">底部区域</div>
    </div>
  </body>
</html>
```

### 上例中的grid-template-areas必须写三个header和footer的原因：

`grid-template-areas`的设计逻辑是 “可视化映射”：**你写的每一行字符串，都对应网格的一行；字符串中的每个 “单词”（区域名），都对应网格的一个单元格**（由`grid-template-columns`和`grid-template-rows`分割出来的最小单位）。要让一个元素 “横跨多列”，本质就是让它 “占据多个连续的单元格”—— 而这些单元格，就需要用相同的区域名来标识。所以 “3 列横跨” 就需要 3 个相同的区域名，“2 列横跨” 就需要 2 个，以此类推。这种写法看似 “冗余”，实则是grid-template-areas“可视化布局” 设计的核心 —— 通过重复区域名，你能直观地看到 “这个元素占了几列”，反而比其他复杂属性（如grid-column）更易读。

找了一篇文章[最强大的 CSS 布局 —— Grid 布局](https://juejin.cn/post/6854573220306255880)，可以参考。
