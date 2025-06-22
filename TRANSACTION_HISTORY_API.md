# Transaction History API

## Tổng quan
API này cung cấp các endpoint để lấy lịch sử giao dịch với cấu trúc chính xác như yêu cầu.

## Endpoints

### 1. Lấy lịch sử giao dịch
**GET** `/api/transactions/history`

Lấy tất cả giao dịch của user (cả booking và wallet transactions) với cấu trúc đơn giản.

#### Query Parameters:
- `status` (optional): Lọc theo trạng thái (PENDING, COMPLETED, FAILED, etc.)
- `type` (optional): Lọc theo loại giao dịch (RENTAL, DEPOSIT, WALLET_DEPOSIT, etc.)
- `paymentMethod` (optional): Lọc theo phương thức thanh toán (WALLET, MOMO, etc.)
- `startDate` (optional): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (optional): Ngày kết thúc (YYYY-MM-DD)
- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số lượng item mỗi trang (default: 10)
- `sortBy` (optional): Sắp xếp theo field (default: createdAt)
- `sortOrder` (optional): Thứ tự sắp xếp (asc/desc, default: desc)

#### Response:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "685635a1e367a7afdb392784",
        "booking": "68563597e367a7afdb392743",
        "amount": 4500000,
        "type": "RENTAL",
        "status": "COMPLETED",
        "paymentMethod": "WALLET",
        "paymentMetadata": {
          "orderCode": "68563597e367a7afdb392743",
          "paymentMethod": "WALLET",
          "paymentStatus": "COMPLETED",
          "walletId": "6853b99a16c6380278a5e0fb",
          "userId": "6853b99a16c6380278a5e0f5"
        },
        "createdAt": "2025-06-21T04:31:29.415Z",
        "updatedAt": "2025-06-21T04:31:29.415Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTransactions": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Lấy chi tiết giao dịch
**GET** `/api/transactions/:transactionId`

Lấy chi tiết một giao dịch cụ thể.

#### Response:
```json
{
  "success": true,
  "data": {
    "_id": "685635a1e367a7afdb392784",
    "booking": "68563597e367a7afdb392743",
    "amount": 4500000,
    "type": "RENTAL",
    "status": "COMPLETED",
    "paymentMethod": "WALLET",
    "paymentMetadata": {
      "orderCode": "68563597e367a7afdb392743",
      "paymentMethod": "WALLET",
      "paymentStatus": "COMPLETED",
      "walletId": "6853b99a16c6380278a5e0fb",
      "userId": "6853b99a16c6380278a5e0f5"
    },
    "createdAt": "2025-06-21T04:31:29.415Z",
    "updatedAt": "2025-06-21T04:31:29.415Z"
  }
}
```

## Cấu trúc Transaction

### Fields:
- `_id`: ID của transaction
- `booking`: ID của booking (nếu có)
- `amount`: Số tiền giao dịch (VND)
- `type`: Loại giao dịch
  - `RENTAL`: Tiền thuê xe
  - `DEPOSIT`: Tiền cọc
  - `WALLET_DEPOSIT`: Nạp tiền vào ví
  - `WALLET_WITHDRAW`: Rút tiền từ ví
  - `REFUND`: Hoàn tiền
- `status`: Trạng thái giao dịch
  - `PENDING`: Đang chờ xử lý
  - `COMPLETED`: Hoàn thành
  - `FAILED`: Thất bại
  - `CANCELED`: Đã hủy
  - `REFUNDED`: Đã hoàn tiền
- `paymentMethod`: Phương thức thanh toán
  - `WALLET`: Ví điện tử
  - `MOMO`: MoMo
  - `BANK_TRANSFER`: Chuyển khoản
  - `CASH`: Tiền mặt
- `paymentMetadata`: Thông tin chi tiết thanh toán
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật

## Authentication
Tất cả endpoints yêu cầu authentication thông qua JWT token.

## Error Responses
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Usage Examples

### Lấy tất cả giao dịch:
```bash
GET /api/transactions/history
```

### Lọc theo trạng thái:
```bash
GET /api/transactions/history?status=COMPLETED
```

### Lọc theo loại giao dịch:
```bash
GET /api/transactions/history?type=RENTAL
```

### Phân trang:
```bash
GET /api/transactions/history?page=2&limit=20
```

### Lọc theo thời gian:
```bash
GET /api/transactions/history?startDate=2025-01-01&endDate=2025-12-31
``` 