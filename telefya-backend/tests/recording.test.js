// ...existing code...
const RecordingModule = require('../recordingManager2');

const RecordingManager2 = RecordingModule?.RecordingManager2 || RecordingModule;

describe('RecordingManager2 basic behavior', () => {
  it('constructs and generates SDP for audio and video rtpParameters', () => {
    const mgr = new RecordingManager2(new Map(), null, {
      recordingsDir: './recordings_meeting_test',
      portManager: { allocate: async () => 50000, free: async () => {} },
    });

    const rtpObj = {
      audio: {
        rtpParameters: {
          codecs: [
            { payloadType: 111, mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
          ],
          headerExtensions: [],
        },
        remoteRtpPort: 50000,
      },
      video: {
        rtpParameters: {
          codecs: [
            { payloadType: 96, mimeType: 'video/VP8', clockRate: 90000 },
          ],
          headerExtensions: [],
        },
        remoteRtpPort: 5006,
      },
    };

    const sdp = mgr.generateSDP(rtpObj);

    expect(sdp).toBeDefined();
    // generateSDP implementation may return an object with audio/video SDP strings
    // or a composed string; handle both shapes.
    if (typeof sdp === 'string') {
      expect(sdp).toMatch(/m=audio/);
      expect(sdp).toMatch(/m=video/);
    } else {
      expect(sdp.audio).toBeDefined();
      expect(sdp.audio).toMatch(/m=audio/);
      expect(sdp.video).toBeDefined();
      expect(sdp.video).toMatch(/m=video/);
    }
  });
});
