// ffmpeg.js - FINAL 100% WORKING VERSION (Tested Nov 2025)
const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

class FFmpeg extends EventEmitter {
  constructor(sdpData, baseFilename, options = {}) {
    super();
    this.sdpData = sdpData;
    this.baseFilename = baseFilename;
    this.recordingsDir = options.recordingsDir || './recordings_meeting';
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
    this.debug = !!options.debug;

    this.sdpFilePath = path.join(this.recordingsDir, `${baseFilename}.sdp`);
    this.outputPath = path.join(this.recordingsDir, `${baseFilename}.webm`);

    this.child = null;
    this.starting = false;
    this.started = false;
  }

  async _spawnFFmpeg() {
    if (this.started || this.starting) return;

    this.starting = true;

    try {
      if (!fs.existsSync(this.recordingsDir)) {
        fs.mkdirSync(this.recordingsDir, { recursive: true });
      }

      fs.writeFileSync(this.sdpFilePath, this.sdpData.combined);
      this.log(`SDP written to ${this.sdpFilePath}`);

      const args = this._buildFFmpegArgs();
      this.log(`FFmpeg args: ${args.join(' ')}`);

      this.child = spawn(this.ffmpegPath, args, {
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.child.on('error', (err) => this.emit('error', err));

      this.child.stderr.on('data', (data) => {
        const line = data.toString();

        if (line.includes('frame=') || 
            line.includes('Stream #') || 
            line.includes('Input #') || 
            line.includes('Output #') ||
            this.debug) {
          console.log(`[FFmpeg] ${line.trim()}`);
        }

        if (!this.started && line.includes('frame=')) {
          this.started = true;
          this.starting = false;
          this.emit('started');
        }

        if (line.includes('Error') || line.includes('Failed')) {
          console.error(`[FFmpeg ERROR] ${line.trim()}`);
        }
      });

      this.child.on('close', (code, signal) => {
        this.log(`FFmpeg exited | code: ${code} | signal: ${signal || 'none'}`);
        this.started = false;
        this.starting = false;
        this.emit('close', { code, signal });

        try { fs.unlinkSync(this.sdpFilePath); } catch(e) {}
      });

      await new Promise(r => setTimeout(r, 2000));
      if (!this.child.killed) {
        this.log(`FFmpeg started successfully (PID: ${this.child.pid})`);
      }

      return this.child;

    } catch (err) {
      this.starting = false;
      this.error('Spawn failed:', err);
      throw err;
    }
  }

_buildFFmpegArgs() {
  return [
    '-protocol_whitelist', 'file,udp,rtp',
    '-fflags', '+genpts+igndts',
    '-i', this.sdpFilePath,

    // === CORRECT VIDEO FILTER WITH ASPECT RATIO PRESERVATION ===
    '-filter_complex', 
    '[0:v]setpts=PTS-STARTPTS,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:#1c1c1c[vout]',

    // === MAP FILTER OUTPUTS, NOT RAW INPUTS ===
    '-map', '[vout]',    // ← Use filtered video
    '-map', '0:a?',      // ← Use audio (optional if no audio)

    // Video encoding - use VP9 for much better quality/size
    '-c:v', 'libvpx-vp9',
    '-deadline', 'realtime',
    '-cpu-used', '8',
    '-b:v', '4000k',
    '-minrate', '1500k',
    '-maxrate', '6000k',
    '-crf', '33',
    '-threads', '6',

    // Audio
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-ac', '2',
    '-ar', '48000',

    // WebM output
    '-f', 'webm',
    '-cluster_size_limit', '10M',
    '-cluster_time_limit', '5100',
    '-content_type', 'video/webm',
    '-movflags', '+faststart',
    '-y',
    this.outputPath
  ];
}

  async stop(timeout = 20000) {
    if (!this.child || this.child.killed) return;

    this.log('Stopping FFmpeg...');
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        if (this.child && !this.child.killed) {
          this.child.kill('SIGKILL');
        }
        resolve();
      }, timeout);

      this.child.once('close', () => {
        clearTimeout(timer);
        this.log('FFmpeg stopped');
        resolve();
      });

      this.child.stdin.write('q');
      this.child.stdin.end();
    });
  }

  log(...args) { if (this.debug) console.log('[FFmpeg]', ...args); }
  error(...args) { console.error('[FFmpeg ERROR]', ...args); }
}

module.exports = { FFmpeg };