## Quỹ Hỗ Trợ Startup Sinh Viên (Student Startup Fund)

Nền tảng gây quỹ, bình chọn, bình luận và **chốt cổ tức / nhận cổ tức** cho các dự án khởi nghiệp sinh viên trên **Ethereum (Sepolia)**.  
Mọi hoạt động donate, vote, bình luận, chốt và claim cổ tức đều ghi on-chain, giúp **minh bạch, không thể sửa đổi, không phụ thuộc bên trung gian**.

- **Admin (owner contract)**: tạo & quản lý dự án, bật/tắt hiển thị, **chốt cổ tức** (`finalizeDividends`), **rút ETH khẩn cấp** (`withdraw`) trước khi chốt cổ tức.
- **Nhà đầu tư / cộng đồng**: duyệt dự án, **donate ETH trong IOC**, **vote tín nhiệm (trong IOC)**, **vote giải ngân (sau IOC, chỉ người đã donate)**, bình luận & đánh giá, **claim cổ tức** sau khi admin chốt.

Kết hợp:

- **Smart contract Solidity (Hardhat)** tại thư mục `QLHT/` — file chính: `contracts/StudentStartupFund.sol`
- **Frontend React + Vite** tại thư mục `frontend/` (UI AdminLTE-style, Bootstrap 5, Font Awesome, Recharts)



## 1. Kiến trúc tổng quan

- `QLHT/`: mã nguồn `StudentStartupFund.sol`, Hardhat, Ignition module, script deploy `scripts/deploy.js`.
- `frontend/`: SPA React:
  - `/` — danh sách dự án, kết nối ví.
  - `/project/:id` — chi tiết: tổng quan, đội ngũ, **Tham gia** (donate + vote), **Cổ tức** (claim), bình luận.
  - `/my-dividends` — danh sách dự án có cổ tức có thể nhận, claim từng dự án.
  - `/admin` — dashboard, quản lý dự án, **Chia cổ tức** (`/admin/dividends`) để chốt cổ tức theo dự án.

Toàn bộ nghiệp vụ chính đi qua **smart contract trên Sepolia**; frontend chỉ hiển thị và gọi MetaMask.



## 2. Yêu cầu môi trường

- Node.js >= 18
- npm >= 9
- Ví **MetaMask** đã add network **Sepolia** và có ETH test.



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

- Private key là của ví deploy (owner contract), **không dùng ví chứa tài sản thật**.

### 3.3 Compile contract

```bash
cd QLHT
npx hardhat compile
```

### 3.4 Deploy lên Sepolia

**Cách 1 — Script (khuyến nghị, không cần xác nhận Ignition, có thể ghi đè `frontend/.env`):**

```bash
cd QLHT
npx hardhat run scripts/deploy.js --network sepolia
```

**Cách 2 — Hardhat Ignition** (nếu bytecode thay đổi so với lần deploy trước, có thể cần xóa `ignition/deployments/chain-11155111` hoặc dùng flow reset theo tài liệu Hardhat):

```bash
cd QLHT
npx hardhat ignition deploy ignition/modules/StudentStartupFund.js --network sepolia
```

Sau deploy, đặt địa chỉ contract vào `frontend/.env` (`VITE_STUDENT_FUND_ADDRESS=...`) và đồng bộ ABI nếu cần:

```bash
cp QLHT/artifacts/contracts/StudentStartupFund.sol/StudentStartupFund.json frontend/src/abi/StudentStartupFund.json
```



## 4. Cấu hình & chạy frontend (`frontend/`)

### 4.1 Cài đặt dependencies

```bash
cd frontend
npm install
```

### 4.2 Cấu hình môi trường frontend

Tạo / sửa `frontend/.env`:

```bash
VITE_STUDENT_FUND_ADDRESS=0x...ĐỊA_CHỈ_CONTRACT_TỪ_SEPOLIA...
```

Frontend đọc ABI từ `src/abi/StudentStartupFund.json` (phải khớp bản compile mới nhất).

### 4.3 Chạy dự án

```bash
cd frontend
npm run dev
```

- `http://localhost:5173/` — Trang chủ, kết nối / ngắt ví, link **Cổ tức của tôi**.
- `http://localhost:5173/project/:id` — Chi tiết: donate, vote, cổ tức, comment.
- `http://localhost:5173/my-dividends` — Nhận cổ tức đa dự án.
- `http://localhost:5173/admin` — Admin: dashboard, dự án, **Chia cổ tức**.



## 5. Smart contract `StudentStartupFund.sol` — tính năng & luồng

### 5.1 Dữ liệu chính (on-chain)

- **`Project`**: id, title, description, image, teamJson, token (name, symbol, address, price), goal, totalDonated, projectStart/End, iocStart/End, trustVotes, withdrawVotes, status (enum), active, **dividendPool**, **dividendDenominator**, **dividendsFinalized**.
- **`donatedByUser[projectId][user]`**: số wei user đã donate (dùng cho tỷ lệ cổ tức).
- **`claimedDividends[projectId][user]`**: phần cổ tức đã nhận.
- **`votedTrust` / `votedWithdraw`**: mỗi ví tối đa 1 lần / loại / dự án.
- **Bình luận**: lưu trong `projectComments` (user, content, rating 1–5, timestamp).

**Trạng thái dự án (`ProjectStatus`)**: Upcoming, Funding, Ongoing, Completed, Cancelled — được tính nội bộ theo thời gian IOC / dự án (không phải mọi giá trị enum đều được gán thủ công trong mọi nhánh).

### 5.2 Admin — `createProject`

- Chỉ **owner**.
- Bắt buộc: title, goal > 0.
- Nếu **projectStart = projectEnd = 0**: mặc định `projectStart = now`, `projectEnd = now + 90 days`.
- Nếu **iocStart = iocEnd = 0**: mặc định `iocStart = now`, `iocEnd = now + 30 days`.
- Ràng buộc: `iocStart < iocEnd`, `projectStart <= projectEnd`.

### 5.3 Admin — `setProjectActive(projectId, active)`

- Bật/tắt hoạt động dự án; **không** cho phép nếu dự án đã **chốt cổ tức** (`dividendsFinalized`).

### 5.4 Donate — `donate(projectId)` (payable)

- Chỉ trong **`iocStart` ≤ now ≤ `iocEnd`**.
- Dự án **active**, chưa **finalized** cổ tức, `msg.value > 0`.
- Cộng `totalDonated` và `donatedByUser`.

### 5.5 Bình luận — `addComment`, `getCommentsCount`, `getComment`

- Dự án **active**; nội dung không rỗng; rating **1–5**.
- **Không** khóa theo thời gian IOC (chỉ cần dự án còn active).
- **Không** có phí comment on-chain trong contract hiện tại.

### 5.6 Vote tín nhiệm — `voteTrust`

- Trong **IOC** (`iocStart` … `iocEnd`), dự án active, chưa finalized, mỗi ví vote **một lần**.

### 5.7 Vote giải ngân — `voteWithdraw`

- **Sau khi IOC kết thúc** (`now > iocEnd`).
- Chỉ **nhà đầu tư đã donate** (`donatedByUser > 0`), dự án active, chưa finalized, mỗi ví một lần.
- Dùng để thể hiện đồng thuận cộng đồng; **finalize cổ tức** trong contract hiện tại **không** bắt buộc số phiếu tối thiểu (owner vẫn có thể chốt theo điều kiện riêng dưới đây).

### 5.8 Chốt cổ tức & giải ngân treasury — `finalizeDividends` (chỉ owner)

Điều kiện:

- Chưa **finalized**, **IOC đã kết thúc**, `totalDonated > 0`, `treasury != 0`, **`dividendAmount <= totalDonated`**.

Hành vi:

- `dividendPool = dividendAmount` — tổng ETH phân bổ cho nhà đầu tư (theo tỷ lệ donate).
- `dividendDenominator = totalDonated`.
- `treasuryAmount = totalDonated - dividendAmount` gửi tới **`treasury`** (nếu > 0).
- Đánh dấu **dividendsFinalized = true**, **active = false**.

Công thức phần được nhận (trước khi claim):  
`(userDonated * dividendPool) / dividendDenominator`, trừ phần đã claim.

### 5.9 Nhận cổ tức — `claimDividends`, `getClaimableDividends`

- Sau khi finalized, user gọi `claimDividends(projectId)`; số nhận = `getClaimableDividends(projectId, user)` (view).
- Cập nhật `claimedDividends`, chuyển ETH bằng `call`.

### 5.10 Rút khẩn cấp — `withdraw` (chỉ owner)

- Chuyển `amount` ETH tới `to`; **không** cho phép nếu dự án đã **finalized** cổ tức.
- Dùng khi cần xử lý trước khi chốt (lưu ý: rút làm giảm balance contract — cần đảm bảo đủ ETH khi chốt/claim).

### 5.11 Sự kiện (events)

`ProjectCreated`, `DonationReceived`, `CommentAdded`, `VotedTrust`, `VotedWithdraw`, `Withdrawn`, `ProjectDisbursed`, `DividendClaimed` — phục vụ indexer / explorer.



## 6. Luồng nghiệp vụ gợi ý (end-to-end)

1. **Admin** tạo dự án (`createProject`), có thể chỉnh active (`setProjectActive`).
2. Trong **IOC**: cộng đồng **donate**, **vote tín nhiệm**; có thể **bình luận** nếu dự án active.
3. **Sau IOC**: nhà đầu tư đã donate có thể **vote giải ngân**.
4. Khi IOC đã hết và có tiền góp: **owner** gọi **`finalizeDividends`** (nhập treasury + số ETH cổ tức cho pool nhà đầu tư).
5. Nhà đầu tư vào tab **Cổ tức** / trang **Cổ tức của tôi** và gọi **`claimDividends`**.



## 7. Lưu ý bảo mật & vận hành

- **Owner** có quyền cao: tạo dự án, chốt cổ tức, rút ETH (trước khi finalized). Bảo vệ private key deploy.
- Mỗi lần **đổi logic contract** cần **deploy lại** và cập nhật `VITE_STUDENT_FUND_ADDRESS` + ABI; dữ liệu dự án cũ nằm ở địa chỉ contract cũ.
- Đọc explorer Sepolia để đối chiếu giao dịch và sự kiện.
