# PRODUCT-API: HỆ THỐNG MICROSERVICE CRUD VỚI DOCKER & CI/CD

Dự án **Product API** được xây dựng bằng **Node.js (Express) + MongoDB (Mongoose)**, hỗ trợ đầy đủ quy trình Docker hóa, kiểm thử tự động, tích hợp liên tục (CI) và triển khai liên tục (CD) tự động hóa từ **GitHub Actions → Docker Hub → Local Docker Engine**.

---

## 1. Cấu Trúc Dự Án

```text
product-api/
├── .github/
│   └── workflows/
│       ├── test-productci.yml            # CI cơ bản test cú pháp & unit test
│       ├── test-productci-prod.yml       # CI môi trường thật với container MongoDB + Healthcheck
│       └── cd-dockerhub-deploy.yml       # CD tự động: CI -> Push Docker Hub -> Tự động cập nhật Local Engine
├── src/
│   ├── config/
│   │   └── db.js                         # Kết nối Mongoose & hàm kiểm tra trạng thái Healthcheck
│   ├── controllers/
│   │   └── product.controller.js         # Xử lý CRUD (POST, GET all, GET by pid, PUT, DELETE)
│   ├── models/
│   │   └── product.model.js              # Mongoose Schema: pid, pname, price, quantity
│   ├── routes/
│   │   ├── product.routes.js             # Route endpoints /api/products
│   │   └── health.routes.js              # Route healthcheck /health
│   ├── app.js                            # Cấu hình Express app và middleware
│   └── server.js                         # Khởi chạy server và kết nối DB
├── tests/
│   ├── product.test.js                   # Test suite kiểm thử toàn diện các luồng CRUD
│   └── health.test.js                    # Test suite kiểm tra endpoint healthcheck
├── scripts/
│   ├── deploy-local.ps1                  # Script PowerShell tự động pull & chạy trên Local Engine
│   ├── deploy-local.sh                   # Script Bash tự động pull & chạy trên Local Engine
│   └── setup-local-runner.md             # Hướng dẫn chi tiết thiết lập CD tự động hoàn toàn
├── Dockerfile                            # Dockerfile tối ưu multi-stage, bảo mật, tích hợp HEALTHCHECK
├── docker-compose.yml                    # Chạy dev local với container 'nammongodb' & 'product-api'
├── docker-compose-prod.yaml              # Chạy production image từ Docker Hub + Watchtower tự động CD
├── .dockerignore                         # Bỏ qua file rác khi build image
├── .env                                  # Biến môi trường local
├── .env.example                          # Template mẫu các biến môi trường
├── package.json                          # Dependencies & NPM scripts
└── README.md                             # Hướng dẫn chi tiết
```

---

## 2. API Endpoints

| Method | Endpoint | Mô tả | Request Body | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Kiểm tra trạng thái API & MongoDB | None | `200` (UP) / `503` |
| `POST` | `/api/products` | Tạo sản phẩm mới | `{ "pid": "P01", "pname": "Laptop", "price": 1200, "quantity": 10 }` | `201` / `400` / `409` |
| `GET` | `/api/products` | Lấy danh sách sản phẩm (có hỗ trợ `?search=...`) | None | `200` |
| `GET` | `/api/products/:pid` | Lấy chi tiết 1 sản phẩm theo `pid` | None | `200` / `404` |
| `PUT` | `/api/products/:pid` | Cập nhật thông tin sản phẩm | `{ "price": 1150, "quantity": 8 }` | `200` / `404` |
| `DELETE`| `/api/products/:pid` | Xóa sản phẩm theo `pid` | None | `200` / `404` |

---

## 3. Hướng Dẫn Từng Bước (Theo Đề Bài)

### Bước 1 & 2: Tạo Repository trên GitHub và Clone về máy
1. Đăng nhập [GitHub](https://github.com), tạo mới một repository rỗng tên là `product-api` (chế độ Public).
2. Nếu bạn dùng Git Bash trong thư mục dự án này, chỉ cần liên kết remote và push lên:
   ```bash
   cd product-api
   git init
   git add .
   git commit -m "feat: complete product-api with docker and CI/CD"
   git branch -M main
   git remote add origin https://github.com/nguyenhuuloc0303-ai/product-api.git
   git push -u origin main
   ```

---

### Bước 3: Kết nối Docker Desktop với VS Code
1. Cài đặt Docker Desktop và khởi động ứng dụng.
2. Trong VS Code, mở tab **Extensions** (`Ctrl + Shift + X`), tìm và cài đặt extension: **Docker** (`ms-azuretools.vscode-docker`).
3. Mở tab Docker ở thanh bên trái VS Code để xem danh sách Containers, Images, Networks.

---

### Bước 4: Tạo Container MongoDB tên `nammongodb` trên Docker Engine
Mở terminal trong VS Code và gõ lệnh:
```bash
docker run -d --name nammongodb -p 27017:27017 mongo:7.0
```
Kiểm tra container đang chạy:
```bash
docker ps
```

---

### Bước 5: Chạy và kết nối ứng dụng với `nammongodb`
File `.env` đã được cấu hình sẵn:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/productdb
```
Cài đặt thư viện và chạy ứng dụng:
```bash
npm install
npm run dev
```
Truy cập trình duyệt kiểm tra:
- Health check: `http://localhost:3000/health`
- Danh sách sản phẩm: `http://localhost:3000/api/products`

---

### Bước 6: Tiến hành Dockerize cho `product-api`
File `Dockerfile` đã được cấu hình:
- Sử dụng base image nhẹ `node:20-alpine`.
- Non-root user `node` để tăng cường an toàn.
- Lệnh `HEALTHCHECK` định kỳ kiểm tra `/health`.

Build và chạy thử image độc lập:
```bash
# Build image
docker build -t product-api:v1 .

# Chạy container kết nối với nammongodb
docker run -d --name product-api -p 3000:3000 --link nammongodb:nammongodb -e MONGO_URI=mongodb://nammongodb:27017/productdb product-api:v1
```

---

### Bước 7 & 8: Chạy bằng Docker Compose (Kèm Healthcheck cho MongoDB + Product API)
Dùng file `docker-compose.yml` để chạy toàn bộ hệ thống gồm MongoDB và API:
```bash
docker compose up -d --build
```
Kiểm tra trạng thái sức khỏe (health status):
```bash
docker compose ps
```
Cả hai container `nammongodb` và `product-api` sẽ hiển thị trạng thái `(healthy)`.

---

### Bước 9: CI Cơ Bản (`test-productci.yml`)
Workflow tại `.github/workflows/test-productci.yml`:
- Tự động chạy khi có `push` hoặc `pull_request` vào `main`.
- Kiểm tra cú pháp (syntax check) và chạy test.

---

### Bước 10: CI Sản Phẩm Thực Tế với MongoDB Container (`test-productci-prod.yml`)
Workflow tại `.github/workflows/test-productci-prod.yml`:
- Tự động dựng một container MongoDB 7.0 thật trên máy ảo GitHub (`services.mongodb`).
- Chạy integration test CRUD trên database thật.
- Khởi động server và dùng `curl` kiểm tra endpoint `/health`.
- Build thử Docker image để đảm bảo không có lỗi Dockerize.

---

### Bước 11: CD với Docker Hub
1. Đăng nhập [Docker Hub](https://hub.docker.com), lấy username.
2. Vào GitHub repo `product-api` → **Settings** → **Secrets and variables** → **Actions** → Thêm 2 Secrets:
   - `DOCKERHUB_USERNAME`: Tên tài khoản Docker Hub của bạn.
   - `DOCKERHUB_TOKEN`: Personal Access Token (vào Docker Hub → Account Settings → Security → New Access Token).
3. Khi push code lên nhánh `main`, workflow `.github/workflows/cd-dockerhub-deploy.yml` sẽ tự động:
   - Chạy toàn bộ test & healthcheck.
   - Build Docker image và push lên Docker Hub: `<username>/product-api:latest`.

---

### Bước 12: Chạy Production Image từ Docker Hub trên Local Docker Engine
Sử dụng file `docker-compose-prod.yaml`:
```bash
# Thay thế DOCKERHUB_USERNAME bằng tài khoản của bạn trong file .env hoặc command line
docker compose -f docker-compose-prod.yaml pull
docker compose -f docker-compose-prod.yaml up -d
```

---

### Bước 13: Tự Động Hóa Quá Trình CD (GitHub Actions → Docker Hub → Local Docker Engine)
Hệ thống hỗ trợ 2 cơ chế tự động hóa:

1. **Cơ chế Watchtower (Khuyên dùng - Hoàn toàn tự động)**:
   - File `docker-compose-prod.yaml` đã chứa service `watchtower`.
   - Watchtower chạy ngầm, tự động thăm dò Docker Hub mỗi 30 giây.
   - Khi GitHub Actions push image mới lên Docker Hub, Watchtower trên máy bạn sẽ tự động kéo image mới về và cập nhật lại container `product-api` mà bạn không cần gõ bất kỳ lệnh nào!

2. **Cơ chế GitHub Self-Hosted Runner**:
   - Xem hướng dẫn chi tiết tại [setup-local-runner.md](scripts/setup-local-runner.md).
   - Workflow job `deploy-local-runner` sẽ trực tiếp kích hoạt lệnh deploy trên máy local của bạn ngay khi build xong trên GitHub.
