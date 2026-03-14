# ArchitectAI — Faz 2 Geliştirme Önerileri

Projenin mevcut hali (API katmanı, kaydet/yükle, sekme grupları, yazdır, Error Boundary) dikkate alınarak **bir sonraki adımlar** için öneriler.

---

## ✅ Tamamlananlar (referans)

- Merkezi API katmanı (`api.ts`) — ana "AI ile Üret" akışı
- Proje kaydetme/yükleme (localStorage)
- Sekme grupları (Çizimler / Analiz / AI & Maliyet)
- Yazdır / PDF (tarayıcı yazdır + `.no-print`)
- TabErrorBoundary (sekme hatalarında uygulama çökmez)

---

## 1. Hemen yapılabilecekler (düşük efor)

### 1.1 Tüm AI çağrılarını `api.ts` üzerinden geçir

Şu an **8 yerde** hâlâ doğrudan `fetch("https://api.anthropic.com/...")` kullanılıyor; API key ve hata mesajları tutarsız:

| Bileşen / yer        | Satır (yaklaşık) | Öneri |
|----------------------|------------------|--------|
| ArchMasterEngine     | ~66              | `anthropicChat()` + `parseJsonSafe()` |
| CompetitionGen       | ~271             | Aynı |
| ParametricForms      | ~347             | Aynı |
| NLPWizard            | ~375             | Aynı |
| AIReview             | ~608             | Aynı |
| CostNeg (maliyet chat)| ~663            | `anthropicChat()` (JSON parse gerekmez) |
| AIChat               | ~676             | Aynı |
| AIAlts               | ~695             | Aynı |

**Fayda:** Tek noktadan API key kontrolü, "API anahtarı gerekli" / "Kota aşıldı" gibi kullanıcı dostu mesajlar, retry veya rate limit eklemek kolaylaşır.

### 1.2 API key uyarısı

- `hasApiKey()` zaten var; header veya ilk AI butonunda "API anahtarı tanımlı değil" uyarısı göster.
- Ayarlar veya `.env` açıklaması için küçük bir "API Anahtarı" bölümü (sadece bilgi, key input opsiyonel).

### 1.3 Loading ve hata durumları

- Tüm AI butonlarında tutarlı loading (spinner veya "Yükleniyor..."); bazıları var, bazıları yok.
- Hata olduğunda kullanıcıya kısa mesaj (toast veya inline) göster; "Hata." yerine "Bağlantı hatası. API anahtarınızı kontrol edin." gibi.

### 1.4 Yazdırma stilleri

- `index.html` içinde sadece `.no-print` var; `@media print` ile sayfa düzeni (margins, font-size, tek sayfaya sığdırma) iyileştirilebilir.
- İsteğe bağlı: "Sadece bu sekmeyi yazdır" seçeneği.

---

## 2. Kısa vadede (orta efor)

### 2.1 Dosyayı bölme (modüler yapı)

- `architekai.tsx` tek dosyada ~800+ satır; bakım ve test zor.
- Önerilen bölümler:
  - `src/constants.ts` — PALETTES, TYPES, STYLES, MATS, MCOST, LMUL, EQZ, STEPS, TMPLS, RTABS, TAB_GROUPS, I18N, ARCH_MASTERS, RMAP, CLIMATE_CITIES, vb.
  - `src/theme.ts` — gold, brd, card, bg, sub, txt, BG_BLUEPRINT (ve ileride açık/koyu tema).
  - `src/components/` — FloorPlan, Building3D, AnimBuilding, Moodboard, EnergySimulation, Accessibility, ArchMasterEngine, CompetitionGen, ParametricForms, NLPWizard, AIReview, CostNeg, AIChat, AIAlts, vb. (her biri kendi dosyası veya mantıksal gruplar).
  - `src/App.tsx` — sadece wizard adımları, sekme seçimi, state ve layout.
- Böylece lazy load ve test yazmak kolaylaşır.

### 2.2 Tema tek yerde

- Renkler ve border radius şu an sabit string; `theme.ts` (veya CSS değişkenleri) ile topla.
- İleride açık tema / blueprint modu tek yerden değişsin.

### 2.3 Tip tanımları

- Proje verisi: `ProjectData` (type, area, plot, floors, rooms, loc, budget, style, mats, lights, sus, master, vb.).
- AI cevapları: `AIConceptResult`, `ArchMasterResult`, `CompetitionResult`, vb.
- `api.ts` dönüş tipleri ve bileşen props’ları buna göre netleşir; TypeScript hataları azalır.

### 2.4 Responsive

- Sol panel + sağ içerik mobilde üst/alt veya açılır (drawer) yapı.
- Sekmeler: yatay scroll veya dropdown.
- 3D ve SVG viewBox’ların küçük ekranda okunaklı kalması.

### 2.5 Klavye kısayolları

- Adım ileri/geri (örn. ok tuşları veya Alt+→/←).
- İsteğe bağlı: sekme değiştirme (Ctrl+1, Ctrl+2, …).

---

## 3. Orta vadede (yeni özellikler)

### 3.1 Gerçek görsel AI

- Render sekmesinde sadece metin (MJ prompt) var; DALL·E, Replicate veya Stability API ile gerçek görsel üretimi.
- Mevcut MJ prompt’u bu API’lere input olarak kullanılabilir.

### 3.2 Kat planı düzenleme

- SVG kat planında oda boyutlarını sürükleyerek değiştirme, basit duvar/oda ekleme.
- En azından grid tabanlı "oda böl" editörü.

### 3.3 3D iyileştirme

- Malzeme/renk seçimi, güneş açısı, gölge.
- Export: PNG veya glb ile paylaşım.

### 3.4 Karşılaştırma modu

- İki proje veya iki varyasyonu (maliyet, enerji, alan) yan yana göster.
- "Karşılaştır" butonunu bu moda bağla.

### 3.5 Sunum modu

- Tam ekran, adım adım (konsept → plan → 3D → maliyet); tek tıkla geçiş.

### 3.6 Birim seçimi

- m² / ft², TL / USD / EUR; tüm maliyet ve alan alanları seçilen birime göre gösterilsin.

### 3.7 Daha fazla şehir / lokasyon

- İklim, deprem, maliyet çarpanı için daha fazla şehir; ileride harita ile lokasyon seçimi.

---

## 4. Performans

### 4.1 Code splitting (lazy load)

- Sekme bazlı: `const Building3D = lazy(() => import('./components/Building3D'))`.
- İlk yükleme ve bundle boyutu azalır; build uyarısı ("Some chunks are larger than 500 kB") giderilir.

### 4.2 3D lazy init

- Three.js sahnesi sadece "3D" veya "Animasyon" sekmesi açıldığında mount edilsin; ilk açılış hızlanır.

### 4.3 Recharts

- Sadece kullanılan grafik bileşenlerini import et; tree-shaking ile bundle küçülür.

---

## 5. Kalite ve erişilebilirlik

### 5.1 Semantik HTML ve aria

- Butonlar, başlıklar, form alanları uygun etiketlerle; gerekirse `aria-label`, `aria-expanded`.

### 5.2 Kontrast

- Metin/arka plan WCAG AA’ya uygun; özellikle `sub` ve `txt` renkleri.

### 5.3 Unit testler

- `calcCost`, proje verisi güncelleme, `parseJsonSafe` gibi saf fonksiyonlar için Vitest.
- Regresyon azalır, refactoring güvenli hale gelir.

---

## 6. İleri adım (backend / kalıcılık)

### 6.1 Proje CRUD (bulut)

- Supabase, Firebase veya küçük Node/Express API ile proje kaydetme, listeleme, silme.
- localStorage’a ek veya alternatif olarak.

### 6.2 Kullanıcı hesabı

- Giriş ile projelerin kullanıcıya bağlanması.
- API key’i backend’de tutup frontend’e güvenli proxy (isteğe bağlı).

### 6.3 Ortak çalışma

- Proje linki paylaşma veya canlı ortak düzenleme (WebSocket / CRDT) — uzun vadeli.

---

## Öncelik özeti

| Öncelik | Ne yapılır | Neden |
|--------|------------|--------|
| 1      | Tüm AI çağrılarını `api.ts`’e taşı + API key uyarısı | Tutarlı hata/loading, güvenlik |
| 2      | Loading/hata mesajlarını netleştir | UX |
| 3      | Dosyayı böl + tema + tipler | Sürdürülebilirlik, test |
| 4      | Responsive + yazdırma iyileştirme | Kullanım (mobil, PDF) |
| 5      | Code splitting + 3D lazy | Performans |
| 6      | Görsel AI, kat planı editörü, karşılaştırma | Özellik zenginliği |

Hangi maddeden başlamak istediğini söylersen, o kısım için somut kod örnekleri (patch’ler) yazabilirim.
