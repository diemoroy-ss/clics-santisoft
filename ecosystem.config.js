module.exports = {
  apps: [
    {
      name:        'clics',
      cwd:         '/var/www/clics',                 // Ajustar al path real en AWS
      script:      'node_modules/.bin/next',
      args:        'start -p 3008',
      instances:   1,
      autorestart: true,
      watch:       false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT:     3008,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
