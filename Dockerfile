FROM oven/bun:1
WORKDIR /app
COPY index.mjs ./index.mjs
ENV PORT=3000
EXPOSE 3000
USER bun
CMD ["bun", "run", "index.mjs"]
