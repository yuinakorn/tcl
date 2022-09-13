# TCL API

ดาวน์โหลด app ด้วยคำสั่ง


```git
git clone
```


เปลี่ยนชื่อไฟล์ env.example เป็น .env

```bash
mv env.example .env
```

เปลี่ยนค่าในไฟล์ .env ให้ตรงกับของคุณ

```bash
nano .env
```

ติดตั้ง package ที่จำเป็น

```bash
npm install
```

ติดตั้ง pm2

```bash
npm install pm2 -g
```

เริ่มต้น api

```bash
pm2 start server.js
```

ตรวจสอบสถานะ api

```bash
pm2 list
```
