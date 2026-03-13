## Quỹ Hỗ Trợ Startup Sinh Viên (Student Startup Fund)

Nền tảng gây quỹ, bình chọn và giám sát các dự án khởi nghiệp của sinh viên trên **Ethereum (Sepolia)**.  
Mọi hoạt động donate, vote, bình luận đều ghi on-chain, giúp **minh bạch, không thể sửa đổi, không phụ thuộc bên trung gian**.

- **Admin**: tạo & quản lý dự án, cấu hình thông tin ICO, thời gian, đội ngũ, token, rút vốn khi cộng đồng phê duyệt.
- **Nhà đầu tư / cộng đồng**: duyệt danh sách dự án, donate ETH, vote tín nhiệm / giải ngân, bình luận & đánh giá.

Kết hợp:
- **Smart contract Solidity (Hardhat)** tại thư mục `QLHT/`
- **Frontend React + Vite** tại thư mục `frontend/` với UI kiểu AdminLTE, Bootstrap 5, Font Awesome, Recharts.



## 1. Kiến trúc tổng quan

- `QLHT/`: mã nguồn smart contract `StudentStartupFund.sol`, cấu hình Hardhat, scripts deploy.
- `frontend/`: SPA React hiển thị:
  - Trang chủ `/`: danh sách dự án, header/footer, project card có hình ảnh, click vào card → trang chi tiết.
  - Trang chi tiết `/project/:id`: donate, vote, comment, xem đội ngũ, thông tin token, tiến độ.
  - Khu admin `/admin`: dashboard tổng quan (chart), quản lý dự án (tạo mới, bật/tắt, in thông tin, xem chi tiết inline).

Toàn bộ nghiệp vụ chính đều đi qua **smart contract trên Sepolia**, frontend chỉ là lớp hiển thị & tương tác với MetaMask.



## 2. Yêu cầu môi trường

- Node.js >= 18
- npm >= 9
- Ví **MetaMask** đã add network **Sepolia** và có một ít ETH test.



## 3. Cài đặt & chạy smart contract (`QLHT/`)

### 3.1 Cài đặt dependencies

```bash
cd QLHT
npm install
```

### 3.2 Cấu hình `.env` (KHÔNG commit lên git)

Tạo file `QLHT/.env`:

```bash
INFURA_API_KEY=your_infura_key
SEPOLIA_PRIVATE_KEY=0x_your_private_key
```

- Private key là của ví deploy (ví admin), **tuyệt đối không dùng ví chính chứa tài sản thật**.
- File này đã được `.gitignore` bỏ qua, an toàn khi push code.

### 3.3 Compile contract

```bash
cd QLHT
npx hardhat compile
```

Nếu compile thành công sẽ thấy dòng:

```text
Compiled 1 Solidity file successfully
```

### 3.4 Deploy lên Sepolia

Sử dụng **Hardhat Ignition** hoặc script deploy (tùy bạn đang dùng), ví dụ:

```bash
cd QLHT
npx hardhat ignition deploy ignition/modules/StudentStartupFund.js --network sepolia
```

Sau khi deploy xong, copy **địa chỉ contract** `StudentStartupFund` để dùng cho frontend.



## 4. Cấu hình & chạy frontend (`frontend/`)

### 4.1 Cài đặt dependencies

```bash
cd frontend
npm install
```

### 4.2 Cấu hình môi trường frontend

Tạo file `frontend/.env`:

```bash
VITE_STUDENT_FUND_ADDRESS=0x...ĐỊA_CHỈ_CONTRACT_TỪ_SEPOLIA...
```

> Frontend tự động đọc `VITE_STUDENT_FUND_ADDRESS` và dùng ABI mới nhất từ `src/abi/StudentStartupFund.json` để kết nối contract.

### 4.3 Chạy dự án

```bash
cd frontend
npm run dev
```

Mở trình duyệt tại: `http://localhost:5173/`

- `http://localhost:5173/` – **Trang chủ**
  - Header + Footer hoàn chỉnh.
  - Hero section, thống kê nhanh.
  - Danh sách project cards (có hình, tiến độ, trạng thái). Click bất kỳ chỗ nào trong card → `Trang chi tiết`.
- `http://localhost:5173/project/:id` – **Trang chi tiết dự án**
  - Tab **Tổng quan / Đội ngũ / Tham gia / Bình luận**.
  - Thực hiện **donate, vote, comment** trực tiếp on-chain (cần MetaMask + phí gas).
- `http://localhost:5173/admin` – **Trang quản trị**
  - Dashboard: biểu đồ ETH đã donate, phân bổ theo dự án, lượt vote & comment.
  - Quản lý dự án: tạo dự án mới qua modal nhiều tab, bật/tắt hoạt động, in thông tin, xem chi tiết inline.



## 5. Luồng nghiệp vụ chính

### 5.1 Admin tạo dự án mới

1. Đăng nhập MetaMask với ví admin (chính là ví deploy contract).
2. Vào `/admin` → tab **Quản lý dự án** → bấm **“Thêm dự án mới”**.
3. Nhập:
   - Thông tin dự án: tên, mô tả, URL hình ảnh (có preview trực tiếp).
   - Đội ngũ: nhiều thành viên, vai trò, mô tả, link mạng xã hội.
   - Token & IOC: tên token, symbol, địa chỉ token, giá IOC, mục tiêu ETH.
   - Thời gian: mốc IOC & mốc dự án (hoặc để trống để dùng default).
4. Xác nhận giao dịch MetaMask → contract `createProject` lưu toàn bộ dữ liệu on-chain.

### 5.2 Người dùng donate, vote, bình luận

Trên trang chi tiết dự án:

- **Donate**:
  - Nhập số ETH → MetaMask mở popup → gửi `donate(projectId)` với `msg.value` đúng số ETH.
  - Thành công: tổng `totalDonated` tăng, dashboard & trang chủ cập nhật tiến độ.

- **Vote**:
  - 2 loại vote: **tín nhiệm** và **giải ngân** (`voteTrust`, `voteWithdraw`).
  - Mỗi ví chỉ được vote 1 lần / loại vote / dự án, mọi vote đều tốn một lượng gas nhỏ và (tuỳ cấu hình) có thể kèm fee vote.

- **Bình luận**:
  - Nội dung + đánh giá sao (1–5).
  - Mỗi comment gửi on-chain qua `addComment(projectId, content, rating)` và tốn gas; có thể cấu hình **commentFee** nhỏ để chống spam.
  - Danh sách comment hiển thị lại đầy đủ từ contract.

Nhờ đưa donate + vote + comment lên blockchain, hệ thống:
- **Khó có thể gian lận**: không xoá/sửa bình luận, không sửa số vote.
- **Minh bạch**: ai cũng có thể kiểm tra trực tiếp trên explorer của Sepolia.



