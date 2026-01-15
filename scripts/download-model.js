import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==========================================
// 配置模型下载
// ==========================================

// GitHub 加速代理 (根据需要开关)
const GH_PROXY = 'https://ghproxy.net/';

const MODELS_CONFIG = [
    {
        // 模型 1: Qwen2.5 (来自 GitHub Release)
        name: "Qwen2.5-1.5B-Instruct-q4f32_1234", // 目标文件夹名
        url: GH_PROXY + "https://github.com/mingchangge/ai-code-assistant/releases/download/v1.0-model/Qwen2.5-1.5B-Instruct-q4f32_1.zip"
    },
    {
        // 模型 2: Embedding 模型 (建议打包成 ZIP 上传到同一个 Release)
        // 这里的 dirName 要和代码里 EmbeddingEngine 的 modelName 一致
        name: "paraphrase-multilingual-MiniLM-L12-v234",
        url: GH_PROXY + "https://github.com/mingchangge/ai-code-assistant/releases/download/v1.0-model/paraphrase-multilingual-MiniLM-L12-v2.zip"
    }
];

const MODELS_ROOT = path.join(__dirname, '../public/models');
const MAX_RETRIES = 3; // 最大重试次数

// ==========================================
// 核心逻辑
// ==========================================

// 动态依赖加载
async function loadAdmZip() {
    try {
        const module = await import('adm-zip');
        return module.default;
    } catch (e) {
        console.log('⚠️ 检测到未安装 adm-zip，正在临时安装...');
        try {
            execSync('npm install adm-zip --no-save', { stdio: 'inherit' });
            const module = await import('adm-zip');
            return module.default;
        } catch (installError) {
            console.error('❌ 无法自动安装 adm-zip，请手动运行: npm install adm-zip -D');
            process.exit(1);
        }
    }
}

// 主流程
(async () => {
    const AdmZip = await loadAdmZip();

    // 确保根目录存在
    if (!fs.existsSync(MODELS_ROOT)) {
        fs.mkdirSync(MODELS_ROOT, { recursive: true });
    }

    console.log(`🚀 开始检查模型资源...`);

    // 遍历配置，逐个处理
    for (const config of MODELS_CONFIG) {
        await processModel(config, AdmZip);
    }

    console.log(`\n🎉 所有模型处理完毕！`);
})();

// 处理单个模型
async function processModel(config, AdmZip) {
    const targetDir = path.join(MODELS_ROOT, config.name);
    const tempZipPath = path.join(MODELS_ROOT, `temp_${config.name}.zip`);

    console.log(`\n👉 正在处理: ${config.name}`);

    // 1. 检查是否存在
    if (fs.existsSync(targetDir)) {
        console.log(`   ✅ 目录已存在，跳过下载`);
        return;
    }

    // 2. 下载 (带重试)
    console.log(`   📥 准备下载...`);
    try {
        await downloadWithRetry(config.url, tempZipPath, MAX_RETRIES);
    } catch (err) {
        console.error(`   ❌ [失败] 无法下载 ${config.name}: ${err.message}`);
        cleanup(tempZipPath);
        process.exit(1); // 一个失败则整体退出，保证环境完整性
    }

    // 3. 解压与部署
    console.log(`   📦 下载完成，正在解压...`);
    unzipAndDeploy(AdmZip, tempZipPath, targetDir, config.name);
}

// 下载函数 (支持重试)
function downloadWithRetry(url, destPath, retriesLeft) {
    return new Promise((resolve, reject) => {
        const attemptDownload = (n) => {
            const file = fs.createWriteStream(destPath);
            const request = https.get(url, (response) => {
                // 处理重定向
                if (response.statusCode === 302 || response.statusCode === 301) {
                    const newUrl = response.headers.location;
                    file.close();
                    attemptDownload(n); // 重定向不算重试次数
                    return;
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(destPath); // 删除空文件
                    const err = new Error(`HTTP Status ${response.statusCode}`);
                    handleError(err, n);
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'], 10);
                let downloaded = 0;

                response.pipe(file);

                response.on('data', (chunk) => {
                    downloaded += chunk.length;
                    if (totalSize) {
                        const percent = ((downloaded / totalSize) * 100).toFixed(0);
                        process.stdout.write(`\r   ⏳ 进度: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)}MB) `);
                    }
                });

                file.on('finish', () => {
                    file.close();
                    process.stdout.write('\n'); // 换行
                    resolve();
                });

                file.on('error', (err) => {
                    file.close();
                    fs.unlinkSync(destPath);
                    handleError(err, n);
                });
            });

            request.on('error', (err) => {
                file.close();
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                handleError(err, n);
            });
        };

        const handleError = (err, n) => {
            if (n > 0) {
                console.log(`\n   ⚠️ 发生错误: ${err.message}`);
                console.log(`   🔄 3秒后重试... (剩余 ${n} 次)`);
                setTimeout(() => attemptDownload(n - 1), 3000);
            } else {
                reject(err);
            }
        };

        attemptDownload(retriesLeft);
    });
}

// 解压与安全部署
function unzipAndDeploy(AdmZip, zipPath, targetDir, modelName) {
    const stagingDir = path.join(MODELS_ROOT, `staging_${modelName}`);

    try {
        const zip = new AdmZip(zipPath);

        // 清理中转区
        if (fs.existsSync(stagingDir)) {
            fs.rmSync(stagingDir, { recursive: true, force: true });
        }
        fs.mkdirSync(stagingDir);

        // 解压到中转区
        zip.extractAllTo(stagingDir, true);

        // 智能识别根目录 (处理 zip 包里是否套了一层文件夹的情况)
        const files = fs.readdirSync(stagingDir);
        let extractedRoot = stagingDir;
        if (files.length === 1 && fs.statSync(path.join(stagingDir, files[0])).isDirectory()) {
            extractedRoot = path.join(stagingDir, files[0]);
            console.log(`   🔍 识别到内部目录: ${files[0]}`);
        }

        // 移动到最终目标
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
        }
        fs.renameSync(extractedRoot, targetDir);

        // 清理
        if (fs.existsSync(stagingDir)) {
            fs.rmSync(stagingDir, { recursive: true, force: true });
        }
        cleanup(zipPath);

        console.log(`   ✅ 部署成功: ${targetDir}`);

    } catch (err) {
        console.error(`   ❌ 解压失败: ${err.message}`);
        if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
        cleanup(zipPath);
        process.exit(1);
    }
}

function cleanup(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}