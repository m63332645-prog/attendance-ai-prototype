import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// 环境配置映射
const ENV_CONFIG = {
  sit: {
    buildCommand: 'npm run build',
    buildMode: 'sit',
    targetDirName: 'sit',
  },
  uat: {
    buildCommand: 'npm run build:uat',
    buildMode: 'uat',
    targetDirName: 'uat',
  },
  prd: {
    buildCommand: 'npm run build:prod',
    buildMode: 'prod',
    targetDirName: 'prd',
  },
};

const DIST_DIR = resolve(__dirname, 'dist');
const BASE_OUTPUT_DIR = resolve(__dirname, 'ama-attendance-app');

/**
 * 清理目标目录（保留文件夹本身，删除内部旧资源）
 * @param {string} targetDir
 */
function cleanTargetDir(targetDir) {
  if (!existsSync(targetDir)) {
    return;
  }

  const entries = readdirSync(targetDir);
  for (const entry of entries) {
    const entryPath = join(targetDir, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      rmSync(entryPath, { recursive: true, force: true });
      console.log(`   - 已删除旧文件夹: ${entry}/`);
    } else if (stats.isFile() && (entry.endsWith('.js') || entry.endsWith('.css'))) {
      rmSync(entryPath, { force: true });
      console.log(`   - 已删除旧文件: ${entry}`);
    }
  }
}

/**
 * 复制 dist 内容到目标目录
 * @param {string} targetDir
 */
function copyDistToTarget(targetDir) {
  let copiedCount = 0;

  const entries = readdirSync(DIST_DIR);
  for (const entry of entries) {
    const srcPath = join(DIST_DIR, entry);
    const destPath = join(targetDir, entry);
    const stats = statSync(srcPath);

    if (stats.isDirectory()) {
      // 递归复制目录（这里主要是 assets）
      mkdirSync(destPath, { recursive: true });
      const files = readdirSync(srcPath);
      let assetCount = 0;
      for (const file of files) {
        const srcFile = join(srcPath, file);
        const destFile = join(destPath, file);
        if (statSync(srcFile).isFile()) {
          copyFileSync(srcFile, destFile);
          assetCount++;
        }
      }
      if (assetCount > 0) {
        console.log(`   - 已复制 ${assetCount} 个文件到 ${entry}/`);
      }
      copiedCount++;
    } else if (stats.isFile()) {
      copyFileSync(srcPath, destPath);
      copiedCount++;
      console.log(`   - 已复制 ${entry}`);
    }
  }

  return copiedCount;
}

/**
 * 部署单个环境
 * @param {string} envKey
 */
function deployEnv(envKey) {
  const config = ENV_CONFIG[envKey];
  if (!config) {
    console.error(`❌ 未知的环境: ${envKey}`);
    return false;
  }

  const targetDir = join(BASE_OUTPUT_DIR, config.targetDirName);
  console.log(`\n========================================`);
  console.log(`🚀 准备打包 [${envKey.toUpperCase()}] 环境`);
  console.log(`========================================\n`);

  // 1. 构建
  console.log(`📦 执行构建: ${config.buildCommand}`);
  try {
    execSync(config.buildCommand, { stdio: 'inherit', cwd: __dirname });
  } catch (error) {
    console.error(`\n❌ [${envKey.toUpperCase()}] 构建失败`);
    return false;
  }

  // 2. 检查 dist
  if (!existsSync(DIST_DIR) || !statSync(DIST_DIR).isDirectory()) {
    console.error(`❌ [${envKey.toUpperCase()}] dist 目录不存在，构建可能未成功`);
    return false;
  }

  // 3. 确保目标目录存在
  if (!existsSync(targetDir)) {
    console.log(`📁 创建目标目录: ${config.targetDirName}/`);
    mkdirSync(targetDir, { recursive: true });
  }

  // 4. 清理旧文件
  console.log('🧹 清理旧文件...');
  cleanTargetDir(targetDir);

  // 5. 复制新资源
  console.log('📂 复制新资源文件...');
  const copiedCount = copyDistToTarget(targetDir);

  console.log(`\n✅ [${envKey.toUpperCase()}] 部署完成！`);
  console.log(`📍 目标路径: ${targetDir}`);

  // 6. 可选：删除 dist 目录避免干扰下一个环境
  try {
    rmSync(DIST_DIR, { recursive: true, force: true });
    console.log('🗑️  已清理 dist 目录');
  } catch {
    // 忽略清理 dist 失败
  }

  return true;
}

// ============ 主入口 ============
const args = process.argv.slice(2);
const validEnvs = Object.keys(ENV_CONFIG);

function printUsage() {
  console.log('用法: node deploy.js [sit|uat|prd|all]');
  console.log('示例:');
  console.log('  node deploy.js sit      # 仅部署 SIT 环境');
  console.log('  node deploy.js uat      # 仅部署 UAT 环境');
  console.log('  node deploy.js prd      # 仅部署 PRD 环境');
  console.log('  node deploy.js all      # 按顺序部署 SIT → UAT → PRD');
}

if (args.length === 0) {
  console.error('❌ 缺少环境参数\n');
  printUsage();
  process.exit(1);
}

const command = args[0].toLowerCase();

if (command === 'all') {
  let hasError = false;
  for (const env of validEnvs) {
    const success = deployEnv(env);
    if (!success) {
      hasError = true;
      break;
    }
  }
  if (hasError) {
    process.exit(1);
  }
  console.log('\n========================================');
  console.log('🎉 全部环境部署完成！');
  console.log('========================================');
} else if (validEnvs.includes(command)) {
  const success = deployEnv(command);
  if (!success) {
    process.exit(1);
  }
} else {
  console.error(`❌ 无效的环境参数: ${command}\n`);
  printUsage();
  process.exit(1);
}