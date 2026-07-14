const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BWW VC API',
      version: '1.0.0',
      description: 'API documentation for BWW VC backend, including Socket.IO operations under /conf_meeting namespace',
    },
    servers: [
      { url: 'http://localhost:5000' },
      { url: 'http://localhost:8090' },
      { url: 'https://meet.bornwithwealth.com' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      {
        name: 'Socket.IO',
        description: 'Mediasoup Socket.IO operations under /conf_meeting namespace',
      },
    ],
    paths: {
      '/conf_meeting/socket/join': {
        post: {
          summary: 'Join a mediasoup room via socket.io',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roomId: { type: 'string' },
                    userId: { type: 'string' },
                    userName: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Successfully joined the room',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      rtpCapabilities: { type: 'object' },
                      isHost: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/create-transport': {
        post: {
          summary: 'Create WebRTC transport',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    direction: { type: 'string', enum: ['send', 'recv'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Transport created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      transportParams: { type: 'object' },
                      direction: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/connect-transport': {
        post: {
          summary: 'Connect transport with DTLS parameters',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    transportId: { type: 'string' },
                    dtlsParameters: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Transport connected',
            },
          },
        },
      },
      '/conf_meeting/socket/transport-produce': {
        post: {
          summary: 'Produce media stream (audio/video)',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    transportId: { type: 'string' },
                    kind: { type: 'string', enum: ['audio', 'video'] },
                    rtpParameters: { type: 'object' },
                    appData: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Media stream produced',
            },
          },
        },
      },
      '/conf_meeting/socket/consume': {
        post: {
          summary: 'Consume media stream',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    transportId: { type: 'string' },
                    producerId: { type: 'string' },
                    rtpCapabilities: { type: 'object' },
                    appData: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Media stream consumed',
            },
          },
        },
      },
      '/conf_meeting/socket/leave': {
        post: {
          summary: 'Leave room',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roomId: { type: 'string' },
                    userId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Left room successfully',
            },
          },
        },
      },
      '/conf_meeting/socket/resume-consume': {
        post: {
          summary: 'Resume a paused consumer',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    consumerId: { type: 'string' },
                    userId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Consumer resumed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      consumerId: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Missing roomId or userId',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Error resuming consumer',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/mute-all': {
        post: {
          summary: 'Mute or unmute all participants in a room',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roomId: { type: 'string' },
                    userId: { type: 'string' },
                    mute: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Mute/unmute command sent to all participants',
            },
          },
        },
      },
      '/conf_meeting/socket/raise-hand': {
        post: {
          summary: 'Raise or lower hand in a room',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    handup: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Hand raise/lower event sent to room',
            },
          },
        },
      },
      '/conf_meeting/socket/stop-my-consumer-for-screen-share': {
        post: {
          summary: 'Stop consumer for screen sharing',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Screen share consumer stopped',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Missing roomId or userId',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Error stopping screen share consumer',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/stop-screen-share': {
        post: {
          summary: 'Stop screen sharing',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    screenProducerIds: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Screen sharing stopped',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Error stopping screen sharing',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/disconnect': {
        post: {
          summary: 'Handle socket disconnection',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User disconnected and cleanup performed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Error during disconnect cleanup',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/send-message': {
        post: {
          summary: 'Send a chat message in a room',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roomId: { type: 'string' },
                    message: { type: 'string' },
                    time: { type: 'string' },
                    userName: { type: 'string' },
                    socketId: { type: 'string' },
                    messageId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Message sent to room',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      roomId: { type: 'string' },
                      message: { type: 'string' },
                      time: { type: 'string' },
                      userName: { type: 'string' },
                      socketId: { type: 'string' },
                      messageId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/edit-message': {
        post: {
          summary: 'Edit a chat message in a room',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roomId: { type: 'string' },
                    messageId: { type: 'string' },
                    newMessage: { type: 'string' },
                    socketId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Message edited in room',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      roomId: { type: 'string' },
                      messageId: { type: 'string' },
                      newMessage: { type: 'string' },
                      socketId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/delete-message': {
        post: {
          summary: 'Delete a chat message in a room',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roomId: { type: 'string' },
                    messageId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Message deleted in room',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      roomId: { type: 'string' },
                      messageId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/conf_meeting/socket/save-rtp-capabilities': {
        post: {
          summary: 'Save peer RTP capabilities',
          tags: ['Socket.IO'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    rtpCapabilities: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'RTP capabilities saved successfully',
            },
            '500': {
              description: 'Error saving RTP capabilities',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/**/*.js'),
    path.join(__dirname, '../controllers/**/*.js'),
  
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;