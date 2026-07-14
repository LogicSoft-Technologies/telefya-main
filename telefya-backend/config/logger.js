const winston = require('winston');
const morgan = require('morgan');


// Define log levels and colors (same as before)
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
  }
};

// Create a Winston logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  transports: [
    // Console transport for development (output to console)
    new winston.transports.Console({
      level: 'debug', // Log level (all logs from 'debug' and above)
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File transport for production (output to file)
    new winston.transports.File({
      filename: 'logs/combined.log', // Log file location
      level: 'info', // Logs of info level and above will be saved to the file
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // Structured log format (JSON)
      )
    }),

    // File transport for error logs (output only error-level logs)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Optional: add color coding to logs
winston.addColors(logLevels.colors);

// Export the logger for use in other parts of the app
module.exports = { logger, morgan };
