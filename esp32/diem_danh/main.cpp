#include <SPI.h>
#include <LiquidCrystal_I2C.h>
#include "wifi_module.h"
#include "rfid_module.h"
#include "lcd_module.h"
#include "http_module.h"
const char* ssid = "Dzung Nguyen";
const char* password = "banoidunggaynuaa";
const char* serverUrl = "http://172.20.10.3/server_diem_danh/api/esp32/esp32_api.php";

LiquidCrystal_I2C lcd(0x27, 16, 2);
void setupMain() {
  Serial.begin(115200);
  // Khởi tạo RFID
  setupRFID();
  // Kết nối WiFi
  setupWiFi(ssid, password);
  // Khởi tạo LCD
  setupLCD(lcd);
}
void loopMain() {
  if (!checkWiFiConnection()) {
    return;
  }
  String rfid_uid = readRFID();
  if (rfid_uid.isEmpty()) {
    delay(100);
    return;
  }
  String room = "P501";
  sendAttendanceData(serverUrl, rfid_uid.c_str(), room.c_str(), lcd);
  delay(3000);
}
