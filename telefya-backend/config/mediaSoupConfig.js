const listenIp = process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0";
const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1";

const mediaSoupConfig = {
  mediasoup: {
    worker: {
      logLevel: "warn",
      logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp", "rtx"],
      rtcMinPort: 10000,
      rtcMaxPort: 10999,
      dtlsCertificateFile: process.env.DTLS_CERT_FILE,
      dtlsPrivateKeyFile: process.env.DTLS_KEY_FILE,
      appData: {},
    },

    router: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/H264",
          clockRate: 90000,
          parameters: {
            "packetization-mode": 1,
            "profile-level-id": "42e01f",
            "level-asymmetry-allowed": 1,
            "x-google-start-bitrate": 1000,
          },
        },
      ],
    },

    webRtcTransport: {
      listenIps: [
        {
          ip: listenIp,
          announcedIp,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
    },
  },
};

module.exports = { config: mediaSoupConfig };