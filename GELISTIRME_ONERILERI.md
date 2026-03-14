# ArchitectAI — Geliştirme ve İyileştirme Önerileri

Projeyi daha iyi hale getirmek için öneriler, öncelik sırasına göre gruplandı.

---

## 1. Kod yapısı ve sürdürülebilirlik

| Öneri | Açıklama |
|-------|----------|
| **Dosyayı böl** | `architekai.tsx` ~800 satır; bileşenleri `src/components/` altında modüllere böl (örn. `FloorPlan.tsx`, `Building3D.tsx`, `EnergySimulation.tsx`, `constants.ts`, `theme.ts`). Bakım ve test kolaylaşır. |
| **Ortak tema** | `gold`, `brd`, `card`, `bg` vb. tek yerde (örn. `theme.ts` veya CSS değişkenleri) topla; koyu/açık tema tek yerden yönetilsin. |
| **API katmanı** | Tüm `fetch("https://api.anthropic.com/...")` çağrılarını tek bir `api.ts` (veya `useAnthropic` hook) içinde topla. Hata yönetimi, retry ve API key tek noktadan yönetilir. |
| **Tip tanımları** | Proje verisi için `ProjectData`, AI yanıtları için arayüzler (örn. `AIConceptResult`) tanımla; TypeScript ile hata oranı azalır. |

---

## 2. Kullanıcı deneyimi (UX)

| Öneri | Açıklama |
|-------|----------|
| **Sekmeleri grupla** | 31 sekme uzun; "Çizimler", "Analiz", "AI", "Maliyet" gibi gruplara ayırıp alt sekmeler veya yan menü ile göster. |
| **Proje kaydetme** | `localStorage` veya basit bir backend ile projeyi kaydet/yükle; kullanıcı aynı projeye dönebilsin. |
| **PDF / dışa aktarma** | Teklif, özet veya seçili çizimleri PDF olarak indirme (jsPDF veya tarayıcı yazdır → PDF). |
| **Responsive** | Sol panel + sağ içerik mobilde üst/alt veya açılır panel olacak şekilde düzenle; sekmeler kaydırılabilir veya dropdown yap. |
| **Yükleme ve hata** | AI çağrılarında net loading göstergesi; API hata/limit durumunda kullanıcıya anlaşılır mesaj (örn. "API anahtarı gerekli" / "Kota aşıldı"). |
| **Klavye kısayolları** | Örn. Adım ileri/geri (ok tuşları), sekme değiştirme; erişilebilirlik ve hız artar. |

---

## 3. Yeni / güçlendirilmiş özellikler

| Öneri | Açıklama |
|-------|----------|
| **Gerçek görsel AI** | Claude yerine/ek olarak görsel üreten API (OpenAI DALL·E, Replicate, Stability) ile "Render" sekmesinde konsept görseli üret; mevcut MJ prompt’u bu API’ye de beslenebilir. |
| **Kat planı düzenleme** | SVG kat planında oda boyutlarını sürükleyerek değiştirme, duvar ekleme; en azından basit bir "grid’de oda böl" editörü. |
| **3D iyileştirme** | Three.js sahnesinde malzeme/renk seçimi, basit güneş açısı, gölge; export (PNG/glb) ile paylaşım. |
| **Karşılaştırma modu** | İki proje veya iki varyasyonu (maliyet, enerji, alan) yan yana göster; mevcut "Karşılaştır" metnini işlevsel hale getir. |
| **Sunum modu** | Tam ekran, adım adım akış (konsept → plan → 3D → maliyet); müşteri sunumu için tek tıkla geçiş. |
| **Daha fazla şehir/veri** | İklim, deprem, maliyet çarpanı için daha fazla şehir; mümkünse harita ile lokasyon seçimi. |
| **Birim seçimi** | m² / ft², TL / USD / EUR; tüm maliyet ve alan alanları bu birime göre gösterilsin. |

---

## 4. Performans

| Öneri | Açıklama |
|-------|----------|
| **Code splitting** | Sekme bazlı lazy load: `const Building3D = lazy(() => import('./Building3D'))`; ilk yükleme ve bundle boyutu azalır. |
| **3D lazy init** | Three.js sahnesi sadece "3D" veya "Animasyon" sekmesi açıldığında yüklensin; ilk açılış hızlanır. |
| **Recharts** | Sadece kullanılan grafik bileşenlerini import et; tree-shaking ile bundle küçülür. |

---

## 5. Erişilebilirlik ve kalite

| Öneri | Açıklama |
|-------|----------|
| **Semantik HTML** | Butonlar, başlıklar, form alanları için uygun etiketler; gerekirse `aria-*` ile anlamlı isimlendirme. |
| **Kontrast** | Metin/arka plan oranı WCAG AA’ya uygun olsun; özellikle `sub` ve `txt` renkleri. |
| **Hata sınırları** | Kritik bileşenler (örn. 3D, AI sonuçları) Error Boundary ile sarılsın; bir sekme çökünce tüm uygulama kapanmasın. |
| **Temel testler** | Maliyet hesabı, `calcCost`, proje verisi güncelleme gibi saf fonksiyonlar için unit test (Vitest); regresyon azalır. |

---

## 6. Backend / kalıcılık (ileri adım)

| Öneri | Açıklama |
|-------|----------|
| **Proje CRUD** | Supabase, Firebase veya küçük bir Node/Express API ile proje kaydetme, listeleme, silme. |
| **Kullanıcı hesabı** | Giriş ile projelerin kullanıcıya bağlanması; API key’i backend’de tutup frontend’e güvenli proxy. |
| **Ortak çalışma** | Proje linki paylaşma veya "canlı" ortak düzenleme (WebSocket / CRDT) ileride eklenebilir. |

---

## Öncelik sırası (kısa)

1. **Hemen:** API katmanı + hata/loading mesajları, projeyi `localStorage`’a kaydetme.
2. **Kısa vadede:** Sekmeleri gruplama, responsive düzen, PDF dışa aktarma.
3. **Orta vadede:** Dosya bölme + tema, code splitting, 3D/gerçek görsel iyileştirme.
4. **Uzun vadede:** Backend, kullanıcı hesabı, kat planı düzenleme.

Bu dosyayı proje kökünde referans olarak kullanabilirsin; hangi maddeden başlamak istediğini söylersen, o kısım için somut kod örnekleri yazabilirim.
