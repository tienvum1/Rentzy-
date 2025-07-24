import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaPaperPlane, FaComments } from "react-icons/fa";

const ChatChooseCar = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "admin",
      text: "Chào bạn! Bạn muốn tìm loại xe nào?",
      timestamp: new Date("2025-07-24T09:00:00"),
    },
    {
      id: 2,
      sender: "user",
      text: "Mình cần xe 7 chỗ cho gia đình đi Đà Lạt.",
    },
    {
      id: 3,
      sender: "admin",
      text: "Bạn muốn thuê từ ngày nào đến ngày nào?",
    },
    {
      id: 4,
      sender: "user",
      text: "Từ 1/8 đến 5/8.",
    },
    {
      id: 5,
      sender: "admin",
      text: "Xe phù hợp: Toyota Fortuner, giá 1.200.000đ/ngày. Bạn muốn đặt không?",
      timestamp: new Date("2025-07-24T09:03:00"),
    },
    {
      id: 5,
      sender: "admin",
      text: "Xe phù hợp: Toyota Fortuner, giá 1.asd200.000đ/ngày. Bạn muốn đặt không?",
      timestamp: new Date("2025-07-24T09:03:00"),
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = () => {};

  return (
    <>
      {/* Button nổi */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 32,
          bottom: 120,
          zIndex: 1000,
          background: "#6366f1",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 60,
          height: 60,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          cursor: "pointer",
        }}
      >
        <FaComments />
      </button>

      {/* Popup chat */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 32,
            bottom: 120,
            zIndex: 1001,
            width: 360,
            maxWidth: "95vw",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
            overflow: "hidden",
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            height: 480,
          }}
        >
          {/* Header */}
          <div
            style={{
              height: 56,
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              background: "#f3f4f6",
              minHeight: 56,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={
                  "https://static.vecteezy.com/system/resources/previews/036/280/651/original/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg"
                }
                alt={"chatAI"}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #e5e7eb",
                }}
              />

              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>ChatAI</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                color: "#888",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
          </div>

          {/* Nội dung chat */}
          <div
            style={{
              flex: 1,
              padding: "16px 12px",
              overflowY: "auto",
              background: "#f9fafb",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    background: msg.sender === "user" ? "#6366f1" : "#e5e7eb",
                    color: msg.sender === "user" ? "#fff" : "#111827",
                    padding: "10px 14px",
                    borderRadius: 16,
                    maxWidth: "70%",
                    wordWrap: "break-word",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Nhập tin nhắn */}
          <div
            style={{
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid #e5e7eb",
              background: "#fff",
              padding: 12,
              gap: 8,
            }}
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                background: "#f3f4f6",
              }}
              placeholder="Nhập tin nhắn..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                opacity: newMessage.trim() ? 1 : 0.7,
              }}
              disabled={!newMessage.trim() || loading}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatChooseCar;
