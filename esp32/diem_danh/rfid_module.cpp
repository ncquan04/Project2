#include "rfid_module.h"

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Khởi tạo MFRC522 với chân SS và RST

void setupRFID() {
  SPI.begin();          // Khởi động giao thức SPI
  mfrc522.PCD_Init();   // Khởi động module MFRC522
  Serial.println("RFID Ready");  // Thông báo module đã sẵn sàng
}

String readRFID() {
  // Kiểm tra xem có thẻ mới được đặt gần module không
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return "";  // Không có thẻ, trả về chuỗi rỗng
  }
  
  // Đọc dữ liệu từ thẻ
  if (!mfrc522.PICC_ReadCardSerial()) {
    return "";  // Không đọc được, trả về chuỗi rỗng
  }
  
  // Chuyển UID thành chuỗi HEX
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i], HEX);  // Ghép từng byte của UID
  }
  
  // Dừng quá trình đọc thẻ
  mfrc522.PICC_HaltA();
  
  return uid;  // Trả về UID dạng chuỗi (ví dụ: "1a2b3c4d")
}