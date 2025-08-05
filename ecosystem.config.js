module.exports = {
  apps: [{
    name: 'notes-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 监控配置
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.next'],
    
    // 内存和重启配置
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    
    // 其他配置
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
}
