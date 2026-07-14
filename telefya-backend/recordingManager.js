// /**
//  * @file RecordingManager.js
//  * @description Handles mediasoup recording via FFmpeg and PlainTransports.
//  * Supports pause/resume, segmented recordings, and Redis persistence.
//  */

// const { spawn } = require('child_process');
// const fs = require('fs');
// const path = require('path');
// const { v4: uuidv4 } = require('uuid');

// /**
//  * Manages all active recordings across rooms.
//  */
// class RecordingManager {
//   /**
//    * @param {object} config - Server configuration.
//    * @param {Map<string, any>} rooms - Map of active mediasoup rooms.
//    * @param {import('redis').RedisClientType} pubClient - Redis client.
//    */
//   constructor(config, rooms, pubClient) {
//     this.activeRecordings = new Map();
//     this.recordingsDir =  process.env.RECORDINGS_DIR || './recordings';
//     this.rooms = rooms;
//     this.pubClient = pubClient;
//     this.config = config;
//     this.usedPorts = new Set();
//     this.portRange = { min: 30000, max: 39999 };

//     if (!fs.existsSync(this.recordingsDir)) {
//       fs.mkdirSync(this.recordingsDir, { recursive: true });
//       console.log(`[RecordingManager] Created directory: ${this.recordingsDir}`);
//     }
//   }

//   /**
//    * Allocate an unused port in the range 30000-39999
//    */
//   allocatePort() {
//     for (let i = 0; i < 100; i++) {
//       const port = Math.floor(Math.random() * (this.portRange.max - this.portRange.min + 1)) + this.portRange.min;
//       if (!this.usedPorts.has(port)) {
//         this.usedPorts.add(port);
//         return port;
//       }
//     }
//     throw new Error('No available ports in range 30000-39999');
//   }

//   /**
//    * Release a port back to the pool
//    */
//   releasePort(port) {
//     this.usedPorts.delete(port);
//   }

//   /** Save recording metadata to Redis. */
//   async saveRecordingToRedis(recording) {
//     try {
//       const safe = (v) => (v === undefined || v === null ? '' : String(v));
//       const recordingData = {
//         recordingId: recording.recordingId,
//         roomId: recording.roomId,
//         hostId: recording.hostId || '',
//         hostName: recording.hostName || '',
//         filePath: recording.filePath || '',
//         fileName: recording.fileName || '',
//         startTime: recording.startTime ? recording.startTime.toISOString() : '',
//         status: recording.status || 'unknown',
//         pausedTime: safe(recording.pausedTime),
//         segments: JSON.stringify(recording.segments || []),
//         duration: safe(recording.duration),
//         fileSize: safe(recording.fileSize),
//       };

//       const args = [`recording:${recording.recordingId}`];
//       for (const [key, value] of Object.entries(recordingData)) {
//         args.push(key, value);
//       }

//       await this.pubClient.hSet(...args);
//       await this.pubClient.sAdd('recordings', recording.recordingId);
//       console.log(`[Redis] Saved recording ${recording.recordingId}`);
//     } catch (err) {
//       console.error(`[Redis] Failed to save recording ${recording.recordingId}:`, err.message);
//     }
//   }

//   async loadRecordingFromRedis(recordingId) {
//     try {
//       const recordingData = await this.pubClient.hGetAll(`recording:${recordingId}`);
//       if (!recordingData.recordingId) return null;

//       const recording = {
//         recordingId: recordingData.recordingId,
//         roomId: recordingData.roomId,
//         hostId: recordingData.hostId,
//         hostName: recordingData.hostName,
//         filePath: recordingData.filePath,
//         fileName: recordingData.fileName,
//         startTime: new Date(recordingData.startTime),
//         status: recordingData.status,
//         pausedTime: parseInt(recordingData.pausedTime) || 0,
//         segments: recordingData.segments ? JSON.parse(recordingData.segments) : [],
//         duration: recordingData.duration ? parseInt(recordingData.duration) : undefined,
//         fileSize: recordingData.fileSize ? parseInt(recordingData.fileSize) : undefined,
//         audioPlainTransport: null,
//         videoPlainTransport: null,
//         audioConsumer: null,
//         videoConsumer: null,
//         ffmpegProcess: null,
//         config: { quality: 'medium' }
//       };

//       this.activeRecordings.set(recordingId, recording);
//       return recording;
//     } catch (err) {
//       console.error(`Error loading recording ${recordingId}:`, err);
//       return null;
//     }
//   }

//   async deleteRecordingFromRedis(recordingId) {
//     try {
//       await this.pubClient.del(`recording:${recordingId}`);
//       await this.pubClient.sRem('recordings', recordingId);
//     } catch (err) {
//       console.error(`Error deleting recording ${recordingId}:`, err);
//     }
//   }

//   /**
//    * Start a new recording for a given room and user.
//    * @param {string} roomId - Room ID.
//    * @param {string} userId - User initiating the recording.
//    * @param {string} userName - User name.
//    * @param {object} [config] - Optional configuration.
//    * @returns {Promise<object>} Recording information.
//    */
//   async startRecording(roomId, userId, userName, config = { quality: 'medium' }) {
//     const recordingId = uuidv4();
//     const timestamp = Date.now();
//     const fileName = `recording-${roomId}-${timestamp}.webm`;
//     const filePath = path.join(this.recordingsDir, fileName);

//     console.log('[RecordingManager] Starting recording:', { recordingId, roomId, fileName });

//     const room = this.rooms.get(roomId);
//     if (!room || !room.router) throw new Error('Room or router not found');

//     // Calculate how many transports we need based on producers
//     const producerCount = config.producers ? 
//       (config.producers.cameras.audio.length + 
//        config.producers.cameras.video.length +
//        (config.producers.screen.audio ? 1 : 0) +
//        (config.producers.screen.video ? 1 : 0)) : 2;

//     // Allocate ports for all streams
//     const ffmpegPorts = [];
//     for (let i = 0; i < producerCount; i++) {
//       ffmpegPorts.push({
//         rtp: this.allocatePort(),
//         rtcp: this.allocatePort()
//       });
//     }

//     console.log('[RecordingManager] Allocated FFmpeg ports:', ffmpegPorts);

//     const recording = {
//       recordingId,
//       roomId,
//       hostId: userId,
//       hostName: userName,
//       startTime: new Date(),
//       filePath,
//       fileName,
//       config,
//       status: 'initializing',
//       plainTransports: [],
//       consumers: [],
//       ffmpegPorts,
//       ffmpegProcess: null,
//       segments: [],
//       currentSegment: null,
//       pausedTime: 0,
//     };

//     this.activeRecordings.set(recordingId, recording);
//     await this.saveRecordingToRedis(recording);

//     return { recordingId, fileName, filePath, ffmpegPorts };
//   }

//   /**
//    * Connect the room producers to the FFmpeg recording transport.
//    * @param {string} recordingId - Recording ID.
//    * @param {string} audioProducerId - Audio producer ID.
//    * @param {string} videoProducerId - Video producer ID.
//    */
//  async connectAllProducersToRecording(recordingId, producers) {
//     const recording = this.activeRecordings.get(recordingId);
//     if (!recording) throw new Error('Recording not found');

//     const room = this.rooms.get(recording.roomId);
//     if (!room) throw new Error('Room not found');

//     console.log('[RecordingManager] Connecting all producers to recording...');

//     let portIndex = 0;

//     // Helper function to create transport and consumer
//     const createConsumer = async (producerInfo, kind) => {
//       const transport = await room.router.createPlainTransport({
//         listenIp: '127.0.0.1',
//         rtcpMux: false,
//         comedia: false,
//         enableSctp: false,
//         enableSrtp: false
//       });

//       recording.plainTransports.push(transport);

//       const consumer = await transport.consume({
//         producerId: producerInfo.id,
//         rtpCapabilities: room.router.rtpCapabilities,
//         paused: false,
//       });

//       recording.consumers.push({
//         consumer,
//         transport,
//         kind,
//         userId: producerInfo.userId,
//         isScreen: false,
//         portIndex
//       });

//       console.log(`[RecordingManager] Created ${kind} consumer for user ${producerInfo.userId}`);
//       portIndex++;

//       return { consumer, transport, portIndex: portIndex - 1 };
//     };

//     // Create consumers for all camera videos
//     for (const videoProducer of producers.cameras.video) {
//       await createConsumer(videoProducer, 'video');
//     }

//     // Create consumers for all camera audios
//     for (const audioProducer of producers.cameras.audio) {
//       await createConsumer(audioProducer, 'audio');
//     }

//     // Create consumer for screen video (if exists)
//     if (producers.screen.video) {
//       const result = await createConsumer(producers.screen.video, 'video');
//       recording.consumers[recording.consumers.length - 1].isScreen = true;
//     }

//     // Create consumer for screen audio (if exists)
//     if (producers.screen.audio) {
//       const result = await createConsumer(producers.screen.audio, 'audio');
//       recording.consumers[recording.consumers.length - 1].isScreen = true;
//     }

//     if (recording.consumers.length === 0) {
//       throw new Error('No valid consumers created.');
//     }

//     // Generate SDP file for FFmpeg
//     const sdpFilePath = await this.generateSdpFileForMultiStream(recording);
   
//     recording.currentSegment = `${recording.filePath}.${recording.segments.length}.webm`;
//     recording.segments.push(recording.currentSegment);
    
//     recording.status = 'ready';
//     await this.saveRecordingToRedis(recording);

//     console.log('[RecordingManager] SDP file generated at:', sdpFilePath);
    
//     // Start FFmpeg
//     await this.startFFmpegMultiStreamRecording(recordingId, sdpFilePath, recording.currentSegment);

//     // Wait for FFmpeg to start listening
//     await new Promise(resolve => setTimeout(resolve, 3000));

//     // Connect all transports to send to FFmpeg
//     console.log('[RecordingManager] Connecting PlainTransports to send to FFmpeg...');
    
//     for (const consumerInfo of recording.consumers) {
//       const port = recording.ffmpegPorts[consumerInfo.portIndex];
//       await consumerInfo.transport.connect({
//         ip: '127.0.0.1',
//         port: port.rtp,
//         rtcpPort: port.rtcp
//       });
//       console.log(`[RecordingManager] ${consumerInfo.kind} transport (${consumerInfo.isScreen ? 'screen' : 'camera'}) sending to port ${port.rtp}`);
//     }

//     console.log('[RecordingManager] Recording fully started with all streams!');

//     return {
//       consumerIds: recording.consumers.map(c => c.consumer.id)
//     };
//   }


//    /**
//    * Generate SDP file for multiple streams
//    */
//   async generateSdpFileForMultiStream(recording) {
//     const sdpPath = `${recording.filePath}.sdp`;

//     const lines = [
//       'v=0',
//       'o=- 0 0 IN IP4 127.0.0.1',
//       's=Mediasoup Multi-Stream Recording',
//       'c=IN IP4 127.0.0.1',
//       't=0 0',
//     ];

//     // Add media sections for each consumer
//     for (const consumerInfo of recording.consumers) {
//       const { consumer, portIndex } = consumerInfo;
//       const port = recording.ffmpegPorts[portIndex];
//       const c = consumer.rtpParameters.codecs[0];
//       const codecName = c.mimeType.split('/')[1];
//       const kind = consumer.kind;

//       lines.push(
//         `m=${kind} ${port.rtp} RTP/AVP ${c.payloadType}`,
//         `a=rtpmap:${c.payloadType} ${codecName}/${c.clockRate}${kind === 'audio' ? `/${c.channels || 2}` : ''}`,
//         'a=recvonly'
//       );

//       if (c.parameters) {
//         const fmtpParts = [];
//         for (const [key, value] of Object.entries(c.parameters)) {
//           fmtpParts.push(`${key}=${value}`);
//         }
//         if (fmtpParts.length > 0) {
//           lines.push(`a=fmtp:${c.payloadType} ${fmtpParts.join(';')}`);
//         }
//       }
//     }

//     const sdp = lines.join('\n') + '\n';
//     fs.writeFileSync(sdpPath, sdp);
//     console.log('[SDP] Multi-stream SDP written to', sdpPath);
//     return sdpPath;
//   }

//   /**
//    * Launch FFmpeg to record multiple RTP streams and compose them
//    */
//   async startFFmpegMultiStreamRecording(recordingId, sdpFilePath, outputFile) {
//     const recording = this.activeRecordings.get(recordingId);
//     if (!recording) throw new Error('Recording not found');

    // const args = [
    //   '-protocol_whitelist', 'file,rtp,udp',
    //   '-analyzeduration', '50M',
    //   '-probesize', '20M',
    //   '-fflags', '+genpts+igndts',
    //   '-flags', 'low_delay',
    //   '-strict', 'experimental',
    //   '-rw_timeout', '10000000',
    //   '-re',
    //   '-i', sdpFilePath,
    // ];

//     // Find screen video and camera videos
//     const screenVideo = recording.consumers.find(c => c.kind === 'video' && c.isScreen);
//     const cameraVideos = recording.consumers.filter(c => c.kind === 'video' && !c.isScreen);
//     const allAudios = recording.consumers.filter(c => c.kind === 'audio');

//     // Complex filter for video composition
//     let filterComplex = '';
    
//     if (screenVideo && cameraVideos.length > 0) {
//       // Layout: Screen share as main + cameras in grid overlay
//       const screenIdx = recording.consumers.indexOf(screenVideo);
      
//       // Scale screen to output size
//       filterComplex += `[0:${screenIdx}]scale=1280:720[screen];`;
      
//       // Create camera grid overlay
//       const gridSize = Math.ceil(Math.sqrt(cameraVideos.length));
//       const camWidth = 200;
//       const camHeight = 150;
      
//       cameraVideos.forEach((cam, idx) => {
//         const camIdx = recording.consumers.indexOf(cam);
//         const row = Math.floor(idx / gridSize);
//         const col = idx % gridSize;
//         const x = 1280 - (camWidth * (gridSize - col));
//         const y = row * camHeight;
        
//         filterComplex += `[0:${camIdx}]scale=${camWidth}:${camHeight}[cam${idx}];`;
//       });
      
//       // Overlay cameras on screen
//       filterComplex += '[screen]';
//       cameraVideos.forEach((cam, idx) => {
//         const row = Math.floor(idx / gridSize);
//         const col = idx % gridSize;
//         const x = 1280 - (camWidth * (gridSize - col));
//         const y = row * camHeight;
        
//         filterComplex += `[cam${idx}]overlay=${x}:${y}`;
//         if (idx < cameraVideos.length - 1) filterComplex += '[tmp' + idx + '];[tmp' + idx + ']';
//       });
//       filterComplex += '[vout];';
      
//     } else if (cameraVideos.length > 0) {
//       // No screen share, just compose cameras in grid
//       const gridCols = Math.ceil(Math.sqrt(cameraVideos.length));
//       const gridRows = Math.ceil(cameraVideos.length / gridCols);
//       const cellWidth = Math.floor(1280 / gridCols);
//       const cellHeight = Math.floor(720 / gridRows);
      
//       cameraVideos.forEach((cam, idx) => {
//         const camIdx = recording.consumers.indexOf(cam);
//         filterComplex += `[0:${camIdx}]scale=${cellWidth}:${cellHeight}[v${idx}];`;
//       });
      
//       // Create xstack layout
//       let xstackInputs = cameraVideos.map((_, idx) => `[v${idx}]`).join('');
//       let layout = cameraVideos.map((_, idx) => {
//         const row = Math.floor(idx / gridCols);
//         const col = idx % gridCols;
//         return `${col * cellWidth}_${row * cellHeight}`;
//       }).join('|');
      
//       filterComplex += `${xstackInputs}xstack=inputs=${cameraVideos.length}:layout=${layout}[vout];`;
//     }

//     // Mix all audio streams
//     if (allAudios.length > 1) {
//       const audioInputs = allAudios.map((_, idx) => {
//         const audioIdx = recording.consumers.indexOf(allAudios[idx]);
//         return `[0:${audioIdx}]`;
//       }).join('');
//       filterComplex += `${audioInputs}amix=inputs=${allAudios.length}:duration=longest[aout]`;
//     } else if (allAudios.length === 1) {
//       const audioIdx = recording.consumers.indexOf(allAudios[0]);
//       filterComplex += `[0:${audioIdx}]acopy[aout]`;
//     }

//     if (filterComplex) {
//       args.push('-filter_complex', filterComplex);
//       args.push('-map', '[vout]');
//       if (allAudios.length > 0) {
//         args.push('-map', '[aout]');
//       }
//     }

//     // Encoding settings
//     args.push(
//       '-c:v', 'libvpx',
//       '-b:v', '2M',
//       '-quality', 'realtime',
//       '-speed', '5',
//       '-threads', '4'
//     );

//     if (allAudios.length > 0) {
//       args.push(
//         '-c:a', 'libopus',
//         '-b:a', '128k'
//       );
//     }

//     args.push(
//       '-f', 'webm',
//       '-y', outputFile
//     );

//     console.log(`[FFmpeg] Launch: ffmpeg ${args.join(' ')}`);
    
//     const ffmpeg = spawn('ffmpeg', args);
//     recording.ffmpegProcess = ffmpeg;
//     recording.status = 'recording';
//     await this.saveRecordingToRedis(recording);

//     let started = false;

//     ffmpeg.stderr.on('data', (data) => {
//       const s = data.toString();
      
//       if (s.includes('Stream mapping') || s.includes('Output #0')) {
//         started = true;
//         console.log('[FFmpeg] Multi-stream recording started successfully!');
//       }
      
//       if (s.includes('frame=')) {
//         if (!started) {
//           started = true;
//           console.log('[FFmpeg] First frame received');
//         }
//         if (Math.random() < 0.02) process.stdout.write('.');
//       } else if (s.includes('Error') || s.includes('Invalid') || s.includes('failed')) {
//         console.error(`[FFmpeg ERROR] ${s}`);
//       } else if (!started) {
//         console.log(`[FFmpeg] ${s.trim()}`);
//       }
//     });

//     ffmpeg.on('close', async (code) => {
//       console.log(`\n[FFmpeg] Exited with code ${code}`);
//       if (code !== 0 && recording.status === 'recording') {
//         recording.status = 'failed';
//       }
//       if (fs.existsSync(sdpFilePath)) fs.unlinkSync(sdpFilePath);
//       await this.saveRecordingToRedis(recording);
//     });

//     ffmpeg.on('error', (err) => {
//       console.error('[FFmpeg] Process error:', err);
//       recording.status = 'failed';
//     });
//   }

//   /**
//    * Stop recording - updated to close all transports
//    */
//   async stopRecording(recordingId) {
//     const recording = this.activeRecordings.get(recordingId);
//     if (!recording) throw new Error('Recording not found');

//     console.log('[RecordingManager] Stopping:', recordingId);

//     if (recording.ffmpegProcess) {
//       recording.ffmpegProcess.kill('SIGINT');
//       await new Promise(r => {
//         recording.ffmpegProcess.on('close', r);
//         setTimeout(() => {
//           if (recording.ffmpegProcess) recording.ffmpegProcess.kill('SIGKILL');
//           r();
//         }, 10000);
//       });
//     }

//     // Close all consumers and transports
//     for (const consumerInfo of recording.consumers || []) {
//       try {
//         if (consumerInfo.consumer) consumerInfo.consumer.close();
//         if (consumerInfo.transport) consumerInfo.transport.close();
//       } catch (err) {
//         console.warn('Error closing consumer/transport:', err);
//       }
//     }

//     // Release all allocated ports
//     if (recording.ffmpegPorts) {
//       for (const port of recording.ffmpegPorts) {
//         this.releasePort(port.rtp);
//         this.releasePort(port.rtcp);
//       }
//     }

//     // Concatenate segments if multiple
//     if (recording.segments.length > 1) {
//       await this.concatenateSegments(recording);
//     } else if (recording.segments.length === 1 && fs.existsSync(recording.segments[0])) {
//       fs.renameSync(recording.segments[0], recording.filePath);
//     }

//     recording.status = 'stopped';
//     recording.endTime = new Date();
//     recording.duration = Math.floor((recording.endTime - recording.startTime - recording.pausedTime) / 1000);
    
//     if (fs.existsSync(recording.filePath)) {
//       recording.fileSize = fs.statSync(recording.filePath).size;
//     }

//     await this.saveRecordingToRedis(recording);
//     this.activeRecordings.delete(recordingId);

//     console.log('[RecordingManager] Stopped:', {
//       recordingId,
//       duration: recording.duration,
//       fileSize: recording.fileSize
//     });

//     return recording;
//   }

//   getCodecInfoFromRtpParameters(kind, rtpParameters) {
//     return {
//       payloadType: rtpParameters.codecs[0].payloadType,
//       codecName: rtpParameters.codecs[0].mimeType.replace(`${kind}/`, ''),
//       clockRate: rtpParameters.codecs[0].clockRate,
//       channels: kind === 'audio' ? rtpParameters.codecs[0].channels : undefined
//     };
//   }

//   videoArgs() {
//     return [
//       '-map',
//       '0:v:0',
//       '-c:v',
//       'copy'
//     ];
//   }

//   audioArgs() {
//     return [
//       '-map',
//       '0:a:0',
//       '-strict',
//       '-2',
//       '-c:a',
//       'copy'
//     ];
//   }

//   /** Generate a temporary SDP file for FFmpeg input. */
//   async generateSdpFile(recording) {
//     const { ffmpegPorts, audioConsumer, videoConsumer, filePath } = recording;
//     const sdpPath = `${filePath}.sdp`;

//     const lines = [
//       'v=0',
//       'o=- 0 0 IN IP4 127.0.0.1',
//       's=Mediasoup Recording',
//       'c=IN IP4 127.0.0.1',
//       't=0 0',
//     ];

//     // Add video first (if exists)
//     if (videoConsumer) {
//       const c = videoConsumer.rtpParameters.codecs[0];
//       const codecName = c.mimeType.split('/')[1];
      
//       lines.push(
//         `m=video ${ffmpegPorts.video} RTP/AVP ${c.payloadType}`,
//         `a=rtpmap:${c.payloadType} ${codecName}/${c.clockRate}`,
//         'a=recvonly'
//       );

//       // Add fmtp for VP8/VP9/H264
//       if (c.parameters) {
//         const fmtpParts = [];
//         for (const [key, value] of Object.entries(c.parameters)) {
//           fmtpParts.push(`${key}=${value}`);
//         }
//         if (fmtpParts.length > 0) {
//           lines.push(`a=fmtp:${c.payloadType} ${fmtpParts.join(';')}`);
//         }
//       }
//     }

//     // Add audio second (if exists)
//     if (audioConsumer) {
//       const c = audioConsumer.rtpParameters.codecs[0];
//       const codecName = c.mimeType.split('/')[1];
//       const channels = c.channels || 2;
      
//       lines.push(
//         `m=audio ${ffmpegPorts.audio} RTP/AVP ${c.payloadType}`,
//         `a=rtpmap:${c.payloadType} ${codecName}/${c.clockRate}/${channels}`,
//         'a=recvonly'
//       );

//       // Add fmtp for Opus
//       if (c.parameters) {
//         const fmtpParts = [];
//         for (const [key, value] of Object.entries(c.parameters)) {
//           fmtpParts.push(`${key}=${value}`);
//         }
//         if (fmtpParts.length > 0) {
//           lines.push(`a=fmtp:${c.payloadType} ${fmtpParts.join(';')}`);
//         }
//       }
//     }

//     const sdp = lines.join('\n') + '\n';
//     fs.writeFileSync(sdpPath, sdp);
//     console.log('[SDP] Written', sdpPath);
//     console.log('[SDP] Content:\n', sdp);
//     return sdpPath;
//   }

//   /**
//    * Launch FFmpeg to record RTP from mediasoup.
//    * @private
//    */
//   async startFFmpegRecording(recordingId, sdpFilePath, outputFile) {
//     const recording = this.activeRecordings.get(recordingId);
//     if (!recording) throw new Error('Recording not found');

//     // Build args based on what streams we have
//     const args = [
//       '-protocol_whitelist', 'file,rtp,udp',
//       '-analyzeduration', '50M',
//       '-probesize', '20M',
//       '-fflags', '+genpts+igndts',
//       '-flags', 'low_delay',
//       '-strict', 'experimental',
//       '-rw_timeout', '10000000',
//       '-re',
//       '-i', sdpFilePath,
//     ];

//     // Map streams explicitly in correct order
//     if (recording.videoConsumer) {
//       args.push('-map', '0:v:0');
//     }
//     if (recording.audioConsumer) {
//       args.push('-map', '0:a:0');
//     }

//     // Codec settings
//     if (recording.videoConsumer) {
//       const videoCodec = recording.videoConsumer.rtpParameters.codecs[0].mimeType.split('/')[1].toLowerCase();
      
//       if (videoCodec === 'vp8') {
//         args.push('-c:v', 'libvpx');
//         args.push('-b:v', '2M');
//         args.push('-quality', 'realtime');
//         args.push('-speed', '5');
//         args.push('-threads', '4');
//       } else if (videoCodec === 'vp9') {
//         args.push('-c:v', 'libvpx-vp9');
//         args.push('-b:v', '2M');
//       } else if (videoCodec === 'h264') {
//         // H264 -> VP8 transcode for WebM
//         args.push('-c:v', 'libvpx');
//         args.push('-b:v', '2M');
//         args.push('-quality', 'realtime');
//         args.push('-speed', '5');
//       } else {
//         // Fallback transcode
//         args.push('-c:v', 'libvpx');
//         args.push('-b:v', '2M');
//       }
//     }

//     if (recording.audioConsumer) {
//       const audioCodec = recording.audioConsumer.rtpParameters.codecs[0].mimeType.split('/')[1].toLowerCase();
      
//       if (audioCodec === 'opus') {
//         args.push('-c:a', 'libopus');
//         args.push('-b:a', '128k');
//       } else {
//         // Transcode to opus for WebM
//         args.push('-c:a', 'libopus');
//         args.push('-b:a', '128k');
//       }
//     }

//     args.push(
//       '-f', 'webm',
//       '-y', outputFile
//     );

//     console.log(`[FFmpeg] Launch: ffmpeg ${args.join(' ')}`);
//     if(!fs.existsSync(sdpFilePath)) throw new Error('SDP file does not exist: ' + sdpFilePath);
    
//     const ffmpeg = spawn('ffmpeg', args);
//     recording.ffmpegProcess = ffmpeg;
//     recording.status = 'recording';
//     await this.saveRecordingToRedis(recording);

//     let started = false;

//     ffmpeg.stderr.on('data', (data) => {
//       const s = data.toString();
      
//       if (s.includes('Stream mapping') || s.includes('Output #0')) {
//         started = true;
//         console.log('[FFmpeg] Recording started successfully!');
//       }
      
//       if (s.includes('frame=')) {
//         if (!started) {
//           started = true;
//           console.log('[FFmpeg] First frame received');
//         }
//         if (Math.random() < 0.02) process.stdout.write('.');
//       } else if (s.includes('Error') || s.includes('Invalid') || s.includes('failed')) {
//         console.error(`[FFmpeg ERROR] ${s}`);
//       } else if (!started) {
//         console.log(`[FFmpeg] ${s.trim()}`);
//       }
//     });

//     ffmpeg.on('close', async (code) => {
//       console.log(`\n[FFmpeg] Exited with code ${code}`);
//       if (code !== 0 && recording.status === 'recording') {
//         recording.status = 'failed';
//       }
//       if (fs.existsSync(sdpFilePath)) fs.unlinkSync(sdpFilePath);
//       await this.saveRecordingToRedis(recording);
//     });

//     ffmpeg.on('error', (err) => {
//       console.error('[FFmpeg] Process error:', err);
//       recording.status = 'failed';
//     });
//   }

//   /**
//    * Pause recording
//    */
//   async pauseRecording(recordingId) {
//     const recording = this.activeRecordings.get(recordingId) || await this.loadRecordingFromRedis(recordingId);
//     if (!recording) throw new Error('Recording not found');
//     if (recording.status !== 'recording') throw new Error('Not recording');

//     console.log('[RecordingManager] Pausing:', recordingId);

//     if (recording.audioConsumer) await recording.audioConsumer.pause();
//     if (recording.videoConsumer) await recording.videoConsumer.pause();

//     if (recording.ffmpegProcess) {
//       recording.ffmpegProcess.kill('SIGINT');
//       await new Promise(r => {
//         recording.ffmpegProcess.on('close', r);
//         setTimeout(() => {
//           if (recording.ffmpegProcess) recording.ffmpegProcess.kill('SIGKILL');
//           r();
//         }, 5000);
//       });
//       recording.ffmpegProcess = null;
//     }

//     recording.status = 'paused';
//     recording.pausedTime = Date.now();
//     await this.saveRecordingToRedis(recording);

//     return { recordingId, roomId: recording.roomId, status: 'paused' };
//   }

//   /**
//    * Resume recording
//    */
//   async resumeRecording(recordingId) {
//     const recording = this.activeRecordings.get(recordingId) || await this.loadRecordingFromRedis(recordingId);
//     if (!recording) throw new Error('Recording not found');
//     if (recording.status !== 'paused') throw new Error('Not paused');

//     console.log('[RecordingManager] Resuming:', recordingId);

//     if (recording.audioConsumer) await recording.audioConsumer.resume();
//     if (recording.videoConsumer) await recording.videoConsumer.resume();

//     const sdpFilePath = await this.generateSdpFile(recording);
//     recording.currentSegment = `${recording.filePath}.${recording.segments.length}.webm`;
//     recording.segments.push(recording.currentSegment);
    
//     await this.startFFmpegRecording(recordingId, sdpFilePath, recording.currentSegment);
    
//     // Wait for FFmpeg to start
//     await new Promise(resolve => setTimeout(resolve, 3000));
    
//     // Reconnect transports to send to FFmpeg
//     if (recording.audioConsumer) {
//       await recording.audioPlainTransport.connect({
//         ip: '127.0.0.1',
//         port: recording.ffmpegPorts.audio,
//         rtcpPort: recording.ffmpegPorts.audioRtcp
//       });
//     }
    
//     if (recording.videoConsumer) {
//       await recording.videoPlainTransport.connect({
//         ip: '127.0.0.1',
//         port: recording.ffmpegPorts.video,
//         rtcpPort: recording.ffmpegPorts.videoRtcp
//       });
//     }
    
//     const pauseDuration = Date.now() - recording.pausedTime;
//     recording.pausedTime = pauseDuration;
//     await this.saveRecordingToRedis(recording);

//     return { recordingId, roomId: recording.roomId, status: 'recording' };
//   }

//   /**
//    * Stop and finalize a recording.
//    * @param {string} recordingId - Recording ID.
//    */
//   async stopRecording(recordingId) {
//     const recording = this.activeRecordings.get(recordingId);
//     if (!recording) throw new Error('Recording not found');

//     console.log('[RecordingManager] Stopping:', recordingId);

//     if (recording.ffmpegProcess) {
//       recording.ffmpegProcess.kill('SIGINT');
//       await new Promise(r => {
//         recording.ffmpegProcess.on('close', r);
//         setTimeout(() => {
//           if (recording.ffmpegProcess) recording.ffmpegProcess.kill('SIGKILL');
//           r();
//         }, 10000);
//       });
//     }

//     if (recording.audioConsumer) recording.audioConsumer.close();
//     if (recording.videoConsumer) recording.videoConsumer.close();
//     if (recording.audioPlainTransport) recording.audioPlainTransport.close();
//     if (recording.videoPlainTransport) recording.videoPlainTransport.close();

//     // Release allocated ports
//     if (recording.ffmpegPorts) {
//       this.releasePort(recording.ffmpegPorts.audio);
//       this.releasePort(recording.ffmpegPorts.video);
//       this.releasePort(recording.ffmpegPorts.audioRtcp);
//       this.releasePort(recording.ffmpegPorts.videoRtcp);
//     }

//     // Concatenate segments if multiple
//     if (recording.segments.length > 1) {
//       await this.concatenateSegments(recording);
//     } else if (recording.segments.length === 1 && fs.existsSync(recording.segments[0])) {
//       fs.renameSync(recording.segments[0], recording.filePath);
//     }

//     recording.status = 'stopped';
//     recording.endTime = new Date();
//     recording.duration = Math.floor((recording.endTime - recording.startTime - recording.pausedTime) / 1000);
    
//     if (fs.existsSync(recording.filePath)) {
//       recording.fileSize = fs.statSync(recording.filePath).size;
//     }

//     await this.saveRecordingToRedis(recording);
//     this.activeRecordings.delete(recordingId);

//     console.log('[RecordingManager] Stopped:', {
//       recordingId,
//       duration: recording.duration,
//       fileSize: recording.fileSize
//     });

//     return recording;
//   }

//   async concatenateSegments(recording) {
//     const listPath = `${recording.filePath}.concat.txt`;
//     fs.writeFileSync(listPath, recording.segments.map(s => `file '${s}'`).join('\n'));

//     return new Promise((resolve, reject) => {
//       const ffmpeg = spawn('ffmpeg', [
//         '-f', 'concat',
//         '-safe', '0',
//         '-i', listPath,
//         '-c', 'copy',
//         '-y', recording.filePath
//       ]);

//       ffmpeg.on('close', code => {
//         recording.segments.forEach(s => fs.existsSync(s) && fs.unlinkSync(s));
//         fs.existsSync(listPath) && fs.unlinkSync(listPath);
//         code === 0 ? resolve() : reject(new Error('Concat failed'));
//       });

//       ffmpeg.on('error', reject);
//     });
//   }

//   async deleteRecording(recordingId) {
//     const recording = await this.loadRecordingFromRedis(recordingId);
//     if (!recording) return;

//     if (fs.existsSync(recording.filePath)) fs.unlinkSync(recording.filePath);
//     recording.segments.forEach(s => fs.existsSync(s) && fs.unlinkSync(s));
    
//     // Release ports if they exist
//     if (recording.ffmpegPorts) {
//       this.releasePort(recording.ffmpegPorts.audio);
//       this.releasePort(recording.ffmpegPorts.video);
//       this.releasePort(recording.ffmpegPorts.audioRtcp);
//       this.releasePort(recording.ffmpegPorts.videoRtcp);
//     }
    
//     this.activeRecordings.delete(recordingId);
//     await this.deleteRecordingFromRedis(recordingId);
//   }

//   getRecording(recordingId) {
//     return this.activeRecordings.get(recordingId) || this.loadRecordingFromRedis(recordingId);
//   }
// }

// module.exports = { RecordingManager };