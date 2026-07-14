// // recordingManager2.js - FIXED VERSION with proper video recording

// const { FFmpeg } = require('./ffmpeg');
// const path = require('path');
// const fs = require('fs');
// const { once } = require('events');

// class RecordingManager2 {
//   constructor(opts = {}, rooms, redisClient) {
//     this.rooms = rooms;
//     this.redis = redisClient;
//     this.recordingsDir = opts.recordingsDir || './recordings_meeting';
//     this.portManager = opts.portManager;
//     this.logger = opts.logger || console;
//     this.debug = !!opts.debug;
//     this.videoTransports = new Map()

//     if (!this.portManager) {
//       throw new Error('portManager is required in RecordingManager2 opts');
//     }

//     this.activeRecordings = new Map();
//     this._ensureRecordingsDir();
//   }

//   _ensureRecordingsDir() {
//     if (!fs.existsSync(this.recordingsDir)) {
//       fs.mkdirSync(this.recordingsDir, { recursive: true });
//     }
//   }

  
// /**
//  * startRecording -  create transport
//  *                    connect tranport
//  *                    create sdp
//  *                    create ffmpeg pass sdp
//  * @params {string} roomId
//  * @params {string} userId
//  * @params {object} opt {
//  *                         quality: 'medium'| 'low' | 'high', 
//  *                         producders: { 
//  *                                         cameras: {audio: [], video: [] }
//  *                                          screen: {audio: [], video: [] }   
//  *                                      }   
//  *                       }
//  * 
//  */
//     async startRecording(roomId, userId, userName, { quality = 'medium', producers }) {
//     const room = this.rooms.get(roomId);
//     if (!room) throw new Error('Room not found');
//     if (this.activeRecordings.has(roomId)) throw new Error('Recording already in progress');
    
//     const timestamp = Date.now();
//     const recordingId = `${roomId}-${timestamp}`;
//     const baseFilename = `rec-${roomId}-${timestamp}`;
//     const filePath = path.join(this.recordingsDir, `${baseFilename}.webm`);

//     this.logger.log(`[Recording] Starting for room ${roomId} by ${userName}`);

//     // Allocate ports from your AdvancedPortManager
//     const audioPorts = await this.portManager.allocatePair('recording-audio', roomId);
//     const videoPorts = await this.portManager.allocatePair('recording-video', roomId);

//     this.logger.log(`[Recording] Allocated ports → Audio RTP: ${audioPorts.rtpPort} RTCP: ${audioPorts.rtcpPort}, Video RTP: ${videoPorts.rtpPort} RTCP: ${videoPorts.rtcpPort}`);

//     // Create PlainTransports (mediasoup sends to FFmpeg)
//     const audioTransport = await room.router.createPlainTransport({
//       listenIp: '127.0.0.1',
//       rtcpMux: false,        // MUST be false if you want separate RTCP port
//       comedia: false,
//       enableSrtp: false,
//       enableSctp: false,
//     });

//     const videoTransport = await room.router.createPlainTransport({
//       listenIp: '127.0.0.1',
//       rtcpMux: false,
//       comedia: false,
//       enableSrtp: false,
//       enableSctp: false,
//     });

//     // Tell mediasoup: "Send RTP/RTCP to these ports where FFmpeg is listening"
//     await audioTransport.connect({
//       ip: '127.0.0.1',
//       port: audioPorts.rtpPort,
//       rtcpPort: audioPorts.rtcpPort
//     });

//     await videoTransport.connect({
//       ip: '127.0.0.1',
//       port: videoPorts.rtpPort,
//       rtcpPort: videoPorts.rtcpPort
//     });

//     this.logger.log(`[Recording] Transports connected:
//       Audio → local ${audioTransport.tuple.localPort} (send to ${audioPorts.rtpPort}/${audioPorts.rtcpPort})
//       Video → local ${videoTransport.tuple.localPort} (send to ${videoPorts.rtpPort}/${videoPorts.rtcpPort})`);

//     // Generate SDP telling FFmpeg to LISTEN on the allocated ports
//     const sdp = this._generateSDP(
//       audioPorts.rtpPort, 
//       audioPorts.rtcpPort,
//       videoPorts.rtpPort, 
//       videoPorts.rtcpPort,
//       room.router.rtpCapabilities
//     );

//     const ffmpeg = new FFmpeg({ combined: sdp }, baseFilename, {
//       recordingsDir: this.recordingsDir,
//       ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
//       debug: this.debug,
      
//     });

//     const recording = {
//       recordingId, roomId, userId, userName, quality,
//       fileName: `${baseFilename}.webm`,
//       filePath,
//       startTime: Date.now(),
//       audioTransport, videoTransport,
//       audioConsumers: new Map(),
//       videoConsumers: new Map(),
//       ffmpeg,
//       status: 'recording',
//       ports: { audio: audioPorts, video: videoPorts },
//       isScreenSharing: false,
//       _newProducerListener: null,
//       _producerCloseListeners: new Map()
//     };

//     this.activeRecordings.set(roomId, recording);
//     this._setupFFmpegEvents(recording);

//     // Start FFmpeg FIRST (in listening mode)
//     const ffmpegProcess = await ffmpeg._spawnFFmpeg();
   
   
//     this.logger.log(`[Recording] FFmpeg signalled started (PID: ${ffmpeg.child?.pid})`);

//     // Now consume all producers
//     await this.connectAllProducersToRecording(roomId, producers);

//   const handleNewProducer = async (producer) => {  // ← add async
//   const recording = this.activeRecordings.get(roomId);
//   if (!recording || recording.status !== 'recording') return;

//   try {
//     if (producer.appData?.isScreen) {
//       await this.handleScreenShareStart(roomId, producer);
//     } else if (producer.kind === 'audio') {
//       // Always record audio
//       await this.addProducerToRecording(recording, producer, room);
//     } else if (producer.kind === 'video' && !recording.isScreenSharing) {
//       await this.addProducerToRecording(recording, producer, room);
//     }
//   } catch (err) {
//     this.logger.error(`[Recording] Failed to consume new producer ${producer.id} (${producer.kind}):`, err);
//   }
// };

//     room.router.on('newproducer', handleNewProducer);
//     recording._newProducerListener = handleNewProducer;

//     this.logger.log(`[Recording] ✓ Started ${recordingId}`);
//     return { recordingId, fileName: recording.fileName, filePath };
//   }










// /**
//  *  connectAllProducersToRecording - Take the produce in each audio an video and pass 
//  *                                    them to addProducerToRecording method
//  *  @params {string} roomId
//  *  @params {object} producers {
//  *                                 cameras: { audio: [], video: [] },
//  *                                 screen: { audio: [], video: [] }
//  *                             }
//  */

//   async connectAllProducersToRecording(roomId, producers) {
//   const recording = this.activeRecordings.get(roomId);
//   if (!recording) return;

//   const room = this.rooms.get(roomId);
//   if (!room) return;

//   this.logger.log(`[Recording] Connecting initial producers...`);

//   if (producers.screen.video) {
//     recording.isScreenSharing = true;

//     // Record screen video + audio
//     if (producers.screen.video) await this.addProducerToRecording(recording, producers.screen.video.producer, room);
//     if (producers.screen.audio) await this.addProducerToRecording(recording, producers.screen.audio.producer, room);

//     // Still record ALL participant microphone audio during screen share
//     for (const p of producers.cameras.audio) {
//       await this.addProducerToRecording(recording, p.producer, room);
//     }

//   } else {
//     recording.isScreenSharing = false;

//     // Record all camera audio + video
//     for (const p of producers.cameras.audio) {
//       //p =  { id, userId: uid, producer };
//       await this.addProducerToRecording(recording, p.producer, room);
//     }
//     for (const p of producers.cameras.video) {
//       await this.addProducerToRecording(recording, p.producer, room);
//     }
//   }
// }





//   async handleScreenShareStart(roomId, screenProducer) {
//     const recording = this.activeRecordings.get(roomId);
//     if (!recording || recording.status !== 'recording') return;

//     const room = this.rooms.get(roomId);
//     if (!room) return;

//     this.logger.log(`[Recording] Screen share started - switching recording focus`);

//     // Close all camera video consumers
//     for (const [producerId, consumer] of recording.videoConsumers) {
//       if (!consumer.producer?.appData?.isScreen) {
//         this.logger.log(`[Recording] Closing camera video consumer: ${producerId}`);
//         consumer.close();
//         recording.videoConsumers.delete(producerId);
//       }
//     }

//     recording.isScreenSharing = true;

//     // Add screen producer
//     await this.addProducerToRecording(recording, screenProducer, room);
//   }

//   async handleScreenShareStop(roomId) {
//     const recording = this.activeRecordings.get(roomId);
//     if (!recording || recording.status !== 'recording') return;

//     const room = this.rooms.get(roomId);
//     if (!room) return;

//     this.logger.log(`[Recording] Screen share stopped - switching back to cameras`);

//     // Close screen consumers
//     for (const [producerId, consumer] of recording.videoConsumers) {
//       if (consumer.producer?.appData?.isScreen) {
//         this.logger.log(`[Recording] Closing screen consumer: ${producerId}`);
//         consumer.close();
//         recording.videoConsumers.delete(producerId);
//       }
//     }

//     recording.isScreenSharing = false;

//     // Re-add all camera videos
//     for (const [uid, peer] of room.peers) {
//       for (const producer of peer.producers.values()) {

//         if (producer.kind === 'video' && !producer.appData?.isScreen) {
//           await this.addProducerToRecording(recording, producer, room);
//         }

//         if (producer.kind === 'audio') {
//           await this.addProducerToRecording(recording, producer, room);
//         }
//       }
//     }
//   }

// //  _generateSDP(audioPort, audioRtcpPort, videoPort, videoRtcpPort, rtpCapabilities) {
// //     const audioCodec = rtpCapabilities.codecs.find(c => c.kind === 'audio' && c.mimeType.toLowerCase().includes('opus'));
// //     const videoCodec = rtpCapabilities.codecs.find(c => c.kind === 'video' && c.mimeType.toLowerCase().includes('vp8'));

// //     if (!audioCodec || !videoCodec) {
// //       throw new Error('Required codecs (Opus/VP8) not supported');
// //     }

// //     return [
// //       'v=0',
// //       'o=- 0 0 IN IP4 127.0.0.1',
// //       's=Mediasoup Recording',
// //       'c=IN IP4 127.0.0.1',
// //       't=0 0',
// //       '',
// //       `m=audio ${audioPort} RTP/AVP ${audioCodec.preferredPayloadType}`,
// //       'a=recvonly',
// //       `a=rtpmap:${audioCodec.preferredPayloadType} opus/48000/2`,
// //       `a=rtcp:${audioRtcpPort}`,
// //       '',
// //       `m=video ${videoPort} RTP/AVP ${videoCodec.preferredPayloadType}`,
// //       'a=recvonly',
// //       `a=rtpmap:${videoCodec.preferredPayloadType} VP8/90000`,
// //       `a=rtcp:${videoRtcpPort}`,
// //       'a=rtcp-fb:* nack',
// //       'a=rtcp-fb:* nack pli',
// //       'a=rtcp-fb:* goog-remb'
// //     ].join('\r\n') + '\r\n';
// //   }


// // In recordingManager2.js — REPLACE the entire _generateSDP function
// _generateSDP(audioPort, audioRtcpPort, videoPorts, rtpCapabilities) {
//   const audioCodec = rtpCapabilities.codecs.find(c => c.kind === 'audio' && c.mimeType.toLowerCase().includes('opus'));
//   const videoCodec = rtpCapabilities.codecs.find(c => c.kind === 'video' && c.mimeType.toLowerCase().includes('vp8') || c.mimeType.toLowerCase().includes('vp9'));

//   if (!audioCodec || !videoCodec) {
//     throw new Error('Required codecs not supported');
//   }

//   const videoLines = videoPorts.map((ports, i) => `
// m=video ${ports.rtpPort} RTP/AVP ${videoCodec.preferredPayloadType}
// a=recvonly
// a=rtpmap:${videoCodec.preferredPayloadType} ${videoCodec.mimeType.split('/')[1].toUpperCase()}/90000
// a=rtcp:${ports.rtcpPort}
// a=mid:video${i}
// `.trim()).join('\r\n');

//   return [
//     'v=0',
//     'o=- 0 0 IN IP4 127.0.0.1',
//     's=Mediasoup Multi-Participant Recording',
//     'c=IN IP4 127.0.0.1',
//     't=0 0',
//     '',
//     `m=audio ${audioPort} RTP/AVP ${audioCodec.preferredPayloadType}`,
//     'a=recvonly',
//     `a=rtpmap:${audioCodec.preferredPayloadType} opus/48000/2`,
//     `a=rtcp:${audioRtcpPort}`,
//     'a=mid:audio',
//     '',
//     ...videoLines.split('\n').filter(Boolean)
//   ].join('\r\n') + '\r\n';
// }


//   _setupFFmpegEvents(recording) {
//     recording.ffmpeg.on('started', () => {
//       this.logger.log(`[Recording] FFmpeg started (PID: ${recording.ffmpeg.child?.pid})`);
//     });
    
//     recording.ffmpeg.on('error', (err) => {
//       this.logger.error('[Recording] FFmpeg error:', err);
//       recording.status = 'error';
//     });
    
//    recording.ffmpeg.on('close', ({ code, signal }) => {
//         this.logger.log(`[Recording] FFmpeg closed | code: ${code} | signal: ${signal || 'none'}`);
//         recording.status = (code === 0 || code === null) ? 'finished' : 'error';
//       });
//   }






//   /**
//    *addProducerToRecording -  create consumer for the producer and add to recording
//     consumer = tranport.consume
//    * @params {object} recording
//    * @params {object} producer: this is mediasoup producer
//    */
//   // async addProducerToRecording(recording, producer, room) {
//   //   if (!this.activeRecordings.has(recording.roomId)) return;
//   //   if (producer.closed) return;

//   //   const kind = producer.kind;
//   //   const transport = kind === 'audio' ? recording.audioTransport : recording.videoTransport;
//   //   const consumersMap = kind === 'audio' ? recording.audioConsumers : recording.videoConsumers;

//   //   // Check if already consuming
//   //   if (consumersMap.has(producer.id)) {
//   //     this.logger.log(`[Recording] Already consuming ${kind} producer ${producer.id}`);
//   //     return;
//   //   }

//   //   try {
//   //     this.logger.log(`[Recording] Creating consumer for ${kind} producer ${producer.id} (${producer.appData.userName || 'unknown'})`);

//   //     const consumer = await transport.consume({
//   //       producerId: producer.id,
//   //       rtpCapabilities: room.router.rtpCapabilities,
//   //       paused: false
//   //     });

//   //     await consumer.resume();
//   //     consumersMap.set(producer.id, consumer);

//   //     // Request keyframe for video to ensure proper recording start
//   //     if (kind === 'video') {
//   //       setTimeout(async () => {
//   //         try {
//   //           await consumer.requestKeyFrame();
//   //           this.logger.log(`[Recording] Requested keyframe for video consumer ${consumer.id}`);
//   //         } catch (err) {
//   //           this.logger.warn(`[Recording] Could not request keyframe: ${err.message}`);
//   //         }
//   //       }, 500);
//   //     }

//   //     // Setup cleanup handlers
//   //     const cleanup = () => {
//   //       if (!consumer.closed) {
//   //         consumer.close();
//   //       }
//   //       consumersMap.delete(producer.id);
//   //       this.logger.log(`[Recording] Cleaned up ${kind} consumer for producer ${producer.id}`);
//   //     };

//   //     const producerCloseHandler = () => {
//   //       this.logger.log(`[Recording] Producer ${producer.id} closed`);
        
//   //       cleanup();
//   //        if (producer.appData?.isScreen) {
//   //         this.handleScreenShareStop(recording.roomId);
//   //       }

//   //       // Remove producer close listeners
//   //       try {
//   //         for (const [producerId, handler] of recording._producerCloseListeners.entries()) {
//   //           // attempt to find the producer object in the room (best-effort)
//   //           for (const [, peer] of room.peers) {
//   //             const prod = peer.producers.get(producerId);
//   //             if (prod) {
//   //               try { prod.removeListener('close', handler); } catch (e) {}
//   //               break;
//   //             }
//   //           }
//   //         }
//   //       } catch (err) {
//   //         this.logger.warn('[Recording] Error removing producer listeners:', err.message);
//   //       }

        
//   //       // If screen producer closed, handle screen share stop
       
//   //     };

//   //     producer.on('close', producerCloseHandler);
//   //     consumer.on('producerclose', cleanup);
//   //     consumer.on('transportclose', cleanup);

//   //     // Store cleanup listener reference
//   //     recording._producerCloseListeners.set(producer.id, producerCloseHandler);

//   //     this.logger.log(`[Recording] ✓ Now consuming ${kind} from ${producer.appData.userName || 'user'} (isScreen: ${producer.appData?.isScreen || false})`);
//   //   } catch (err) {
//   //     this.logger.error(`[Recording] Failed to consume ${kind} producer ${producer.id}:`, err.message);
//   //     throw err;
//   //   }
//   // }

// async addProducerToRecording(recording, producer, room) {
//   if (producer.closed) return;

//   const kind = producer.kind;

//   if (kind === 'audio') {
//     // Keep single audio transport
//     if (recording.audioConsumers.has(producer.id)) return;
//     const transport = recording.audioTransport;
//     // ... existing audio code
//   }

//   if (kind === 'video') {
//     // ONE TRANSPORT PER VIDEO PRODUCER
//     if (recording.videoConsumers.has(producer.id)) return;

//     const ports = await this.portManager.allocatePair('recording-video', recording.roomId);
//     const transport = await room.router.createPlainTransport({
//       listenIp: '127.0.0.1',
//       rtcpMux: false,
//       comedia: false,
//     });

//     await transport.connect({ ip: '127.0.0.1', port: ports.rtpPort, rtcpPort: ports.rtcpPort });

//     const consumer = await transport.consume({
//       producerId: producer.id,
//       rtpCapabilities: room.router.rtpCapabilities,
//       paused: false
//     });

//     await consumer.resume();

//     recording.videoConsumers.set(producer.id, {
//       consumer,
//       transport,
//       ports,
//       producer
//     });

//     // Regenerate SDP with new video input and restart FFmpeg
//     await this._restartFFmpegWithNewLayout(recording);
//   }
// }


// async _restartFFmpegWithNewLayout(recording) {
//   // Kill old FFmpeg
//   if (recording.ffmpeg && recording.ffmpeg.child) {
//     await recording.ffmpeg.stop(5000);
//   }

//   // Collect all current video inputs
//   const videoInputs = Array.from(recording.videoConsumers.values());
//   const videoPorts = videoInputs.map(v => v.ports);

//   const sdp = this._generateSDP(
//     recording.audioTransport.tuple.localPort,
//     recording.audioTransport.rtcpTuple?.localPort || recording.audioTransport.tuple.localPort + 1,
//     videoPorts,
//     recording.room.router.rtpCapabilities
//   );

//   const ffmpeg = new FFmpeg({ combined: sdp }, recording.baseFilename, {
//     recordingsDir: this.recordingsDir,
//     ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
//     debug: this.debug,
//   });

//   // Build dynamic filter_complex for grid
//   const layout = this._buildVideoGridFilter(videoInputs.length);
//   ffmpeg.customFilterComplex = layout;

//   recording.ffmpeg = ffmpeg;
//   await ffmpeg._spawnFFmpeg();
//   await once(ffmpeg, 'started');
// }


// _buildVideoGridFilter(count) {
//   if (count === 0) return '[0:v]null[vout]';
//   if (count === 1) return '[0:v]scale=1280:720[vout]';

//   const cols = Math.ceil(Math.sqrt(count));
//   const rows = Math.ceil(count / cols);
//   const w = 1280 / cols;
//   const h = 720 / rows;

//   let filter = '';
//   for (let i = 0; i < count; i++) {
//     filter += `[${i}:v]setpts=PTS-STARTPTS,scale=${w}:${h}[v${i}];`;
//   }
//   for (let i = 0; i < count; i++) {
//     const x = (i % cols) * w;
//     const y = Math.floor(i / cols) * h;
//     filter += `[v${i}]pad=${1280}:${720}:${x}:${y}:#1c1c1c[v${i}p];`;
//   }
//   filter += Array.from({ length: count }, (_, i) => `[v${i}p]`).join('');
//   filter += `concat=n=${count}:v=1:a=0[vout]`;

//   return filter;
// }

//   async pauseRecording(roomId) {
//     const recording = this.activeRecordings.get(roomId);
//     if (!recording) throw new Error('No active recording');
//     if (recording.status !== 'recording') throw new Error('Recording not in recording state');

//     this.logger.log(`[Recording] Pausing ${recording.recordingId}`);

//     // Pause all consumers
//     const allConsumers = [
//       ...recording.audioConsumers.values(),
//       ...recording.videoConsumers.values()
//     ];

//     for (const consumer of allConsumers) {
//       if (!consumer.closed) {
//         await consumer.pause();
//       }
//     }

//     recording.status = 'paused';
//     recording.pauseTime = Date.now();

//     return { 
//       recordingId: recording.recordingId, 
//       roomId: recording.roomId,
//       status: 'paused' 
//     };
//   }

//   async resumeRecording(roomId) {
//     const recording = this.activeRecordings.get(roomId);
//     if (!recording) throw new Error('No active recording');
//     if (recording.status !== 'paused') throw new Error('Recording not paused');

//     this.logger.log(`[Recording] Resuming ${recording.recordingId}`);

//     // Resume all consumers
//     const allConsumers = [
//       ...recording.audioConsumers.values(),
//       ...recording.videoConsumers.values()
//     ];

//     for (const consumer of allConsumers) {
//       if (!consumer.closed) {
//         await consumer.resume();
//       }
//     }

//     recording.status = 'recording';
    
//     // Request keyframes for smooth resume
//     for (const consumer of recording.videoConsumers.values()) {
//       try {
//         await consumer.requestKeyFrame();
//       } catch (err) {
//         // Ignore errors
//       }
//     }

//     return { 
//       recordingId: recording.recordingId,
//       roomId: recording.roomId, 
//       status: 'recording' 
//     };
//   }










//   async stopRecording(roomId) {
//     const recording = this.activeRecordings.get(roomId);
//     if (!recording) throw new Error('No active recording for this room');

//     this.logger.log(`[Recording] Stopping ${recording.recordingId}`);
//     recording.status = 'stopping';

//     try {
//       // Stop FFmpeg gracefully
//       if (recording.ffmpeg && recording.ffmpeg.child && !recording.ffmpeg.child.killed) {
//         this.logger.log(`[Recording] Stopping FFmpeg process...`);
//         await recording.ffmpeg.stop(20000);
//       }
//     } catch (err) {
//       this.logger.warn(`[Recording] Error stopping FFmpeg:`, err.message);
//     }

//     // Close all consumers
//     const allConsumers = [
//       ...recording.audioConsumers.values(),
//       ...recording.videoConsumers.values()
//     ];

//     for (const consumer of allConsumers) {
//       try {
//         if (!consumer.closed) {
//           consumer.close();
//         }
//       } catch (err) {
//         this.logger.warn(`[Recording] Error closing consumer:`, err.message);
//       }
//     }

//     recording.audioConsumers.clear();
//     recording.videoConsumers.clear();

//     // Close transports
//     try {
//       if (!recording.audioTransport.closed) {
//         recording.audioTransport.close();
//       }
//     } catch (err) {
//       this.logger.warn(`[Recording] Error closing audio transport:`, err.message);
//     }

//     try {
//       if (!recording.videoTransport.closed) {
//         recording.videoTransport.close();
//       }
//     } catch (err) {
//       this.logger.warn(`[Recording] Error closing video transport:`, err.message);
//     }

//     // Free ports
//     const ports = Object.values(recording.ports || {});
//     await Promise.all(
//       ports.map(p => this.portManager.free(p).catch(err => 
//         this.logger.warn(`[Recording] Error freeing port ${p}:`, err.message)
//       ))
//     );

//     // Remove event listeners
//     if (recording._newProducerListener) {
//       const room = this.rooms.get(roomId);
//       if (room?.router) {
//         room.router.removeListener('newproducer', recording._newProducerListener);
//       }
//     }

//     // Remove from active recordings
//     this.activeRecordings.delete(roomId);

//     // Get file stats
//     let fileExists = false;
//     let fileSize = 0;
//     try {
//       if (fs.existsSync(recording.filePath)) {
//         fileExists = true;
//         fileSize = fs.statSync(recording.filePath).size;
//       }
//     } catch (err) {
//       this.logger.warn(`[Recording] Error checking file:`, err.message);
//     }

//     const duration = Math.floor((Date.now() - recording.startTime) / 1000);

//     this.logger.log(`[Recording] ✓ Stopped ${recording.recordingId} — ${duration}s, ${fileSize} bytes, exists: ${fileExists}`);

//     return {
//       recordingId: recording.recordingId,
//       roomId: recording.roomId,
//       fileName: recording.fileName,
//       filePath: recording.filePath,
//       duration,
//       fileSize,
//       fileExists
//     };
//   }
// //uyVENZ8jyjaANDZhq965Jlicghkghuhuk-1763600409649
//   getRecording(recordingId) {
  
//     for (const r of this.activeRecordings.values()) {
     
//       if (r.recordingId === recordingId) {
//         return {
//           recordingId: r.recordingId,
//           roomId: r.roomId,
//           userId: r.userId,
//           userName: r.userName,
//           fileName: r.fileName,
//           filePath: r.filePath,
//           status: r.status,
//           startTime: r.startTime,
//           isScreenSharing: r.isScreenSharing,
//           activeConsumers: {
//             audio: r.audioConsumers.size,
//             video: r.videoConsumers.size
//           }
//         };
//       }
//     }
//     return null;
//   }

//   getAllRecordings() {
//     return Array.from(this.activeRecordings.values()).map(r => ({
//       recordingId: r.recordingId,
//       roomId: r.roomId,
//       status: r.status,
//       startTime: r.startTime,
//       isScreenSharing: r.isScreenSharing
//     }));
//   }
// }

// module.exports = { RecordingManager2 };






// recordingManager2.js - FINAL WORKING MULTI-PARTICIPANT RECORDING (Nov 2025)

const { FFmpeg } = require('./ffmpeg');
const path = require('path');
const fs = require('fs');
const { once } = require('events');

class RecordingManager2 {
  constructor(opts = {}, rooms, redisClient) {
    this.rooms = rooms;
    this.redis = redisClient;
    this.recordingsDir = opts.recordingsDir || './recordings_meeting';
    this.portManager = opts.portManager;
    this.logger = opts.logger || console;
    this.debug = !!opts.debug;

    if (!this.portManager) throw new Error('portManager required');

    this.activeRecordings = new Map();
    this._ensureRecordingsDir();
  }

  _ensureRecordingsDir() {
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }
  }

  // ONE SDP WITH MANY m=video LINES (one per participant)
  _generateMultiVideoSDP(audioPorts, videoPortList, rtpCapabilities) {
    const audioCodec = rtpCapabilities.codecs.find(c => c.kind === 'audio' && c.mimeType.toLowerCase().includes('opus'));
    const videoCodec = rtpCapabilities.codecs.find(c => c.kind === 'video' && (c.mimeType.toLowerCase().includes('vp8') || c.mimeType.toLowerCase().includes('vp9')));

    if (!audioCodec || !videoCodec) throw new Error('Missing required codecs');

    let sdp = `v=0
o=- 0 0 IN IP4 127.0.0.1
s=Mediasoup Recording
c=IN IP4 127.0.0.1
t=0 0
m=audio ${audioPorts.rtpPort} RTP/AVP ${audioCodec.preferredPayloadType}
a=rtpmap:${audioCodec.preferredPayloadType} opus/48000/2
a=rtcp:${audioPorts.rtcpPort}
a=recvonly
a=mid:audio
`;

    videoPortList.forEach((ports, idx) => {
      sdp += `m=video ${ports.rtpPort} RTP/AVP ${videoCodec.preferredPayloadType}
a=rtpmap:${videoCodec.preferredPayloadType} ${videoCodec.mimeType.split('/')[1].toUpperCase()}/90000
a=rtcp:${ports.rtcpPort}
a=recvonly
a=mid:video${idx}
`;
    });

    return sdp.trim();
  }

  // Dynamic grid or screen-share layout
  _buildFilterComplex(videoCount, isScreenSharing = false) {
    if (isScreenSharing && videoCount > 0) {
      // Show only screen (input 0 = first video = screen)
      return '[0:v]setpts=PTS-STARTPTS,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black[vout]';
    }

    if (videoCount === 0) return '[0:v]nullsrc=size=1280x720[vout]';

    const cols = Math.ceil(Math.sqrt(videoCount));
    const cellW = 1280 / cols;
    const cellH = 720 / Math.ceil(videoCount / cols);

    let filter = '';
    for (let i = 0; i < videoCount; i++) {
      filter += `[${i}:v]setpts=PTS-STARTPTS,scale=${cellW}:${cellH}:force_original_aspect_ratio=decrease,pad=${cellW}:${cellH}:(ow-iw)/2:(oh-ih)/2:black[v${i}];`;
    }
    for (let i = 0; i < videoCount; i++) {
      const x = (i % cols) * cellW;
      const y = Math.floor(i / cols) * cellH;
      filter += `[v${i}]pad=1280:720:${x}:${y}:black[v${i}p];`;
    }
    filter += Array.from({ length: videoCount }, (_, i) => `[v${i}p]`).join('');
    filter += `concat=n=${videoCount}:v=1:a=0[vout]`;

    return filter;
  }

  async startRecording(roomId, userId, userName, { quality = 'medium', producers }) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (this.activeRecordings.has(roomId)) throw new Error('Recording already in progress');

    const timestamp = Date.now();
    const recordingId = `${roomId}-${timestamp}`;
    const baseFilename = `rec-${roomId}-${timestamp}`;
    const filePath = path.join(this.recordingsDir, `${baseFilename}.webm`);

    this.logger.log(`[Recording] Starting ${recordingId}`);

    // One audio transport for all audio
    const audioPorts = await this.portManager.allocatePair('recording-audio', roomId);
    const audioTransport = await room.router.createPlainTransport({ listenIp: '127.0.0.1', rtcpMux: false, comedia: false });
    await audioTransport.connect({ ip: '127.0.0.1', port: audioPorts.rtpPort, rtcpPort: audioPorts.rtcpPort });

    const recording = {
      recordingId, roomId, userId, userName, quality,
      fileName: `${baseFilename}.webm`, filePath, startTime: Date.now(),
      audioTransport,
      audioConsumers: new Map(),
      videoTransports: new Map(),    // ← key = producer.id, value = {transport, ports, consumer}
      ffmpeg: null,
      status: 'recording',
      isScreenSharing: false,
      audioPorts
    };

    this.activeRecordings.set(roomId, recording);

    // Initial consume of all current producers
    await this._consumeInitialProducers(recording, producers, room);

    // Start FFmpeg with current layout
    await this._restartFFmpeg(recording, room);

    // Listen for new producers
    const handleNewProducer = (producer) => this._handleNewProducer(roomId, producer, room);
    room.router.on('newproducer', handleNewProducer);
    recording._newProducerListener = handleNewProducer;

    return { recordingId, fileName: recording.fileName };
  }

  async _consumeInitialProducers(recording, producers, room) {
    // Audio
    for (const a of [...producers.cameras.audio, ...(producers.screen.audio ? [producers.screen.audio] : [])]) {
      if (!recording.audioConsumers.has(a.producer.id)) {
        const consumer = await recording.audioTransport.consume({
          producerId: a.producer.id,
          rtpCapabilities: room.router.rtpCapabilities
        });
        recording.audioConsumers.set(a.producer.id, consumer);
      }
    }

    // Video - either screen or all cameras
    const videoProducers = producers.screen.video ? [producers.screen.video] : producers.cameras.video;

    for (const v of videoProducers) {
      await this._addVideoProducer(recording, v.producer, room);
    }

    if (producers.screen.video) recording.isScreenSharing = true;
  }

  async _addVideoProducer(recording, producer, room) {
    if (recording.videoTransports.has(producer.id)) return;

    const ports = await this.portManager.allocatePair('recording-video', recording.roomId);
    const transport = await room.router.createPlainTransport({ listenIp: '127.0.0.1', rtcpMux: false, comedia: false });
    await transport.connect({ ip: '127.0.0.1', port: ports.rtpPort, rtcpPort: ports.rtcpPort });

    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities: room.router.rtpCapabilities
    });

    recording.videoTransports.set(producer.id, { transport, ports, consumer });
    await this._restartFFmpeg(recording, room);
  }

  async _handleNewProducer(roomId, producer, room) {
    const recording = this.activeRecordings.get(roomId);
    if (!recording || recording.status !== 'recording') return;

    if (producer.kind === 'audio') {
      if (!recording.audioConsumers.has(producer.id)) {
        const consumer = await recording.audioTransport.consume({
          producerId: producer.id,
          rtpCapabilities: room.router.rtpCapabilities
        });
        recording.audioConsumers.set(producer.id, consumer);
      }
    }

    if (producer.kind === 'video') {
      if (producer.appData?.isScreen) {
        // Stop all camera videos, show only screen
        for (const [id, data] of recording.videoTransports) {
          if (!producer.appData?.isScreen) {
            data.consumer.close();
            data.transport.close();
            await this.portManager.free(data.ports.rtpPort);
            await this.portManager.free(data.ports.rtcpPort);
          }
        }
        recording.videoTransports.clear();
        recording.isScreenSharing = true;
      }

      if (!recording.videoTransports.has(producer.id)) {
        await this._addVideoProducer(recording, producer, room);
      }
    }
  }

  async _restartFFmpeg(recording, room) {
    if (recording.ffmpeg?.child) await recording.ffmpeg.stop(5000);

    const videoList = Array.from(recording.videoTransports.values());
    const sdp = this._generateMultiVideoSDP(
      recording.audioPorts,
      videoList.map(v => v.ports),
      room.router.rtpCapabilities
    );

    const ffmpeg = new FFmpeg({ combined: sdp }, recording.fileName.replace('.webm', ''), {
      recordingsDir: this.recordingsDir,
      debug: this.debug
    });

    ffmpeg.customFilterComplex = this._buildFilterComplex(videoList.length, recording.isScreenSharing);
    recording.ffmpeg = ffmpeg;

    await ffmpeg._spawnFFmpeg();
    await once(ffmpeg, 'started');
  }

  async stopRecording(roomId) {
    const recording = this.activeRecordings.get(roomId);
    if (!recording) return { error: 'No recording' };

    this.logger.log(`[Recording] Stopping ${recording.recordingId}`);

    if (recording.ffmpeg) await recording.ffmpeg.stop(20000);

    // Close everything
    for (const c of recording.audioConsumers.values()) c.close();
    for (const v of recording.videoTransports.values()) {
      v.consumer.close();
      v.transport.close();
      await this.portManager.free(v.ports.rtpPort);
      await this.portManager.free(v.ports.rtcpPort);
    }
    recording.audioTransport.close();
    await this.portManager.free(recording.audioPorts.rtpPort);
    await this.portManager.free(recording.audioPorts.rtcpPort);

    if (recording._newProducerListener) {
      const room = this.rooms.get(roomId);
      room?.router?.removeListener('newproducer', recording._newProducerListener);
    }

    this.activeRecordings.delete(roomId);

    const stats = fs.statSync(recording.filePath);
    return {
      recordingId: recording.recordingId,
      fileName: recording.fileName,
      duration: Math.floor((Date.now() - recording.startTime) / 1000),
      fileSize: stats.size
    };
  }


  getRecording(recordingId) {
  
    for (const r of this.activeRecordings.values()) {
     
      if (r.recordingId === recordingId) {
        return {
          recordingId: r.recordingId,
          roomId: r.roomId,
          userId: r.userId,
          userName: r.userName,
          fileName: r.fileName,
          filePath: r.filePath,
          status: r.status,
          startTime: r.startTime,
          isScreenSharing: r.isScreenSharing,
          activeConsumers: {
            audio: r.audioConsumers.size,
            video: r.videoConsumers.size
          }
        };
      }
    }
    return null;
  }
  // pauseRecording / resumeRecording / getRecording stay the same or just pause/resume consumers
}

//module.exports = { RecordingManager2 };





