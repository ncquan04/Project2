#include "http_module.h"
#include "lcd_module.h" // Giả sử bạn có hàm displayLCD trong lcd_module.h
#include <WiFi.h>

void sendAttendanceData(const char* serverUrl, const char* rfid_uid, const char* room, LiquidCrystal_I2C& lcd) {
  // Chuẩn bị dữ liệu JSON
  char jsonBuffer[128];
  snprintf(jsonBuffer, sizeof(jsonBuffer), "{\"rfid_uid\":\"%s\",\"room\":\"%s\"}", rfid_uid, room);

  Serial.println("=== SENDING REQUEST ===");
  Serial.println("URL: " + String(serverUrl));
  Serial.println("Data: " + String(jsonBuffer));
  Serial.println("WiFi Status: " + String(WiFi.status()));
  Serial.println("WiFi RSSI: " + String(WiFi.RSSI()));
  Serial.println("Local IP: " + WiFi.localIP().toString());
  Serial.println("Gateway IP: " + WiFi.gatewayIP().toString());
  Serial.println("DNS IP: " + WiFi.dnsIP().toString());

  HTTPClient http;
  
  // Thêm debug cho quá trình kết nối
  Serial.println("Initializing HTTP client...");
  if (!http.begin(serverUrl)) {
    Serial.println("Failed to initialize HTTP client");
    displayLCD(lcd, "LOI", "INIT HTTP FAIL");
    return;
  }
  
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // Giảm timeout xuống 5 giây

  Serial.println("Sending POST request...");
  unsigned long startTime = millis();
  int httpCode = http.POST(jsonBuffer);
  unsigned long endTime = millis();
  
  Serial.println("Request took " + String(endTime - startTime) + "ms");
  Serial.println("HTTP Response Code: " + String(httpCode));
  
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
        
        // Lấy status từ response
        const char* status = doc["status"].as<const char*>();
        String statusText;
        
        // Xác định text hiển thị dựa trên status
        if (strcmp(status, "present") == 0) {
            statusText = "DUNG GIO";
        } else if (strcmp(status, "late") == 0) {
            statusText = "DI MUON";
        } else {
            statusText = "KHONG HOP LE";
        }
        
        // Hiển thị tên và mã sinh viên
        snprintf(displayText, sizeof(displayText), "%s\n%s", doc["full_name"].as<const char*>(), doc["student_id"].as<const char*>());
        displayLCD(lcd, statusText.c_str(), displayText);
        
        // Log thông tin status
        Serial.println("Status: " + statusText);
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
    Serial.println("Error: " + http.errorToString(httpCode));
    Serial.println("Error Code: " + String(httpCode));
    Serial.println("WiFi Status: " + String(WiFi.status()));
    Serial.println("WiFi RSSI: " + String(WiFi.RSSI()));
    displayLCD(lcd, "LOI", "MAT KET NOI");
  }

  http.end();
  Serial.println("=== REQUEST COMPLETED ===\n");
}