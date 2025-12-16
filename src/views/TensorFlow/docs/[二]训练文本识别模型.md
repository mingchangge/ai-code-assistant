# GooleColab训练文本识别模型

好的，我们现在进入实战阶段。您已经拥有了高质量的合成数据集，接下来的目标是在 Google Colab 上进行高效、可中断、可恢复的模型训练，并将所有重要成果（模型权重、日志）安全地保存在您的 Google Drive 中。

这份指南将为您提供**一步不差、可直接复制粘贴**的完整流程。

## 前提条件

1.  **准备数据集**: 将您生成的 `synthetic_ocr_dataset_final` 文件夹压缩成一个 `.zip` 文件，例如 `ocr_dataset.zip`。
2.  **Google 账号**: 用于访问 Google Colab 和 Google Drive。

## 阶段一：设置 Colab 和 Google Drive 环境

### 步骤 1: 创建 Notebook 并挂载 Drive

1.  打开 [Google Colab](https://colab.research.google.com/) 并创建一个新的 Notebook。
2.  **【关键】启用 GPU**: 点击菜单 `Runtime` -> `Change runtime type` -> 在 `Hardware accelerator` 中选择 `T4 GPU` -> `Save`。
3.  **【关键】挂载 Google Drive**: 运行以下代码单元格，并按照提示完成授权。这使得 Colab 可以像读写本地文件一样访问您的云端硬盘。

    ```python
    # Cell 1: Mount Google Drive
    from google.colab import drive
    drive.mount('/content/drive')
    ```

### 步骤 2: 创建项目文件夹并上传数据

1.  在您的 Google Drive **网页版** 中，创建一个项目主文件夹，例如 `Colab_OCR_Project`。
2.  将您本地的 `ocr_dataset.zip` 上传到这个 `Colab_OCR_Project` 文件夹中。
3.  **定义项目路径**: 在 Colab 中运行此单元格，设定好所有路径。**这是确保所有文件都保存在 Drive 中的核心步骤。**

    ```python
    # Cell 2: Define Project Paths
    import os

    # 这是您在 Google Drive 中的项目根目录
    PROJECT_ROOT = '/content/drive/MyDrive/Colab_OCR_Project'

    # 定义数据、模型权重和日志的存放路径
    DATA_PATH = os.path.join(PROJECT_ROOT, 'data')
    CHECKPOINT_PATH = os.path.join(PROJECT_ROOT, 'checkpoints')
    ONNX_EXPORT_PATH = os.path.join(PROJECT_ROOT, 'onnx_export')

    # 创建这些目录（如果它们不存在）
    os.makedirs(DATA_PATH, exist_ok=True)
    os.makedirs(CHECKPOINT_PATH, exist_ok=True)
    os.makedirs(ONNX_EXPORT_PATH, exist_ok=True)

    print(f"✅ 项目目录结构已在 Google Drive 中设置完毕:\n- 数据集: {DATA_PATH}\n- 模型保存: {CHECKPOINT_PATH}")
    ```

### 步骤 3: 解压数据集

我们将数据集从 Drive 的压缩包解压到 Colab 的**临时**存储中，这样在训练时读取速度最快。

```python
# Cell 3: Unzip Dataset
import zipfile

dataset_zip_path = os.path.join(PROJECT_ROOT, 'ocr_dataset_final.zip')
unzip_target_path = '/content/ocr_dataset' # 解压到Colab本地，读取速度快

# 检查是否已解压，避免重复操作
if not os.path.exists(unzip_target_path):
    print(f"解压数据集从 {dataset_zip_path} 到 {unzip_target_path}...")
    with zipfile.ZipFile(dataset_zip_path, 'r') as zip_ref:
        zip_ref.extractall('/content/')
    print("✅ 解压完成！")
else:
    print("✅ 数据集已存在，跳过解压。")
```

## 阶段二：编写完整的 PyTorch 训练代码

现在，我们将逐步构建训练脚本。请按顺序将这些代码块粘贴到新的 Colab 单元格中。

### 步骤 1: 安装依赖并导入库

```python
# Cell 4: Install Dependencies & Import Libraries
!pip install torch torchvision tqdm python-Levenshtein -q

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import cv2
import numpy as np
from tqdm.auto import tqdm
import Levenshtein # 用于计算字符错误率
```

### 步骤 2: 配置与字符集定义

```python
# Cell 5: Configuration & Charset
# --- 训练配置 ---
IMG_WIDTH = 256
IMG_HEIGHT = 64
EPOCHS = 100 # 可根据收敛情况调整
BATCH_SIZE = 128 # 根据 Colab GPU 内存调整，T4 GPU 128 通常可以
LEARNING_RATE = 0.0005
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"使用设备: {DEVICE}")

# --- 字符集 ---
# 确保这里的字符集与数据生成脚本中的完全一致！
CHARSET = "0123456789.%BMI对比上次测量体重公斤脂肪率水分骨骼肌蛋白质肉内脏指数皮下去身年龄型基础代谢活动建议控制偏胖高低标准肥大卡隐形微稍瘦强壮过力发达"

# --- 字符映射 ---
# 0 保留给 CTC 的 'blank' token
char_to_int = {char: i + 1 for i, char in enumerate(CHARSET)}
int_to_char = {i + 1: char for i, char in enumerate(CHARSET)}
NUM_CLASSES = len(CHARSET) + 1 # +1 for the blank token
```

### 步骤 3: 数据集类 (Dataset Class)

```python
# Cell 6: PyTorch Dataset Class
class OCRDataset(Dataset):
    def __init__(self, data_root, char_map, transform=None):
        self.data_root = data_root
        self.transform = transform
        self.char_map = char_map
        self.image_paths = []
        self.labels = []

        with open(os.path.join(data_root, 'labels.txt'), 'r', encoding='utf-8') as f:
            for line in f:
                path, label = line.strip().split('\t')
                # 过滤掉无法编码的标签
                if all(c in self.char_map for c in label):
                    self.image_paths.append(os.path.join(data_root, path))
                    self.labels.append(label)

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        image = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        image = cv2.resize(image, (IMG_WIDTH, IMG_HEIGHT))

        if self.transform:
            image = self.transform(image)

        encoded_label = [self.char_map[char] for char in label]

        return image, torch.IntTensor(encoded_label), len(encoded_label)

# --- 图像预处理 ---
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

# --- 数据加载器 (DataLoaders) ---
def collate_fn(batch):
    images, labels, label_lengths = zip(*batch)
    images = torch.stack(images, 0)
    labels = torch.cat(labels, 0)
    label_lengths = torch.IntTensor(list(label_lengths))
    return images, labels, label_lengths

full_dataset = OCRDataset('/content/synthetic_ocr_dataset_final', char_to_int, transform=transform)
train_size = int(0.9 * len(full_dataset))
val_size = len(full_dataset) - train_size
train_dataset, val_dataset = torch.utils.data.random_split(full_dataset, [train_size, val_size])

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn, num_workers=2)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, collate_fn=collate_fn, num_workers=2)

print(f"数据集拆分: {len(train_dataset)} 训练, {len(val_dataset)} 验证")
```

### 步骤 4: CRNN 模型架构

这里我们使用一个带有**残差连接 (ResNet block)** 的更强大的CNN主干，能有效提升特征提取能力。

```python
# Cell 7: Advanced CRNN Model Architecture
class ResBlock(nn.Module):
    def __init__(self, in_channels):
        super(ResBlock, self).__init__()
        self.conv1 = nn.Conv2d(in_channels, in_channels, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(in_channels)
        self.relu = nn.ReLU()
        self.conv2 = nn.Conv2d(in_channels, in_channels, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(in_channels)

    def forward(self, x):
        residual = x
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += residual
        return self.relu(out)

class CRNN(nn.Module):
    def __init__(self, num_classes):
        super(CRNN, self).__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 32, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d(2, 2), # 32x32x128
            nn.Conv2d(32, 64, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d(2, 2), # 64x16x64
            ResBlock(64),
            nn.Conv2d(64, 128, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d((2, 2), (2, 1)), # 128x8x64
            ResBlock(128),
            nn.Conv2d(128, 256, 3, 1, 1), nn.BatchNorm2d(256), nn.ReLU(True), nn.MaxPool2d((2, 2), (2, 1)), # 256x4x64
            nn.Conv2d(256, 512, 3, 1, 1), nn.BatchNorm2d(512), nn.ReLU(True),
            nn.Conv2d(512, 512, (4, 1), 1, 0), nn.BatchNorm2d(512), nn.ReLU(True) # 512x1x64
        )
        self.rnn = nn.LSTM(512, 256, num_layers=2, bidirectional=True, dropout=0.5)
        self.fc = nn.Linear(512, num_classes)

    def forward(self, x):
        conv = self.cnn(x)
        b, c, h, w = conv.size()
        assert h == 1, "the height of conv feature should be 1"
        conv = conv.squeeze(2).permute(2, 0, 1) # [w, b, c]
        rnn, _ = self.rnn(conv)
        output = self.fc(rnn)
        return output
```

#### 步骤 8: 训练与验证核心逻辑

```python
# Cell 8 (Fixed): Training & Validation Core Logic

def decode_ctc_output(preds, int_to_char_map):
    """Greedy CTC decoder."""
    decoded_preds = []
    preds = preds.permute(1, 0, 2) # [batch, seq_len, classes]
    for pred in preds:
        pred_indices = pred.argmax(dim=-1)
        # 移除连续重复和 blank token
        collapsed_indices = [p for i, p in enumerate(pred_indices) if p != 0 and (i == 0 or p != pred_indices[i-1])]
        decoded_text = "".join([int_to_char_map.get(p.item(), '') for p in collapsed_indices])
        decoded_preds.append(decoded_text)
    return decoded_preds

def train_one_epoch(model, optimizer, criterion, data_loader, device):
    model.train()
    total_loss = 0
    progress_bar = tqdm(data_loader, desc='Training', leave=False)
    for images, labels, label_lengths in progress_bar:
        # ==================== FIX START ====================
        # 将所有张量移动到指定的设备 (GPU)
        images = images.to(device)
        labels = labels.to(device)
        label_lengths = label_lengths.to(device)
        # ===================== FIX END =====================

        preds = model(images) # [seq_len, batch, classes]

        # ==================== FIX START ====================
        # preds_size 也需要移动到 GPU
        preds_size = torch.IntTensor([preds.size(0)] * images.size(0)).to(device)
        # ===================== FIX END =====================

        loss = criterion(preds.log_softmax(2), labels, preds_size, label_lengths)

        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 5)
        optimizer.step()

        total_loss += loss.item()
        progress_bar.set_postfix(loss=loss.item())

    return total_loss / len(data_loader)


def validate(model, criterion, data_loader, device, int_to_char_map):
    model.eval()
    total_loss = 0
    total_correct = 0
    total_chars = 0
    total_samples = 0

    with torch.no_grad():
        for images, labels, label_lengths in tqdm(data_loader, desc='Validating', leave=False):
            # ==================== FIX START ====================
            # 将所有张量移动到指定的设备 (GPU)
            images = images.to(device)
            labels = labels.to(device)
            label_lengths = label_lengths.to(device)
            # ===================== FIX END =====================

            preds = model(images)

            # ==================== FIX START ====================
            # preds_size 也需要移动到 GPU
            preds_size = torch.IntTensor([preds.size(0)] * images.size(0)).to(device)
            # ===================== FIX END =====================

            loss = criterion(preds.log_softmax(2), labels, preds_size, label_lengths)
            total_loss += loss.item()

            decoded_preds = decode_ctc_output(preds, int_to_char_map)

            # 将 ground truth labels 解码回文本
            start = 0
            true_labels = []
            # 注意: 这里 labels 是一个 flattened tensor，所以需要用 label_lengths 来切片
            cpu_labels = labels.cpu() # 将标签移回CPU以便索引
            for length in label_lengths:
                true_labels.append("".join([int_to_char_map.get(i.item(), '') for i in cpu_labels[start:start+length]]))
                start += length

            for pred, true in zip(decoded_preds, true_labels):
                if pred == true:
                    total_correct += 1
                total_chars += Levenshtein.distance(pred, true)
                total_samples += 1

    avg_loss = total_loss / len(data_loader)
    accuracy = total_correct / total_samples
    char_error_rate = total_chars / total_samples # 平均每个样本的编辑距离

    return avg_loss, accuracy, char_error_rate
```

#### 步骤 9: 主训练循环 (支持中断和恢复)

这是整个流程的“指挥中心”，它负责加载模型、循环训练、验证并**将结果安全地保存到 Google Drive**。

```python
# Cell 9 (Patched): Main Training Loop with Checkpointing, Early Stopping & Visualization
import matplotlib.pyplot as plt
import random

# ==================================
# 1. 初始化模型、优化器等
# ==================================
model = CRNN(NUM_CLASSES).to(DEVICE)
optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE)
criterion = nn.CTCLoss(blank=0, reduction='mean', zero_infinity=True)

# ----------------- 修复点 START -----------------
# 移除了不支持的 'verbose=True' 参数，以兼容Colab的PyTorch版本
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.1, patience=5)
# ----------------- 修复点 END -------------------

# ==================================
# 2. 检查点和历史记录加载逻辑
# ==================================
start_epoch = 0
best_accuracy = 0.0
history = {
    'train_loss': [],
    'val_loss': [],
    'val_accuracy': [],
    'val_cer': []
}
early_stopping_patience = 15
early_stopping_counter = 0

checkpoint_file = os.path.join(CHECKPOINT_PATH, 'latest_checkpoint.pth')

if os.path.exists(checkpoint_file):
    print(f"发现检查点 {checkpoint_file}，加载中...")
    checkpoint = torch.load(checkpoint_file)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    # 即使 scheduler.load_state_dict 可能因版本不匹配而出错，也能优雅处理
    try:
        scheduler.load_state_dict(checkpoint.get('scheduler_state_dict'))
    except TypeError:
        print("警告：无法加载 scheduler 状态，可能由于版本不匹配。将使用默认 scheduler。")

    start_epoch = checkpoint['epoch'] + 1
    best_accuracy = checkpoint.get('best_accuracy', 0.0)
    history = checkpoint.get('history', history)
    early_stopping_counter = checkpoint.get('early_stopping_counter', 0)

    print(f"加载成功！将从第 {start_epoch} 轮开始训练。")
    print(f"当前最佳准确率: {best_accuracy:.4f}, 早停计数: {early_stopping_counter}/{early_stopping_patience}")
else:
    print("未发现检查点，将从头开始训练。")

# ==================================
# 3. 可视化函数 (保持不变)
# ==================================
def plot_history(history, save_path):
    """绘制并保存训练历史曲线图"""
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, axs = plt.subplots(1, 2, figsize=(18, 6))

    axs[0].plot(history['train_loss'], label='Train Loss', color='royalblue')
    axs[0].plot(history['val_loss'], label='Validation Loss', color='darkorange')
    axs[0].set_title('Model Loss', fontsize=16)
    axs[0].set_xlabel('Epoch', fontsize=12)
    axs[0].set_ylabel('Loss', fontsize=12)
    axs[0].legend()

    axs[1].plot(history['val_accuracy'], label='Validation Accuracy', color='forestgreen')
    axs[1].set_title('Model Accuracy', fontsize=16)
    axs[1].set_xlabel('Epoch', fontsize=12)
    axs[1].set_ylabel('Accuracy', fontsize=12)
    axs[1].legend()

    plt.tight_layout()
    plt.savefig(save_path)
    plt.show()

def visualize_predictions(model, data_loader, device, int_to_char_map, num_samples=5):
    """在验证集上随机抽取样本并展示预测结果"""
    model.eval()
    images, labels, label_lengths = next(iter(data_loader))
    images = images.to(device)

    indices = random.sample(range(images.size(0)), k=min(num_samples, images.size(0)))
    sample_images = images[indices]

    with torch.no_grad():
        preds = model(sample_images)

    decoded_preds = decode_ctc_output(preds, int_to_char_map)

    true_labels_full = []
    start = 0
    for length in label_lengths:
        true_labels_full.append("".join([int_to_char_map.get(i.item(), '') for i in labels[start:start+length]]))
        start += length
    sample_true_labels = [true_labels_full[i] for i in indices]

    fig, axes = plt.subplots(len(indices), 1, figsize=(10, 2 * len(indices)))
    if len(indices) == 1: axes = [axes]

    for i, ax in enumerate(axes):
        img = sample_images[i].cpu().squeeze().numpy()
        pred_text = decoded_preds[i]
        true_text = sample_true_labels[i]

        ax.imshow(img, cmap='gray')
        ax.set_title(f'Pred: "{pred_text}"\nTrue: "{true_text}"',
                     color='green' if pred_text == true_text else 'red',
                     fontsize=12)
        ax.axis('off')

    plt.tight_layout()
    plt.show()

# ==================================
# 4. 主训练循环 (保持不变)
# ==================================
print("🚀 开始主训练循环...")
for epoch in range(start_epoch, EPOCHS):
    train_loss = train_one_epoch(model, optimizer, criterion, train_loader, DEVICE)
    val_loss, val_accuracy, val_cer = validate(model, criterion, val_loader, DEVICE, int_to_char)

    print(f"\nEpoch [{epoch+1}/{EPOCHS}] | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
          f"Val Accuracy: {val_accuracy:.4f} | Val Avg CER: {val_cer:.4f}")

    # --- 监控学习率 ---
    # 由于移除了 verbose，我们可以在这里手动打印学习率
    current_lr = optimizer.param_groups[0]['lr']
    print(f"Current learning rate: {current_lr}")

    history['train_loss'].append(train_loss)
    history['val_loss'].append(val_loss)
    history['val_accuracy'].append(val_accuracy)
    history['val_cer'].append(val_cer)

    scheduler.step(val_accuracy)

    is_best = val_accuracy > best_accuracy
    if is_best:
        best_accuracy = val_accuracy
        best_model_path = os.path.join(CHECKPOINT_PATH, 'best_model.pth')
        torch.save(model.state_dict(), best_model_path)
        print(f"🎉 新的最佳模型！准确率: {best_accuracy:.4f}，已保存。早停计数器重置。")
        early_stopping_counter = 0
    else:
        early_stopping_counter += 1
        print(f"Accuracy did not improve. Early stopping counter: {early_stopping_counter}/{early_stopping_patience}")

    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'scheduler_state_dict': scheduler.state_dict(),
        'best_accuracy': best_accuracy,
        'history': history,
        'early_stopping_counter': early_stopping_counter,
    }, checkpoint_file)

    if (epoch + 1) % 5 == 0:
        print("\n--- Generating Visualizations ---")
        plot_history(history, save_path=os.path.join(CHECKPOINT_PATH, 'training_history.png'))
        visualize_predictions(model, val_loader, DEVICE, int_to_char)

    if early_stopping_counter >= early_stopping_patience:
        print(f"\n🛑 早停触发！连续 {early_stopping_patience} 轮验证集准确率未提升。")
        break

print("\n✅ 训练完成（或已早停）！")

print("\n--- Final Visualizations ---")
plot_history(history, save_path=os.path.join(CHECKPOINT_PATH, 'training_history_final.png'))
visualize_predictions(model, val_loader, DEVICE, int_to_char, num_samples=10)
```

---

## 阶段三：模型导出

训练完成后，我们将保存在 Google Drive 中的最佳模型转换为Web友好的格式。

在模型导出遇到了巨大的问题，且colab的GPU使用的临时额度已经耗尽，因此我新增了一个note，记录了我遇到的问题和解决方法，但在最后依然没有能成功导出为TensorFlow.js模型。

### 1: 创建 Notebook 并挂载 Drive

```python
from google.colab import drive
drive.mount('/content/drive')
```

### 2: 环境清理和安装

```python
# Cell 2: Environment Cleanup and Installation (The Final Fix)

# --- 1. 卸载已知的冲突包 ---
print("Uninstalling potentially conflicting packages...")
# -y 会自动确认卸载
!pip uninstall -y fastai torchaudio tensorflow-text db-dtypes xarray google-cloud-bigquery

# --- 2. 使用明确的版本号强制安装我们需要的、完整的工具链 ---
print("\nInstalling the correct and complete toolchain...")
# 升级 pip
!pip install --upgrade pip -q

# 核心修复：添加 ai-edge-litert
# 强制 onnx 版本 >= 1.16.0，并安装所有其他工具
!pip install --upgrade "onnx>=1.16.0" onnxruntime onnx-graphsurgeon onnx2tf tensorflowjs torch torchvision ai-edge-litert sng4onnx -q

print("\n✅ Environment setup complete!")
print("➡️ IMPORTANT: Please RESTART the runtime now (Runtime -> Restart session) to apply all changes.")
```

### 3: 定义模型、加载权重并导出到 ONNX

```python
# Cell 3: Define Model, Load Weights, and Export to ONNX

import os
import torch
import torch.nn as nn
from collections import OrderedDict

# --- A. 定义路径和配置 ---
PROJECT_ROOT = '/content/drive/MyDrive/Colab_OCR_Project'
CHECKPOINT_PATH = os.path.join(PROJECT_ROOT, 'checkpoints')
ONNX_EXPORT_PATH = os.path.join(PROJECT_ROOT, 'onnx_export')
os.makedirs(ONNX_EXPORT_PATH, exist_ok=True)
IMG_WIDTH = 256
IMG_HEIGHT = 64
CHARSET = "0123456789.%BMI对比上次测量体重公斤脂肪率水分骨骼肌蛋白质肉内脏指数皮下去身年龄型基础代谢活动建议控制偏胖高低标准肥大卡隐形微稍瘦强壮过力发达"
NUM_CLASSES = len(CHARSET) + 1
DEVICE = torch.device('cpu')
print("Paths and config set for CPU.")

# --- B. 定义最终的模型结构 ---
class ResBlock(nn.Module):
    def __init__(self, in_channels):
        super(ResBlock, self).__init__()
        self.conv1 = nn.Conv2d(in_channels, in_channels, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(in_channels)
        self.relu = nn.ReLU()
        self.conv2 = nn.Conv2d(in_channels, in_channels, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(in_channels)
    def forward(self, x):
        residual = x
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += residual
        return self.relu(out)

class CRNN_Export_Final(nn.Module):
    def __init__(self, num_classes):
        super(CRNN_Export_Final, self).__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 32, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d(2, 2),
            ResBlock(64),
            nn.Conv2d(64, 128, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d((2, 2), (2, 1)),
            ResBlock(128),
            nn.Conv2d(128, 256, 3, 1, 1), nn.BatchNorm2d(256), nn.ReLU(True), nn.MaxPool2d((2, 2), (2, 1)),
            nn.Conv2d(256, 512, 3, 1, 1), nn.BatchNorm2d(512), nn.ReLU(True),
            nn.Conv2d(512, 512, (4, 1), 1, 0), nn.BatchNorm2d(512), nn.ReLU(True)
        )
        hidden_size = 256
        self.rnn = nn.ModuleList()
        self.rnn.append(nn.LSTM(512, hidden_size, bidirectional=True, dropout=0.0))
        self.rnn.append(nn.LSTM(2 * hidden_size, hidden_size, bidirectional=True, dropout=0.0))
        self.fc = nn.Linear(2 * hidden_size, num_classes)
    def forward(self, x):
        conv = self.cnn(x)
        b, c, h, w = conv.size()
        conv = conv.squeeze(2).permute(2, 0, 1)
        recurrent = conv
        for lstm_layer in self.rnn:
            recurrent, _ = lstm_layer(recurrent)
        output = self.fc(recurrent)
        return output
print("Model definition is ready.")

# --- C. 加载权重并修复 key ---
print("Loading trained model weights...")
best_model_path = os.path.join(CHECKPOINT_PATH, 'best_model.pth')
original_state_dict = torch.load(best_model_path, map_location=DEVICE)
new_state_dict = OrderedDict()

print("Manually remapping LSTM weight keys...")
for key, value in original_state_dict.items():
    new_key = key
    if 'rnn.' in key:
        layer = int(key.split('_l')[1][0])
        name = key.split('_l')[0].split('.')[-1]
        suffix = "_reverse" if "_reverse" in key else ""
        new_key = f"rnn.{layer}.{name}_l0{suffix}"
    new_state_dict[new_key] = value
print("Weight keys remapped.")

print("Loading remapped weights into the export model...")
model_for_export = CRNN_Export_Final(NUM_CLASSES).to(DEVICE)
model_for_export.load_state_dict(new_state_dict)
model_for_export.eval()
print("Load successful!")

# --- D. 导出到 ONNX ---
dummy_input = torch.randn(1, 1, IMG_HEIGHT, IMG_WIDTH).to(DEVICE)
onnx_model_path = os.path.join(ONNX_EXPORT_PATH, 'crnn_model_final.onnx')
print(f"Exporting to ONNX: {onnx_model_path}")

torch.onnx.export(model_for_export, dummy_input, onnx_model_path, export_params=True, opset_version=12,
                  input_names=['input'], output_names=['output'],
                  dynamic_axes={'input': {0: 'batch_size'}, 'output': {1: 'batch_size'}},
                  dynamo=False)
print(f"✅ Successfully exported to ONNX.")
```

### 4: 导出到 ONNX 和 TensorFlow.js

```python
tfjs_output_path = os.path.join(ONNX_EXPORT_PATH, 'tfjs_model')
!onnx-tf convert -i {onnx_model_path} -o {tfjs_output_path}

print(f"\n🎉 最终的 TF.js 模型已生成并保存在您的 Google Drive 中: {tfjs_output_path}")
```

将生成的 `tfjs_model` 文件夹下载下来，即可在您的 React 应用中集成部署了。这个流程保证了即使 Colab 意外断开，您也可以从上次的进度继续训练，万无一失。

但是，我在导出到 ONNX 和 TensorFlow.js这一步骤上面摔了一跤又一跤......

### 问题调试历程总结

| 阶段                     | 遇到的核心问题                                                                       | 尝试的解决方案                                                                                                                                                                                                                                                                     | 结果分析与结论                                                                                                            |
| :----------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **1. PyTorch -> ONNX**   | `AttributeError: 'NoneType' object has no attribute 'ndim'` (在 `torch.onnx.export`) | 1. 使用 `dynamo=False` 切换回旧版导出器。<br>2. 创建一个不含 `dropout` 的模型用于导出。<br>3. 修正因模型结构修改导致的 `NameError` 和权重 `size mismatch`。<br>4. **最终**: 采用 `nn.ModuleList` 定义模型，并**手动重命名**旧格式的权重 key。                                      | **✅ 成功**。<br>我们最终成功生成了一个稳定、干净的 ONNX 文件 (`crnn_model_final.onnx`)。**这一步已经没有问题了。**       |
| **2. ONNX -> TF (环境)** | `ModuleNotFoundError` (缺少 `onnx_graphsurgeon`, `ai-edge-litert`, `sng4onnx`)       | 在 `pip install` 中明确加入所有缺失的依赖包。                                                                                                                                                                                                                                      | **✅ 成功**。<br>我们最终确定了 `onnx2tf` 及其所有“兄弟”库的完整安装命令。**环境依赖问题已解决。**                        |
| **3. ONNX -> TF (版本)** | `AttributeError: ... has no attribute 'float32_to_bfloat16'` (因 `onnx` 版本过旧)    | 1. 强制升级 `onnx` 版本 (`>=1.16.0`)。<br>2. 卸载 Colab 中冲突的预装包。<br>3. **最终**: 发现 `!` Shell 命令无法加载新版 `onnx`，采用**“运行时补丁”**策略。                                                                                                                        | **✅ 成功了一半**。<br>“运行时补丁”在 Python 内核中是有效的，但在 `!` 启动的 Shell 进程中无效。**这揭示了环境隔离问题。** |
| **4. ONNX -> TF (核心)** | `ValueError: Can't convert ... mixed types to Tensor.` (在 `onnx2tf` 转换 `LSTM` 时) | 1. 尝试直接转换（失败）。<br>2. 发现 `onnx2tf` 会生成一个自动修复的 `.json` 文件。<br>3. 尝试用 Python API (`convert()`) 加载修复文件，但函数不支持该参数 (`TypeError`)。<br>4. 尝试用 `!` Shell 命令加载修复文件，但因环境隔离问题，补丁失效，导致 `AttributeError` (回到阶段3)。 | **❌ 陷入死循环**。<br>Python API 不支持修复文件，而 Shell 命令虽然支持，但无法利用我们的补丁。**这是当前的核心症结。**   |

### 最终的、决定性的问题分析

从上表我们可以清晰地看到：

1.  **ONNX 文件是好的** (阶段1已解决)。
2.  **依赖库是全的** (阶段2已解决)。
3.  我们面临两个**互相矛盾**的约束：
    - **约束A**: `onnx2tf` 转换 `LSTM` **必须**使用 `-prf` 参数加载修复文件。
    - **约束B**: 使用 `-prf` 参数**必须**通过 `!` Shell 命令调用 `onnx2tf`。
    - **约束C**: `!` Shell 命令会启动一个**原始的、无补丁**的环境，导致 `AttributeError`。

所以最后尝试一次源码注入并转换：

```python
# Cell 4 (The Definitive Source Code Injection Version): Convert ONNX to TensorFlow.js

import os
import shutil
import site
import inspect
import onnx
import numpy as np

# ==================== A. 找到 ONNX 库的源文件路径 ====================
try:
    # site.getsitepackages() 返回一个列表，通常第一个就是主 site-packages 目录
    site_packages_path = site.getsitepackages()[0]
    onnx_helper_path = os.path.join(site_packages_path, 'onnx', 'helper.py')

    if os.path.exists(onnx_helper_path):
        print(f"Found onnx.helper source file at: {onnx_helper_path}")
    else:
        # 如果找不到，就用 inspect 模块作为备用方案
        onnx_helper_path = inspect.getfile(onnx.helper)
        print(f"Found onnx.helper source file via inspect at: {onnx_helper_path}")

except Exception as e:
    print(f"❌ Could not locate the onnx.helper source file. Aborting. Error: {e}")
    onnx_helper_path = None

# ==================== B. 核心修复：直接向源文件写入补丁 ====================
if onnx_helper_path:
    # 读取原始文件内容
    with open(onnx_helper_path, 'r', encoding='utf-8') as f:
        original_content = f.read()

    # 定义我们要注入的补丁函数
    patch_code = """

# ====== PATCH START: Injected by Colab Notebook ======
def float32_to_bfloat16(fp32_np: np.ndarray) -> np.ndarray:
    \"\"\"
    Convert float32 numpy array to bfloat16 numpy array.
    This is a simple bitwise truncation.
    \"\"\"
    if fp32_np.dtype != np.float32:
        raise TypeError("Input array must be of float32 dtype.")

    u32_array = fp32_np.view(np.uint32)
    u16_array = (u32_array >> 16).astype(np.uint16)
    return u16_array
# ====== PATCH END ======
"""

    # 检查是否已经打过补丁
    if "PATCH START" not in original_content:
        print("Applying source code patch to onnx.helper...")
        # 将补丁追加到文件末尾
        with open(onnx_helper_path, 'a', encoding='utf-8') as f:
            f.write(patch_code)
        print("✅ Patch successfully written to source file.")
    else:
        print("✅ Source file is already patched.")

# ==================== C. 现在，我们可以安全地执行两步转换策略了 ====================
# 定义路径
PROJECT_ROOT = '/content/drive/MyDrive/Colab_OCR_Project'
ONNX_EXPORT_PATH = os.path.join(PROJECT_ROOT, 'onnx_export')
onnx_model_path = os.path.join(ONNX_EXPORT_PATH, 'crnn_model_final.onnx')
tf_savedmodel_path = os.path.join(ONNX_EXPORT_PATH, 'tf_savedmodel')
tfjs_output_path = os.path.join(ONNX_EXPORT_PATH, 'tfjs_model')
auto_json_path = os.path.join(tf_savedmodel_path, 'crnn_model_final_auto.json')

# 清理旧文件
if os.path.exists(tf_savedmodel_path):
    shutil.rmtree(tf_savedmodel_path)
os.makedirs(tf_savedmodel_path)

# --- 第一次转换 (现在应该能成功生成 JSON) ---
print("\n--- Attempt 1: Running conversion to generate the fix file... ---")
# 因为源文件已被修改，这次调用不会再因为 AttributeError 而崩溃
!onnx2tf -i {onnx_model_path} -o {tf_savedmodel_path} -osd

# --- 第二次转换 (使用 JSON) ---
if os.path.exists(auto_json_path):
    print(f"\n--- Attempt 2: Running conversion with the fix file: {auto_json_path} ---")
    !onnx2tf -i {onnx_model_path} -o {tf_savedmodel_path} -osd -prf {auto_json_path}
    saved_model_generated = os.path.exists(os.path.join(tf_savedmodel_path, 'saved_model.pb'))
else:
    print("\n❌ CRITICAL ERROR: The auto-generated fix file was not found after Attempt 1.")
    print("This might mean the ONNX model no longer has the ValueError and converted successfully in Attempt 1.")
    # 再次检查，也许第一次就成功了
    saved_model_generated = os.path.exists(os.path.join(tf_savedmodel_path, 'saved_model.pb'))
    if saved_model_generated:
        print("✅ Good news! It seems Attempt 1 was successful after all.")

# --- 最终转换到 TF.js ---
if saved_model_generated:
    print("\n--- Final Step: Converting SavedModel to TF.js... ---")
    !tensorflowjs_converter --input_format=tf_saved_model \
                             {tf_savedmodel_path} \
                             {tfjs_output_path}

    if os.path.exists(os.path.join(tfjs_output_path, 'model.json')):
        print(f"\n🎉🎉🎉 FINAL SUCCESS! The TF.js model is in your Google Drive: {tfjs_output_path}")
    else:
        print(f"\n❌ Conversion from SavedModel to TF.js FAILED!")
else:
    print("\n❌ Conversion process failed. Could not generate SavedModel.")
```
