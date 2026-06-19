---
title: "Apache Kafka: เรื่องราวของ Event Streaming"
preset: "google-io-light"
accent: "teal"
transition: "slide"
---
<!-- category: INTRODUCTION | บทนำ -->
<!-- accent: teal -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-story -->

# Apache Kafka
## เรื่องราวของเหตุการณ์ที่ไม่สูญหาย

Slide Deck ภาพอธิบายว่า Kafka เกิดมาทำไม ทำงานอย่างไร และควรคิดภาพมันแบบไหนให้ง่ายที่สุด

- **แก่นเดียว**: Kafka คือไทม์ไลน์ถาวรของเหตุการณ์ทางธุรกิจ
- **ภาพจำง่าย**: แอปหย่อนข้อเท็จจริงลงบนสายพานชื่อหนึ่ง แล้วแอปอื่นอ่านด้วยความเร็วของตัวเอง
- **คำสัญญาหลัก**: Producer กับ Consumer แยกจากกัน, ขยายด้วย Partition, และเก็บข้อมูลซ้ำเพื่อความทนทาน

Note:
เปิดด้วยกรอบที่ง่ายที่สุด: Kafka ไม่ใช่ middleware เวทมนตร์ แต่คือ event log ที่ทนทาน ซึ่งหลายแอปเขียนและอ่านได้อย่างเป็นอิสระ

---
<!-- category: STORY | เรื่องราว -->
<!-- accent: teal -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-story -->

# โลกก่อนมี Kafka
## ทุกแอปต้องคุยกับทุกแอป

- **ความเจ็บปวดแบบจุดต่อจุด**: ระบบสั่งซื้อต้องเรียก inventory, payment, email, analytics, search และ fraud โดยตรง
- **เปลี่ยนช้า**: เพิ่มระบบใหม่หนึ่งตัว แปลว่าต้องแก้ Producer หลายตัว
- **Coupling ที่ซ่อนอยู่**: ถ้า analytics ล่ม flow การสั่งซื้ออาจเปราะบางตามไปด้วย

Note:
เล่าเป็นร้านค้าออนไลน์ที่โตขึ้น ช่วงแรก direct call ใช้ได้ แต่ทุกฟีเจอร์ใหม่เพิ่มเส้นเชื่อมอีกเส้น Kafka เกิดขึ้นเมื่อกราฟของการเชื่อมต่อกลายเป็นปัญหา

---
<!-- category: IDEA | แนวคิด -->
<!-- accent: blue -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-story -->

# Kafka เปลี่ยนรูปทรงระบบ
## ประกาศข้อเท็จจริงครั้งเดียว ใช้ซ้ำได้หลายครั้ง

- **Producer**: เขียน Event เช่น `OrderCreated`
- **Kafka**: เก็บ Event นั้นไว้อย่างทนทานใน Topic
- **Consumer**: inventory, billing, search และ analytics อ่านเมื่อพร้อม

Note:
การเปลี่ยนหลักคือ Producer ไม่ต้องรู้จัก Consumer Producer แค่ประกาศข้อเท็จจริง ส่วน Consumer ไม่ต้องขอให้ Producer เล่าประวัติซ้ำ มันอ่านจากไทม์ไลน์ร่วมกัน

---
<!-- category: EVENT | เหตุการณ์ -->
<!-- accent: lavender -->
<!-- layout: split -->
<!-- diagram: kafka-log -->

# Event คือข้อเท็จจริง
## มีบางอย่างเกิดขึ้นแล้ว

- **Key**: Event นี้เป็นของใครหรืออะไร เช่น `customer-42`
- **Value**: เนื้อหาข้อมูล เช่น `paid $200` หรือ `item shipped`
- **Timestamp**: เวลาที่ Kafka หรือ Producer ระบุว่าเหตุการณ์เกิดขึ้น
- **Headers**: metadata เสริมสำหรับ routing, tracing หรือ schema versioning

Note:
อย่าเรียก Event ว่า Command Command คือการสั่งให้ใครทำบางอย่าง แต่ Event คือการบอกว่าบางอย่างเกิดขึ้นแล้ว

---
<!-- category: TOPICS | หัวข้อข้อมูล -->
<!-- accent: teal -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-partitions -->

# Topic คือไทม์ไลน์ที่มีชื่อ
## Partition คือเลนที่มีลำดับแน่นอน

- **Topic**: ชื่อ stream เชิงตรรกะ เช่น `payments`
- **Partition**: เลนแบบ append-only ที่มีลำดับอยู่ข้างใน Topic
- **Key routing**: Key เดียวกันจะไป Partition เดียวกัน ทำให้รักษาลำดับของ Key นั้นได้

Note:
ใช้ภาพถนนกับเลน Topic คือถนน Partition คือเลน Kafka รับประกันลำดับภายในเลนเดียว ไม่ใช่ทั้งถนนพร้อมกัน

---
<!-- category: LOG | บันทึกต่อท้าย -->
<!-- accent: mint -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-log -->

# Kafka ต่อท้ายข้อมูล
## ไม่เขียนทับอดีต

- **Append-only**: Record ใหม่ถูกเพิ่มท้าย Partition
- **Offset**: แต่ละ Record ได้หมายเลข 0, 1, 2, 3...
- **ตำแหน่งของ Consumer**: Consumer จำ Offset ล่าสุดที่ประมวลผลแล้ว

Note:
นี่คือกลไกหลัก Kafka เข้าใจง่ายและเร็วเพราะ Partition ทำตัวเหมือนไฟล์ที่เขียนต่อท้ายและอ่านด้วย offset

---
<!-- category: CLUSTER | คลัสเตอร์ -->
<!-- accent: blue -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-brokers -->

# Broker เก็บเลนข้อมูล
## Cluster กระจายงานออกไป

- **Broker**: Kafka server หนึ่งตัว
- **Cluster**: Broker หลายตัวทำงานเป็นระบบจัดเก็บเดียว
- **Distribution**: Partition ถูกกระจายไปหลาย Broker เพื่ออ่านและเขียนแบบขนาน

Note:
Broker ไม่ใช่ worker ที่รัน business logic ให้จำแบบน่าเบื่อไว้: มันเก็บ Partition, ตอบ client, และ replicate ข้อมูล

---
<!-- category: PRODUCERS | ผู้ผลิตข้อมูล -->
<!-- accent: teal -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-partitions -->

# Producer เขียน Event
## Key เป็นตัวเลือกเลน

- **ไม่มี Key**: Kafka กระจาย Record เพื่อ throughput ได้
- **มี Key**: Record ที่มี Key เดียวกันจะคงลำดับ เพราะลง Partition เดียวกัน
- **Batching**: Producer มักส่งเป็นชุด ไม่ใช่ยิง network trip เล็ก ๆ ทีละ Event

Note:
Key คือการออกแบบ เลือก Key ให้ตรงกับสิ่งที่ต้องรักษาลำดับ เช่น customer id, order id, account id, vehicle id หรือ device id

---
<!-- category: CONSUMERS | ผู้บริโภคข้อมูล -->
<!-- accent: mint -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-consumers -->

# Consumer อ่านด้วยความเร็วของตัวเอง
## Group แบ่ง Partition กันทำงาน

- **Consumer group**: ทีมของ Consumer ที่ช่วยกันประมวลผล
- **Assignment**: Partition หนึ่งถูกถือโดย Consumer หนึ่งตัวใน Group ณ ช่วงเวลาหนึ่ง
- **Rebalance**: ถ้า Consumer เข้าออก Group ระบบจะกระจาย Partition ใหม่

Note:
พูดตรง ๆ: สาม Partition ทำให้ Consumer สามตัวทำงานพร้อมกันได้ Consumer ตัวที่สี่ใน Group เดียวกันจะว่างถ้าไม่มี Partition เพิ่ม

---
<!-- category: RELIABILITY | ความทนทาน -->
<!-- accent: lavender -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-replication -->

# Replication ทำให้ข้อมูลอยู่รอด
## มี Leader หนึ่งตัว และ Follower ตามหลัง

- **Leader**: รับผิดชอบการอ่านและเขียนของ Partition
- **Follower**: คัดลอกข้อมูลจาก Leader
- **Failover**: ถ้า Broker ที่เป็น Leader ตาย Follower ที่ตามทันสามารถขึ้นมาเป็น Leader แทนได้

Note:
Replication เกิดระดับ Partition เรื่องนี้สำคัญ เพราะ Topic ที่มีหลาย Partition จะมี Leader หลายตัวกระจายอยู่ใน Cluster

---
<!-- category: REPLAY | เล่นซ้ำ -->
<!-- accent: teal -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-retention -->

# การอ่านไม่ได้ลบข้อมูล
## Replay คือพลังพิเศษ

- **Retention**: Kafka เก็บ Event ตามเวลาหรือขนาดที่ตั้งไว้
- **Replay**: Service ใหม่เริ่มอ่านจาก Offset เก่าเพื่อสร้าง state ใหม่ได้
- **Backfill**: Analytics ประมวลผลประวัติซ้ำได้หลังแก้โค้ด

Note:
Queue แบบเดิมมักลบ message หลังถูกอ่าน Kafka เก็บ Event จนกว่า retention จะลบ จึงทำให้ Consumer หลายตัวอ่านประวัติเดียวกันได้อย่างอิสระ

---
<!-- category: WHY | ทำไมถึงใช้ -->
<!-- accent: blue -->
<!-- layout: grid -->
<!-- diagram: kafka-story -->

# ทำไมทีมถึงใช้ Kafka
## มันเปลี่ยน integration ให้เป็น event backbone ร่วมกัน

### Pipeline แบบ Real-time
ย้ายข้อเท็จจริงจากระบบปฏิบัติการไป analytics, search, ML, monitoring และ data lake อย่างรวดเร็ว

### Service แบบ Event-driven
ให้ Service ตอบสนองต่อเหตุการณ์ทางธุรกิจ โดยไม่ต้องเรียก Service อื่นทุกตัวโดยตรง

### Buffer ที่ทนทาน
รับแรงกระชากเมื่อ Producer เร็วกว่า Consumer

### Replay ระบบ
สร้าง projection ใหม่ แก้บั๊ก และประมวลผลข้อมูลเก่าจาก Event ที่ยังถูกเก็บไว้

Note:
เน้นว่า Kafka มีประโยชน์เมื่อ Event มีค่ามากกว่าการส่งให้ Consumer ตัวเดียวในทันที

---
<!-- category: TRADEOFFS | ข้อควรระวัง -->
<!-- accent: lavender -->
<!-- layout: grid -->
<!-- diagram: kafka-brokers -->

# เมื่อ Kafka ใหญ่เกินโจทย์
## ไม่ใช่ทุก Message ต้องใช้ทางด่วน

### แอปเล็กมาก
ตารางฐานข้อมูลกับ job ตัวหนึ่งอาจง่ายกว่า

### Request-response
Kafka ไม่ใช่ตัวแทนของ synchronous API เมื่อผู้ใช้กำลังรอคำตอบทันที

### ออกแบบ Event ไม่ชัด
Schema แย่และ ownership ไม่ชัด จะสร้างไทม์ไลน์รกแบบถาวร

### ต้นทุนปฏิบัติการ
Cluster ต้องมี capacity planning, monitoring, upgrade และการตัดสินใจเรื่อง retention

Note:
สไลด์นี้กันการใช้ Kafka แบบตามกระแส Kafka ทรงพลังเพราะมันเก็บประวัติ แต่นั่นแปลว่าความผิดพลาดก็ทนทานตามไปด้วย

---
<!-- category: SUMMARY | สรุป -->
<!-- accent: teal -->
<!-- layout: interactive-diagram -->
<!-- diagram: kafka-retention -->

# Mental model
## Kafka คือ event log ร่วมกันที่ทนทาน

- **Write**: Producer ต่อท้ายข้อเท็จจริงลง Topic
- **Store**: Broker บันทึกและ replicate Partition
- **Read**: Consumer ติดตาม Offset และประมวลผลด้วยความเร็วของตัวเอง
- **Scale**: Partition เพิ่มเลนขนานให้ระบบ
- **Recover**: Retention ทำให้ Replay ได้จนกว่า Event เก่าจะหมดอายุ

Note:
ปิดด้วยประโยคเดียว: Kafka ทำงานได้เพราะมันแยกการเขียน การเก็บ และการอ่านออกจากกัน พร้อมทำให้ไทม์ไลน์ของ Event ทนทานและถูกแบ่งเป็น Partition

---
<!-- category: SOURCES | แหล่งข้อมูล -->
<!-- accent: blue -->
<!-- layout: grid -->
<!-- diagram: kafka-log -->

# ข้อเท็จจริงจากแหล่งอ้างอิง
## บันทึกงานวิจัยสำหรับ Deck นี้

### บทนำ Apache Kafka
Kafka คือ event streaming platform ที่ publish, store และ process stream ของ Event แบบ distributed, scalable และ fault-tolerant

### แนวคิดหลัก
เอกสารทางการนิยาม Event, Producer, Consumer, Topic, Partition, Key, ลำดับภายใน topic-partition และ replication

### Consumer group
Kafka client ประมวลผล stream แบบขนาน และ Partition คือหน่วยที่ทำให้การอ่านและเขียนขนานกันได้

### Retention และ Replay
Event ไม่ถูกลบหลัง Consumer หนึ่งตัวอ่านจบ นโยบาย retention เป็นตัวกำหนดว่า Event เก่าจะถูกลบเมื่อไร

Note:
แหล่งหลัก: https://kafka.apache.org/intro/ ตรวจซ้ำกับ Apache Kafka documentation และสรุปสถาปัตยกรรมทั่วไปแบบ Confluent-style
