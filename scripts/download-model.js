import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- 1. 动态依赖加载器 (核心修复) ---
async function loadAdmZip() {
    try {
        // 尝试加载
        const module = await import('adm-zip');
        return module.default;
    } catch (e) {
        console.log('⚠️ 检测到未安装 adm-zip，正在临时安装...');
        try {
            // 自动安装 (不写入 package.json)
            execSync('npm install adm-zip --no-save', { stdio: 'inherit' });
            console.log('✅ adm-zip 安装完成');

            // 安装后再次尝试加载
            const module = await import('adm-zip');
            return module.default;
        } catch (installError) {
            console.error('❌ 无法自动安装 adm-zip，请手动运行: npm install adm-zip -D');
            process.exit(1);
        }
    }
}

// --- 2. 主逻辑封装 (使用 Top-level Await) ---
// Node.js v14.8+ 支持顶层 await，你的 v23 完全没问题
const AdmZip = await loadAdmZip();

// 3. 配置信息
const GH_PROXY = 'https://ghproxy.net/';
const ORIGINAL_URL = "https://github.com/mingchangge/ai-code-assistant/releases/download/v1.0-model/Qwen2.5-1.5B-Instruct-q4f32_1.zip";
const RELEASE_URL = GH_PROXY + ORIGINAL_URL;
const MODEL_DIR_NAME = "Qwen2.5-1.5B-Instruct-q4f32_123"; // ⚠️ 注意：这里建议和压缩包内的文件夹名保持一致
const MODELS_ROOT = path.join(__dirname, '../public/models');
const TARGET_DIR = path.join(MODELS_ROOT, MODEL_DIR_NAME);
const TEMP_ZIP_PATH = path.join(MODELS_ROOT, 'temp_model.zip');

// 4. 检查是否已存在
if (fs.existsSync(TARGET_DIR)) {
    console.log(`✅ 模型目录已存在: ${TARGET_DIR}`);
    console.log(`跳过下载。如果需要重新下载，请手动删除该目录。`);
    process.exit(0);
}

// 确保父目录存在
if (!fs.existsSync(MODELS_ROOT)) {
    fs.mkdirSync(MODELS_ROOT, { recursive: true });
}

console.log(`📥 开始下载模型压缩包...\n🔗 ${RELEASE_URL}`);

// 5. 下载文件
const file = fs.createWriteStream(TEMP_ZIP_PATH);
https.get(RELEASE_URL, (response) => {
    // 检查重定向
    if (response.statusCode === 302 || response.statusCode === 301) {
        const newUrl = response.headers.location;
        console.log(`🔀 跟随重定向...`);
        https.get(newUrl, (res) => handleResponse(res));
    } else {
        handleResponse(response);
    }
}).on('error', (err) => {
    console.error(`❌ 下载请求失败: ${err.message}`);
    cleanup();
});

function handleResponse(response) {
    if (response.statusCode !== 200) {
        console.error(`❌ 下载失败，状态码: ${response.statusCode}`);
        cleanup();
        return;
    }

    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloaded = 0;

    response.pipe(file);

    response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (totalSize) {
            const percent = ((downloaded / totalSize) * 100).toFixed(1);
            process.stdout.write(`\r⏳ 下载进度: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)}MB)`);
        }
    });

    file.on('finish', () => {
        file.close();
        console.log(`\n✅ 下载完成，正在解压...`);
        unzipFile();
    });
}

// 6. 解压文件
function unzipFile() {
    // 定义一个临时的中转目录，确保不污染现有文件夹
    const STAGING_DIR = path.join(MODELS_ROOT, 'temp_staging_area');

    try {
        const zip = new AdmZip(TEMP_ZIP_PATH);

        // 1. 清理并创建中转目录
        if (fs.existsSync(STAGING_DIR)) {
            fs.rmSync(STAGING_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(STAGING_DIR);

        console.log(`📦 正在解压到临时中转区...`);
        // 解压到 public/models/temp_staging_area
        zip.extractAllTo(STAGING_DIR, true);

        // 2. 寻找解压后的真实根目录
        // 通常 ZIP 包里包含一个顶层文件夹 (例如 Qwen2.5..._1)
        const files = fs.readdirSync(STAGING_DIR);
        let extractedRoot = STAGING_DIR;

        // 如果解压出来只有一个文件夹，说明 ZIP 包带了根目录
        if (files.length === 1 && fs.statSync(path.join(STAGING_DIR, files[0])).isDirectory()) {
            extractedRoot = path.join(STAGING_DIR, files[0]);
            console.log(`🔍 识别到压缩包内原名: ${files[0]}`);
        }

        // 3. 移动并重命名为目标名称 (_123)
        // 这一步实现了：把 "原名" 变成 "你想要的名字"
        console.log(`📝 正在重命名并部署到: ${MODEL_DIR_NAME}`);

        // 确保目标位置是空的
        if (fs.existsSync(TARGET_DIR)) {
            fs.rmSync(TARGET_DIR, { recursive: true, force: true });
        }

        // 执行移动 (Rename 操作在同一磁盘下即为移动)
        fs.renameSync(extractedRoot, TARGET_DIR);

        // 4. 清理工作
        // 删除剩下的空的中转目录
        if (fs.existsSync(STAGING_DIR)) {
            fs.rmSync(STAGING_DIR, { recursive: true, force: true });
        }
        cleanup(); // 删除 zip 包

        console.log(`🚀 模型部署完成！`);
        console.log(`📁 路径: ${TARGET_DIR}`);

    } catch (err) {
        console.error(`❌ 解压部署失败: ${err.message}`);
        // 出错时尝试清理中转区
        if (fs.existsSync(STAGING_DIR)) {
            fs.rmSync(STAGING_DIR, { recursive: true, force: true });
        }
        cleanup();
    }
}


function cleanup() {
    if (fs.existsSync(TEMP_ZIP_PATH)) {
        fs.unlinkSync(TEMP_ZIP_PATH);
        // console.log(`🧹 已删除临时压缩包`);
    }
}