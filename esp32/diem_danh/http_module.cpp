#include "http_module.h"
#include "lcd_module.h" // Giả sử bạn có hàm displayLCD trong lcd_module.h

void sendAttendanceData(const char* serverUrl, const char* apiKey, const char* rfid_uid, const char* room, LiquidCrystal_I2C& lcd) {
  // Chuẩn bị dữ liệu JSON
  char jsonBuffer[128];
  snprintf(jsonBuffer, sizeof(jsonBuffer), "{\"rfid_uid\":\"%s\",\"room\":\"%s\"}", rfid_uid, room);

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);

  http.setTimeout(5000); // Giảm timeout xuống 5 giây
  int httpCode = http.POST(jsonBuffer);
  
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) { // 200
      String response = http.getString();
      Serial.println("Server Response: " + response);

      DynamicJsonDocument doc(256);
      DeserializationError error = deserializeJson(doc, response);

      if (error) {
        Serial.println("=== LỖI PARSING JSON ===");
        Serial.println(error.c_str());
        displayLCD(lcd, "LOI", "LOI JSON");
      } else if (doc.containsKey("error")) {
        Serial.println("=== LỖI ===");
        Serial.println(doc["error"].as<const char*>());
        displayLCD(lcd, "LOI", doc["error"].as<const char*>());
      } else if (doc.containsKey("full_name")) {
        Serial.println("=== KẾT QUẢ ===");
        char displayText[33]; // Giới hạn 32 ký tự cho LCD 16x2
        snprintf(displayText, sizeof(displayText), "%s\n%s", doc["full_name"].as<const char*>(), doc["student_id"].as<const char*>());
        displayLCD(lcd, "THANH CONG", displayText);
      } else {
        Serial.println("=== DỮ LIỆU KHÔNG HỢP LỆ ===");
        displayLCD(lcd, "LOI", "DL KHONG HOP LE");
      }
    } else {
      // Xử lý lỗi HTTP cụ thể
      Serial.print("=== LỖI HTTP: ");
      Serial.println(httpCode);
      if (httpCode == 404) {
        displayLCD(lcd, "LOI", "KHONG TIM THAY");
      } else if (httpCode == 500) {
        displayLCD(lcd, "LOI", "LOI SERVER");
      } else {
        displayLCD(lcd, "LOI", "LOI HTTP");
      }
    }
  } else {
    Serial.println("=== LỖI KẾT NỐI ===");
    Serial.println(http.errorToString(httpCode).c_str());
    displayLCD(lcd, "LOI", "MAT KET NOI");
  }

  http.end();
}