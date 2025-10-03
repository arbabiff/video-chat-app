const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const logger = require('../utils/logger');

function getConfig() {
  const retentionDays = parseInt(process.env.SNAPSHOT_RETENTION_DAYS || '7', 10);
  const quality = parseInt(process.env.SNAPSHOT_QUALITY || '60', 10);
  const maxWidth = parseInt(process.env.SNAPSHOT_MAX_WIDTH || '640', 10);
  const dir = process.env.SNAPSHOT_DIR || path.join(process.cwd(), 'uploads', 'snapshots');
  return { retentionDays, quality, maxWidth, dir };
}

async function ensureDirExists(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function saveSnapshot(file, userId = 'anon') {
  const { dir, quality, maxWidth, retentionDays } = getConfig();
  await ensureDirExists(dir);

  const safeUser = (userId || 'anon').toString().replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `${Date.now()}_${safeUser}_${uuidv4()}.jpg`;
  const destPath = path.join(dir, filename);

  // Process and save image
  await sharp(file.buffer)
    .rotate() // auto-orient
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true, progressive: true, chromaSubsampling: '4:2:0' })
    .toFile(destPath);

  const relativeUrl = `/uploads/snapshots/${filename}`;
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

  logger.info('Snapshot saved', { relativeUrl, destPath, expiresAt });
  return { relativeUrl, filePath: destPath, expiresAt };
}

async function cleanupExpiredSnapshots() {
  const { dir, retentionDays } = getConfig();
  const now = Date.now();
  const threshold = now - retentionDays * 24 * 60 * 60 * 1000;

  try {
    await ensureDirExists(dir);
    const files = await fsp.readdir(dir);
    let deleted = 0;

    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = await fsp.stat(fullPath);
        if (stat.isFile() && stat.mtimeMs < threshold) {
          await fsp.unlink(fullPath);
          deleted += 1;
        }
      } catch (err) {
        logger.warn('Error checking snapshot file during cleanup', { file: fullPath, error: err.message });
      }
    }

    logger.info('Snapshot cleanup completed', { dir, deleted });
    return { deleted };
  } catch (error) {
    logger.error('Snapshot cleanup error', { error: error.message });
    return { deleted: 0, error: error.message };
  }
}

function scheduleSnapshotCleanup() {
  // Run daily at 03:00 local time
  try {
    cron.schedule('0 3 * * *', async () => {
      logger.info('Running scheduled snapshot cleanup job');
      await cleanupExpiredSnapshots();
    });
    logger.info('Scheduled snapshot cleanup initialized');
  } catch (error) {
    logger.error('Failed to schedule snapshot cleanup', { error: error.message });
  }
}

module.exports = {
  getConfig,
  saveSnapshot,
  cleanupExpiredSnapshots,
  scheduleSnapshotCleanup
};

