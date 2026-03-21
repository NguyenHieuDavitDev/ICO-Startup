# Quỹ Hỗ Trợ Startup Sinh Viên (Student Startup Fund)

Nền tảng gây quỹ và bầu chọn phi tập trung dành cho các dự án khởi nghiệp sinh viên, xây dựng trên blockchain Ethereum (Sepolia testnet).

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Smart Contracts](#smart-contracts)
- [Luồng hoạt động](#luồng-hoạt-động)
- [Trang và tính năng chi tiết](#trang-và-tính-năng-chi-tiết)

---

## Tổng quan

Nền tảng cho phép:
- **Admin** tạo và quản lý các dự án startup sinh viên trên blockchain
- **Cộng đồng** quyên góp ETH, bầu chọn tin tưởng/giải ngân và bình luận về dự án
- **Nhà đầu tư** nhận cổ tức (dividends) sau khi dự án hoàn thành
- Toàn bộ giao dịch được ghi lại minh bạch, không thể chỉnh sửa trên chain

---

## Tính năng

### Dành cho người dùng

| Tính năng | Mô tả |
|---|---|
| **Duyệt dự án** | Xem danh sách dự án với bộ lọc (Tất cả / Đang gây quỹ / Sắp diễn ra / Đã kết thúc) và tìm kiếm theo tên |
| **Chi tiết dự án** | Xem thông tin đầy đủ: tiến độ gây quỹ, đội nhóm, token phát hành, phiếu bầu, bình luận |
| **Quyên góp ETH** | Đóng góp ETH trong giai đoạn IOC (Initial Offering Cycle) |
| **Bầu chọn tin tưởng** | Vote trust trong suốt giai đoạn IOC (1 phiếu/người/dự án) |
| **Bầu chọn giải ngân** | Vote withdraw sau IOC (chỉ dành cho người đã quyên góp) |
| **Bình luận & đánh giá** | Gửi bình luận kèm đánh giá sao (1–5) cho dự án |
| **Nhận cổ tức** | Nhận lại ETH theo tỉ lệ đóng góp sau khi admin finalize dự án |
| **Trang My Dividends** | Xem toàn bộ cổ tức có thể nhận từ các dự án đã tham gia |

### Dành cho Admin

| Tính năng | Mô tả |
|---|---|
| **Dashboard tổng quan** | Biểu đồ thống kê: ETH gây quỹ, phiếu bầu, bình luận theo dự án |
| **Tạo dự án** | Form nhiều bước: Thông tin / Đội nhóm / Token / Thời gian |
| **Quản lý dự án** | Bật/tắt hiển thị dự án, xem chi tiết inline, in báo cáo |
| **Finalize cổ tức** | Nhập địa chỉ treasury + số ETH chia cho nhà đầu tư để chốt phân phối |

---

## Công nghệ sử dụng

### Frontend
- **React 19** + **Vite** — UI framework và build tool
- **React Router DOM 7** — Điều hướng SPA
- **Ethers.js 6** — Kết nối MetaMask và giao tiếp smart contract
- **Bootstrap 5** — UI components và layout
- **Font Awesome** — Icon
- **Recharts** — Biểu đồ thống kê (Bar, Pie, Line)

### Smart Contracts
- **Solidity 0.8.28** — Ngôn ngữ smart contract
- **Hardhat** — Môi trường phát triển, compile, test, deploy
- **OpenZeppelin** — ERC20, ERC20Capped, ERC20Burnable, Pausable, Ownable

### Mạng blockchain
- **Ethereum Sepolia Testnet** — Môi trường triển khai

---

## Cấu trúc dự án

```
duan/
├── QLHT/                              # Smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── StudentStartupFund.sol     # Contract chính: gây quỹ, bầu chọn, cổ tức
│   │   └── StudentToken.sol           # ERC20 token mẫu cho từng dự án
│   ├── scripts/
│   │   └── deploy.js                  # Script deploy lên Sepolia
│   ├── hardhat.config.js
│   └── .env                           # INFURA_API_KEY, SEPOLIA_PRIVATE_KEY
│
└── frontend/                          # React SPA (Vite)
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx               # Trang chủ + danh sách dự án
    │   │   ├── ProjectDetail.jsx      # Chi tiết dự án (tab)
    │   │   ├── MyDividends.jsx        # Trang cổ tức của người dùng
    │   │   ├── AdminDashboard.jsx     # Dashboard admin + biểu đồ
    │   │   ├── AdminProjects.jsx      # Quản lý dự án
    │   │   └── AdminDividends.jsx     # Finalize cổ tức
    │   ├── components/
    │   │   ├── Donate.jsx             # Form quyên góp ETH
    │   │   ├── Vote.jsx               # Bầu chọn trust / withdraw
    │   │   ├── Comment.jsx            # Gửi bình luận + đánh giá sao
    │   │   ├── CommentList.jsx        # Hiển thị danh sách bình luận
    │   │   ├── Dividends.jsx          # Nhận cổ tức (user) / Finalize (admin)
    │   │   ├── CreateProject.jsx      # Modal tạo dự án
    │   │   ├── ProjectDetailInline.jsx# Xem chi tiết inline trong admin
    │   │   ├── ProjectImage.jsx       # Ảnh dự án với fallback avatar
    │   │   ├── ErrorBoundary.jsx      # Xử lý lỗi React
    │   │   └── Toast.jsx              # Thông báo toast
    │   ├── layouts/
    │   │   ├── PublicLayout.jsx       # Layout trang public (header + footer)
    │   │   └── AdminLayout.jsx        # Layout admin (sidebar + topbar)
    │   ├── abi/
    │   │   └── StudentStartupFund.json# ABI contract
    │   ├── ethers.js                  # Hàm kết nối contract
    │   └── main.jsx                   # Entry point + routing
    └── .env                           # VITE_STUDENT_FUND_ADDRESS
```

---

## Cài đặt và chạy

### Yêu cầu
- Node.js >= 18
- MetaMask extension đã cài trên trình duyệt
- Tài khoản có Sepolia ETH (lấy từ faucet)

### 1. Cài đặt smart contracts

```bash
cd QLHT
npm install
```

Tạo file `.env` trong `QLHT/`:

```env
INFURA_API_KEY=your_infura_api_key
SEPOLIA_PRIVATE_KEY=your_wallet_private_key
```

Deploy lên Sepolia:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Ghi lại địa chỉ contract sau khi deploy.

### 2. Cài đặt frontend

```bash
cd frontend
npm install
```

Tạo file `.env` trong `frontend/`:

```env
VITE_STUDENT_FUND_ADDRESS=0xYourContractAddress
```

### 3. Chạy frontend

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

### 4. Build production

```bash
npm run build
```

---

## Smart Contracts

### StudentStartupFund.sol

Contract chính quản lý toàn bộ logic của nền tảng.

#### Trạng thái dự án (`ProjectStatus`)

| Trạng thái | Điều kiện |
|---|---|
| `Upcoming` | Chưa đến thời điểm mở IOC |
| `Funding` | Đang trong giai đoạn IOC (iocStart ≤ now ≤ iocEnd) |
| `Ongoing` | Sau IOC, trước khi kết thúc dự án |
| `Completed` | Sau thời điểm kết thúc dự án |
| `Cancelled` | Bị hủy |

#### Các hàm chính

**Quản lý dự án (chỉ Owner)**
- `createProject()` — Tạo dự án mới với đầy đủ metadata
- `setProjectActive()` — Bật/tắt hiển thị dự án
- `withdraw()` — Rút ETH khẩn cấp trước khi finalize

**Cộng đồng**
- `donate(projectId)` — Quyên góp ETH trong giai đoạn IOC
- `voteTrust(projectId)` — Vote tin tưởng dự án (trong IOC)
- `voteWithdraw(projectId)` — Vote đồng ý giải ngân (sau IOC, chỉ donor)
- `addComment(projectId, content, rating)` — Bình luận kèm đánh giá 1–5 sao

**Cổ tức**
- `finalizeDividends(projectId, treasuryAddress, dividendAmount)` — Admin chốt phân phối: chuyển phần còn lại cho treasury, giữ lại pool cho investor
- `claimDividends(projectId)` — Investor nhận cổ tức theo tỉ lệ đóng góp
- `getClaimableDividends(projectId, address)` — Xem số ETH có thể nhận

#### Công thức cổ tức

```
cổ tức của bạn = (số ETH bạn đóng góp / tổng ETH dự án) × dividendPool
```

### StudentToken.sol

ERC20 token mẫu cho từng dự án khởi nghiệp.

- Kế thừa: `ERC20`, `ERC20Capped` (tối đa 1,000,000 token), `ERC20Burnable`, `Pausable`
- Phát hành ban đầu: 300,000 token cho deployer
- Owner có thể: mint thêm token, pause/unpause chuyển nhượng

---

## Luồng hoạt động

```
Admin tạo dự án
       │
       ▼
Dự án ở trạng thái Upcoming
       │
       ▼ (đến iocStart)
Giai đoạn Funding (IOC)
  ├─ Người dùng quyên góp ETH
  └─ Người dùng vote tin tưởng
       │
       ▼ (sau iocEnd)
Giai đoạn Ongoing
  └─ Donor vote đồng ý giải ngân
       │
       ▼ (sau projectEnd)
Dự án Completed
       │
       ▼
Admin finalize cổ tức
  ├─ Phần treasury → chuyển cho địa chỉ treasury
  └─ Dividend pool → giữ trong contract
       │
       ▼
Donor nhận cổ tức theo tỉ lệ đóng góp
```

---

## Trang và tính năng chi tiết

### Trang chủ (`/`)

- Hero section với nút CTA dẫn đến danh sách dự án và hướng dẫn
- Thanh thống kê: tổng số dự án, dự án đang hoạt động, tổng ETH gây quỹ, tổng lượt vote
- Danh sách dự án với:
  - Lọc theo trạng thái: Tất cả / Đang gây quỹ / Sắp diễn ra / Đã kết thúc
  - Tìm kiếm theo tên dự án
  - Card: ảnh, tiêu đề, mô tả ngắn, thanh tiến độ, mục tiêu ETH, đếm ngược thời gian, số phiếu trust
- Section giới thiệu tính năng nền tảng

### Chi tiết dự án (`/project/:id`)

Giao diện tab với 5 mục:

| Tab | Nội dung |
|---|---|
| **Tổng quan** | ETH đã gây quỹ / mục tiêu / tiến độ, thông tin token (tên, ký hiệu, địa chỉ, giá) |
| **Đội nhóm** | Danh sách thành viên dưới dạng profile card |
| **Tương tác** | Form quyên góp ETH + panel bầu chọn (trust / withdraw) đặt cạnh nhau |
| **Cổ tức** | Số ETH có thể nhận + nút "Nhận cổ tức" |
| **Bình luận** | Form gửi bình luận + danh sách tất cả bình luận kèm sao đánh giá |

### Trang cổ tức của tôi (`/my-dividends`)

- Kiểm tra ví đã kết nối chưa
- Bảng danh sách các dự án có cổ tức khả dụng
- Nút "Nhận cổ tức" riêng từng dự án, hiển thị trạng thái loading
- Badge tổng số ETH có thể nhận

### Admin Dashboard (`/admin`)

- 4 thẻ thống kê: tổng dự án, tổng ETH, tổng phiếu vote, tổng bình luận
- Biểu đồ cột: ETH gây quỹ theo từng dự án
- Biểu đồ tròn: phân phối tỉ lệ đóng góp
- Biểu đồ đường: trust vote + withdraw vote + bình luận theo dự án
- Bảng top 5 dự án theo ETH gây quỹ

### Quản lý dự án (`/admin/projects`)

- Nút "Thêm dự án" mở modal tạo mới nhiều bước (Thông tin / Đội nhóm / Token / Thời gian)
- 4 thẻ số liệu nhanh: tổng dự án, ETH gây quỹ, dự án đang mở, số dự án active
- Bảng dự án có:
  - Tìm kiếm theo tên
  - Cột: ảnh + tên / mục tiêu vs đã gây quỹ / tiến độ / phiếu bầu / bình luận / trạng thái
  - Nút hành động: xem chi tiết inline, in báo cáo, bật/tắt hiển thị

### Finalize cổ tức (`/admin/dividends`)

- Sidebar trái: danh sách dự án kèm chỉ số sẵn sàng finalize
- Panel phải:
  - Hiển thị điều kiện (IOC đã kết thúc? Đạt mục tiêu? Đủ phiếu?)
  - Input địa chỉ treasury
  - Input số ETH dành cho dividend pool
  - Nút "Finalize Dividends" (chỉ owner mới thực hiện được)

---

## Kết nối ví

Nhấn **"Kết nối ví"** ở góc trên phải để kết nối MetaMask. Đảm bảo MetaMask đang ở mạng **Sepolia**. Nền tảng sẽ hiển thị badge mạng và địa chỉ ví rút gọn sau khi kết nối thành công.

---

## Biến môi trường

### `frontend/.env`

```env
VITE_STUDENT_FUND_ADDRESS=0xYourDeployedContractAddress
```

### `QLHT/.env`

```env
INFURA_API_KEY=your_infura_project_id
SEPOLIA_PRIVATE_KEY=your_deployer_wallet_private_key
```
