module.exports = {
  apps: [{
    name: 'app-api-runner',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '500M',
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    merge_logs: true,
    time: true
  }]
}