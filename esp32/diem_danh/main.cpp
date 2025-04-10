#include <FS.h>
#include <SPIFFS.h>
#include <LiquidCrystal_I2C.h>
#include "wifi_module.h"
#include "rfid_module.h"
#include "lcd_module.h"
#include "http_module.h"

const char* ssid = "my wifi";
const char* password = "my password";
const char* serverUrl = "http://mypublicserver/diem_danh_project/api.php";
String apiKey;

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setupMain() {
  Serial.begin(115200);

  // Khởi tạo SPIFFS và đọc API Key
  if (!SPIFFS.begin(true)) {
    Serial.println("Lỗi khởi tạo SPIFFS");
    while (true);
  }
  File file = SPIFFS.open("/api_key.txt", "r");
  if (!file) {
    Serial.println("Không mở được file api_key.txt");
    while (true);
  }
  apiKey = file.readStringUntil('\n');
  file.close();
  apiKey.trim();
  Serial.println("API Key: " + apiKey);

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
  sendAttendanceData(serverUrl, apiKey.c_str(), rfid_uid.c_str(), room.c_str(), lcd);

  delay(3000);
}