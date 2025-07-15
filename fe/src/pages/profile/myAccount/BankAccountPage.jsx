import React, { useState, useEffect } from "react";
import axios from "axios";

const BankAccountPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    accountNumber: "",
    bankName: "",
    accountHolder: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("/api/user/bank-account");
      setAccounts(res.data.accounts || []);
    } catch (err) {
      setError("Không thể tải danh sách tài khoản ngân hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.accountNumber || !form.bankName || !form.accountHolder) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    try {
      setLoading(true);
      await axios.post("/api/user/bank-account", form);
      setSuccess("Thêm tài khoản thành công!");
      setForm({ accountNumber: "", bankName: "", accountHolder: "" });
      fetchAccounts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể thêm tài khoản ngân hàng."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
      <h2 style={{ marginBottom: 24 }}>Quản lý tài khoản ngân hàng</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <label>Số tài khoản</label>
          <input
            type="text"
            name="accountNumber"
            value={form.accountNumber}
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Tên ngân hàng</label>
          <input
            type="text"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Chủ tài khoản</label>
          <input
            type="text"
            name="accountHolder"
            value={form.accountHolder}
            onChange={handleChange}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          style={{ padding: "8px 24px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4 }}
          disabled={loading}
        >
          Thêm tài khoản
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
        {success && <div style={{ color: "green", marginTop: 12 }}>{success}</div>}
      </form>
      <h3>Danh sách tài khoản đã thêm</h3>
      {loading ? (
        <div>Đang tải...</div>
      ) : accounts.length === 0 ? (
        <div>Chưa có tài khoản nào.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Số tài khoản</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Tên ngân hàng</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Chủ tài khoản</th>
              <th style={{ borderBottom: "1px solid #eee", padding: 8 }}>Ngày thêm</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, idx) => (
              <tr key={idx}>
                <td style={{ padding: 8 }}>{acc.accountNumber}</td>
                <td style={{ padding: 8 }}>{acc.bankName}</td>
                <td style={{ padding: 8 }}>{acc.accountHolder}</td>
                <td style={{ padding: 8 }}>{acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BankAccountPage; 