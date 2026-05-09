module.exports = {
  apps: [{
    name: process.env.BACKEND_PROCESS || 'disnaker-backend',
    script: './src/server.js',
    cwd: process.env.BACKEND_CWD || __dirname,
    node_args: '--max-old-space-size=512',
    max_memory_restart: '500M',
    wait_ready: true,
    listen_timeout: 15000,
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5030,
    },
  }],
};
