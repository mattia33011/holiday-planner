FROM oven/bun:1 AS builder

WORKDIR /app

COPY . /app/

RUN bun install

RUN bun run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runner

USER nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --chown=nginx:nginx --from=builder /app/dist/holiday-planner/browser /usr/share/nginx/html

EXPOSE 8080

ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]
CMD ["-g", "daemon off;"]