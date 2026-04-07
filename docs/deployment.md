# Deployment

## Docker

### Recommended Dockerfile

```dockerfile
FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY . .
RUN npm ci --omit=dev
CMD ["node", "dist/main.js"]
```

### Launch Options for Containers

```ts
PuppeteerModule.forRoot({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--single-process',
  ],
})
```

### Memory Considerations

Each Chrome tab uses ~50-100MB RAM. For production:

```ts
PuppeteerModule.forRoot({
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--js-flags=--max-old-space-size=256',
  ],
})
```

Mount `/dev/shm` as tmpfs with sufficient size, or use `--disable-dev-shm-usage` to write to `/tmp` instead.

## Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          volumeMounts:
            - name: dshm
              mountPath: /dev/shm
      volumes:
        - name: dshm
          emptyDir:
            medium: Memory
            sizeLimit: 1Gi
```

## Serverless

For AWS Lambda or similar, use `puppeteer-core` with a Chrome layer:

```ts
PuppeteerModule.forRootAsync({
  useFactory: () => ({
    launchOptions: {
      executablePath: '/opt/chrome/chrome',
      headless: true,
      args: ['--no-sandbox', '--single-process'],
    },
  }),
})
```

## Environment Variables

Common configuration pattern:

```ts
PuppeteerModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    launchOptions: {
      headless: config.get('PUPPETEER_HEADLESS', true),
      executablePath: config.get('CHROME_PATH'),
      args: config.get<string>('PUPPETEER_ARGS', '')
        .split(',')
        .filter(Boolean),
    },
  }),
  inject: [ConfigService],
})
```

```env
PUPPETEER_HEADLESS=true
CHROME_PATH=/usr/bin/chromium
PUPPETEER_ARGS=--no-sandbox,--disable-dev-shm-usage,--disable-gpu
```

## Graceful Shutdown

The module implements `OnApplicationShutdown` and `OnModuleDestroy`. The browser is closed automatically when:
- `app.close()` is called
- The process receives `SIGTERM` (with `enableShutdownHooks()`)

```ts
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
await app.listen(3000);
```
