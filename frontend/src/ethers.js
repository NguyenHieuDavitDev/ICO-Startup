import { ethers } from "ethers";
import StudentStartupFund from "./abi/StudentStartupFund.json";

// Địa chỉ contract — lấy từ .env hoặc fallback sang giá trị cứng
const CONTRACT_ADDRESS =
  import.meta.env.VITE_STUDENT_FUND_ADDRESS;

const ABI = StudentStartupFund.abi;

// RPC công cộng cho Sepolia — dùng khi chỉ đọc (không cần MetaMask)
const SEPOLIA_RPC = "https://rpc.sepolia.org";

export async function getContract(readonly = false) {
  if (readonly) {
    // Ưu tiên dùng MetaMask provider nếu có, fallback RPC công cộng
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      }
    } catch { /* bỏ qua, dùng RPC công cộng */ }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  }

  // Ghi dữ liệu → bắt buộc phải có MetaMask
  if (!window.ethereum) {
    throw new Error("Vui lòng cài MetaMask để thực hiện giao dịch");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}
