# Hướng Dẫn Tự Động Hóa CD: GitHub Actions → Docker Hub → Local Docker Engine

Để hoàn thành yêu cầu: **"Tự động hóa quá trình CD: GitHub Actions → Docker Hub → Local Docker Engine"**, có 2 giải pháp tối ưu nhất:

---

## Cách 1 (Khuyên dùng - Zero Config): Sử dụng Watchtower (Tự Động 100%)

Trong file `docker-compose-prod.yaml` đã tích hợp sẵn container **Watchtower**:
```yaml
watchtower:
  image: containrrr/watchtower:latest
  container_name: watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  command: --interval 30 --cleanup product-api
```

### Cách hoạt động:
1. Khi bạn push code lên GitHub, GitHub Actions tự động chạy CI (test CRUD + healthcheck MongoDB).
2. Khi CI pass, GitHub Actions tự động build Docker image và push lên Docker Hub với tag `latest`.
3. Trên máy local của bạn, khi bạn đã bật:
   ```bash
   docker compose -f docker-compose-prod.yaml up -d
   ```
4. **Watchtower** sẽ tự động quét Docker Hub mỗi 30 giây. Ngay khi phát hiện image mới được push lên Docker Hub, nó sẽ tự động `pull` image mới về và restart lại `product-api` trên Local Docker Engine hoàn toàn tự động mà bạn không cần phải gõ lệnh lại!

---

## Cách 2: Sử dụng GitHub Actions Self-Hosted Runner (Native GitHub)

Nếu bạn muốn chính GitHub Actions gửi lệnh xuống máy Local để pull và restart:

### Bước 1: Thêm Runner trên GitHub Repository
1. Mở GitHub Repository `product-api` của bạn.
2. Vào **Settings** → **Actions** → **Runners** → Chọn **New self-hosted runner**.
3. Chọn OS: **Windows** (hoặc Linux).
4. GitHub sẽ hiện các dòng lệnh PowerShell tải file zip runner về máy.

### Bước 2: Chạy Runner trên máy Local
Mở PowerShell (Run as Administrator) và chạy các lệnh GitHub cung cấp:
```powershell
# Tạo thư mục runner
mkdir actions-runner; cd actions-runner

# Cấu hình runner kết nối với repo của bạn
./config.cmd --url https://github.com/<YOUR_USERNAME>/product-api --token <YOUR_TOKEN>

# Khởi động runner
./run.cmd
```

### Bước 3: Hoạt động tự động
Trong file `.github/workflows/cd-dockerhub-deploy.yml`, job `deploy-local-runner` có:
```yaml
runs-on: self-hosted
steps:
  - name: Pull Latest Image and Restart Local Containers
    run: |
      docker compose -f docker-compose-prod.yaml pull
      docker compose -f docker-compose-prod.yaml up -d --remove-orphans
```
Mỗi khi push code lên `main`, GitHub Actions sẽ tự động kích hoạt Runner trên máy bạn để pull và chạy container mới nhất!

---

## Cách 3: Chạy script kích hoạt thủ công nhanh bằng 1 click
Nếu chưa muốn bật Watchtower hay Runner:
- **Windows PowerShell**:
  ```powershell
  .\scripts\deploy-local.ps1
  ```
- **Git Bash**:
  ```bash
  ./scripts/deploy-local.sh
  ```
