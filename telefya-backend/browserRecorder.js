// browserRecorder.js - FIXED VERSION
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const delay = ms => new Promise(r => setTimeout(r, ms));

function extractOrigin(meetingUrl) {
  try {
    if (/^https?:\/\//i.test(meetingUrl)) {
      const url = new URL(meetingUrl);
      return `${url.protocol}//${url.hostname}`;
    }

    let clean = meetingUrl.replace(/:\d+.*/g, '')
                         .replace(/[?#].*/g, '')
                         .replace(/\/+$/, '');

    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean.replace(/^\/\//, '');
    }

    const url = new URL(clean);
    return `${url.protocol}//${url.hostname}`;
  } catch (e) {
    console.error('[Recorder] FAILED to parse meetingUrl:', meetingUrl);
    throw new Error(`Invalid meeting URL: ${meetingUrl}`);
  }
}

class RealFaceRecorder {
  constructor() {
    this.activeRecordings = new Map();
    this.recordingsDir = path.resolve('./recordings_meeting');
    fs.mkdirSync(this.recordingsDir, { recursive: true });
  }

  async startRecording({ roomId, meetingUrl, userName = "Recorder Bot" }) {
    if (this.activeRecordings.has(roomId)) {
      throw new Error('Recording already in progress');
    }

    console.log(`[Recorder] Raw meetingUrl received: ${meetingUrl}`);
    const origin = extractOrigin(meetingUrl);
    console.log(`[Recorder] Extracted origin for permissions: ${origin}`);

    const timestamp = Date.now();
    const webmName = `real-${roomId}-${timestamp}.webm`;
    const mp4Name = `real-${roomId}-${timestamp}.mp4`;
    const webmPath = path.join(this.recordingsDir, webmName);
    const mp4Path = path.join(this.recordingsDir, mp4Name);
    const writeStream = fs.createWriteStream(webmPath);

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--autoplay-policy=no-user-gesture-required',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--allow-http-screen-capture',
        '--enable-usermedia-screen-capturing',
        '--enable-blink-features=DisplayCapture',
        '--start-maximized',
        '--window-size=1920,1080',
        '--ignore-certificate-errors',
        '--allow-insecure-localhost',
        '--disable-features=WebRtcHideLocalIpsWithMdns',
        // Add these flags to ensure mediaDevices is available
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream'
      ],
      defaultViewport: null,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Enable console logging from the page context
    page.on('console', msg => console.log('[PAGE LOG]', msg.text()));
    page.on('pageerror', error => console.error('[PAGE ERROR]', error));
    
    // Override permissions - only use valid permissions
    const context = browser.defaultBrowserContext();
    
    try {
      // Only use valid Puppeteer permissions
      await context.overridePermissions(origin, [
        'camera',
        'microphone'
      ]);
      console.log(`[Recorder] Permissions set successfully for ${origin}`);
    } catch (err) {
      console.warn(`[Recorder] Permission override failed:`, err.message);
      // Continue anyway
    }

    // Build the final URL with recorder parameters
    const urlObj = new URL(meetingUrl);
    urlObj.searchParams.set('recorderBot', 'true');
    urlObj.searchParams.set('userName', userName);
    urlObj.searchParams.set('videoOff', 'true');
    urlObj.searchParams.set('audioOff', 'true');
    urlObj.searchParams.set('skipDeviceCheck', 'true');

    const targetUrl = urlObj.toString();
    console.log(`[Recorder] Joining meeting → ${targetUrl}`);

    try {
      await page.goto(targetUrl, { 
        waitUntil: 'networkidle2', 
        timeout: 60000 
      });
      console.log('[Recorder] Page loaded successfully');
    } catch (e) {
      console.warn('[Recorder] Navigation timeout – continuing anyway...');
    }

    // Wait for page to fully initialize
    await delay(10000);

    // First, ensure mediaDevices is available
    const mediaDevicesAvailable = await page.evaluate(() => {
      // Ensure mediaDevices exists
      if (!navigator.mediaDevices) {
        console.error('[Recorder] navigator.mediaDevices is not available');
        return false;
      }
      
      // Ensure getDisplayMedia exists
      if (!navigator.mediaDevices.getDisplayMedia) {
        console.error('[Recorder] getDisplayMedia is not available');
        return false;
      }
      
      console.log('[Recorder] mediaDevices API is available');
      return true;
    });

    if (!mediaDevicesAvailable) {
      throw new Error('Media devices API not available in browser');
    }

    // Execute JavaScript to help mediasoup initialize properly
    await page.evaluate(() => {
      console.log('[Recorder] Setting up media device overrides...');
      
      // Store original function
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      
      // Override getUserMedia to prevent mediasoup from accessing real devices
      navigator.mediaDevices.getUserMedia = function(constraints) {
        console.log('[Recorder] getUserMedia intercepted with:', constraints);
        
        // For recorder bot, reject any requests for real devices
        if (constraints && (constraints.audio || constraints.video)) {
          console.log('[Recorder] Blocking device access for recorder bot');
          return Promise.reject(new Error('Media devices not available for recorder bot'));
        }
        
        // For non-device requests, use original function
        return originalGetUserMedia(constraints);
      };
      
      console.log('[Recorder] Media device overrides setup complete');
    });

    // Additional delay for meeting to join
    await delay(5000);

    console.log('[Recorder] Setting up screen recording...');

    await page.exposeFunction('sendChunkToNode', (base64Chunk) => {
      try {
        const buffer = Buffer.from(base64Chunk, 'base64');
        writeStream.write(buffer);
      } catch (e) {
        console.error('[Recorder] Chunk write failed:', e.message);
      }
    });

    try {
      const recordingStarted = await page.evaluate(async () => {
        console.log('[Recorder] Starting screen recording...');
        
        // Double-check mediaDevices availability
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          console.error('[Recorder] getDisplayMedia not available');
          return false;
        }

        let stream;
        try {
          console.log('[Recorder] Requesting display media...');
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: "always",
              frameRate: { ideal: 15, max: 25 },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              sampleRate: 44100,
              channelCount: 2,
              autoGainControl: false
            }
          });
          
          console.log('[Recorder] Display media granted. Tracks:', stream.getTracks().map(t => t.kind));
        } catch (err) {
          console.error('[Recorder] getDisplayMedia failed:', err.name, err.message);
          return false;
        }

        // Check if we have video track
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
          console.error('[Recorder] No video track in display stream');
          stream.getTracks().forEach(track => track.stop());
          return false;
        }

        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9,opus',
          videoBitsPerSecond: 3000000
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const base64 = reader.result.split(',')[1];
                window.sendChunkToNode(base64);
              } catch (err) {
                console.error('[Recorder] Error processing chunk:', err);
              }
            };
            reader.onerror = (err) => {
              console.error('[Recorder] FileReader error:', err);
            };
            reader.readAsDataURL(e.data);
          }
        };

        recorder.onerror = (e) => {
          console.error('[Recorder] MediaRecorder error:', e);
        };

        recorder.onstop = () => {
          console.log('[Recorder] MediaRecorder stopped');
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start(1000); // Collect data every second
        console.log('[Recorder] Screen recording started successfully');

        // Store for cleanup
        window.__recorder = recorder;
        window.__stream = stream;

        window.__stopRecording = () => {
          try {
            console.log('[Recorder] Stopping recording...');
            if (window.__recorder && window.__recorder.state !== 'inactive') {
              window.__recorder.stop();
            }
            if (window.__stream) {
              window.__stream.getTracks().forEach(track => {
                track.stop();
                console.log('[Recorder] Stopped track:', track.kind);
              });
            }
          } catch (e) {
            console.error('[Recorder] Error stopping recording:', e);
          }
        };

        return true;
      });

      if (!recordingStarted) {
        throw new Error('Failed to start screen recording');
      }

      console.log('[Recorder] Recording evaluation completed successfully');

    } catch (err) {
      console.error('[Recorder] Recording setup failed:', err);
      writeStream.end();
      await browser.close();
      throw new Error('Screen recording setup failed: ' + err.message);
    }

    this.activeRecordings.set(roomId, {
      browser,
      page,
      writeStream,
      webmPath,
      mp4Path,
      webmName,
      mp4Name,
      startTime: timestamp
    });

    console.log(`[Recorder] Recording started successfully → ${webmName}`);
    return { roomId, webmPath, mp4Path };
  }

  async stopRecording(roomId) {
    const rec = this.activeRecordings.get(roomId);
    if (!rec) throw new Error('No active recording');

    const { browser, page, writeStream, webmPath, mp4Path, webmName, mp4Name } = rec;

    console.log(`[Recorder] Stopping recording for room ${roomId}...`);

    try {
      await page.evaluate(() => {
        if (window.__stopRecording) {
          window.__stopRecording();
        }
      });
      console.log('[Recorder] Recording stopped in browser');
    } catch (e) {
      console.warn('[Recorder] Stop recording eval failed:', e.message);
    }

    await delay(3000);

    // Try to leave the meeting gracefully
    try {
      await this.clickLeaveButton(page);
      console.log('[Recorder] Attempted to leave meeting');
    } catch (e) {
      console.warn('[Recorder] Leave button click failed:', e.message);
    }

    await delay(2000);

    // Close write stream and browser
    writeStream.end();
    await browser.close();
    console.log('[Recorder] Browser closed');

    this.activeRecordings.delete(roomId);

    // Wait for file to be fully written
    await delay(3000);

    // Convert to MP4
    if (fs.existsSync(webmPath) && fs.statSync(webmPath).size > 0) {
      try {
        console.log(`[Recorder] Converting ${webmName} to MP4...`);
        execSync(`ffmpeg -i "${webmPath}" -c:v libx264 -preset fast -crf 23 -c:a aac "${mp4Path}" -y`, { 
          stdio: 'inherit',
          timeout: 60000 
        });
        
        if (fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 0) {
          console.log(`[Recorder] Successfully converted → ${mp4Name}`);
          fs.unlinkSync(webmPath);
          console.log(`[Recorder] Removed WebM file: ${webmName}`);
        } else {
          console.error('[Recorder] Conversion failed - output file is empty or missing');
        }
      } catch (e) {
        console.error('[Recorder] FFmpeg conversion failed:', e.message);
      }
    } else {
      console.error('[Recorder] WebM file is missing or empty:', webmPath);
    }

    return { roomId, mp4Path, mp4Name };
  }

  async clickLeaveButton(page) {
    return await page.evaluate(() => {
      const selectors = [
        'button[aria-label*="leave" i]',
        'button[title*="leave" i]',
        '.leave-button',
        '#leave-btn',
        'button.leave-meeting',
        '.end-call-button',
        'button[data-testid="leave-button"]',
        'button.btn-danger',
        'button.btn-exit'
      ];
      
      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        for (let i = 0; i < elements.length; i++) {
          const btn = elements[i];
          if (btn && btn.offsetParent !== null) { // Visible element
            console.log(`[Recorder] Clicking leave button: ${sel}`);
            btn.click();
            return true;
          }
        }
      }
      
      // Fallback: try to find by text content
      const allButtons = document.querySelectorAll('button');
      for (let i = 0; i < allButtons.length; i++) {
        const btn = allButtons[i];
        if (btn.textContent && btn.textContent.toLowerCase().includes('leave') && btn.offsetParent !== null) {
          console.log('[Recorder] Found leave button by text content');
          btn.click();
          return true;
        }
      }
      
      console.log('[Recorder] No leave button found');
      return false;
    });
  }

  isRecording(roomId) {
    return this.activeRecordings.has(roomId);
  }
}

module.exports = { BrowserRecorder: RealFaceRecorder }; 