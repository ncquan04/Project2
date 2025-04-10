#include "lcd_module.h"
#include <Arduino.h>

void setupLCD(LiquidCrystal_I2C& lcd) {
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("HE THONG");
  lcd.setCursor(0, 1);
  lcd.print("DIEM DANH RFID");
  delay(2000);
}

void displayLCD(LiquidCrystal_I2C& lcd, const char* title, const char* message) {
  lcd.clear();
  
  // Xử lý tiêu đề
  int titleLen = strlen(title);
  if (titleLen > 16) {
    titleLen = 16;
  }
  int titlePos = (16 - titleLen) / 2;
  lcd.setCursor(titlePos, 0);
  lcd.print(title);
  
  // Xử lý thông điệp
  int messageLen = strlen(message);
  if (messageLen <= 16) {
    lcd.setCursor(0, 1);
    lcd.print(message);
  } else {
    // Hiển thị 16 ký tự đầu tiên
    lcd.setCursor(0, 1);
    for (int i = 0; i < 16; i++) {
      lcd.print(message[i]);
    }
    delay(1000);
    
    // Cuộn thông điệp
    for (int i = 1; i <= messageLen - 16; i++) {
      lcd.setCursor(0, 1);
      for (int j = 0; j < 16; j++) {
        lcd.print(message[i + j]);
      }
      delay(300);
    }
  }
}