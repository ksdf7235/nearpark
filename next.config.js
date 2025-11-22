/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 개발 환경에서 Cross origin request 경고 해결
  // Chrome DevTools 등에서 127.0.0.1로 접근할 때 발생하는 경고 방지
  allowedDevOrigins: ["127.0.0.1", "localhost"],
}

module.exports = nextConfig

