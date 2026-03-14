# ArchitectAI — AI Mimari Tasarım Platformu

Mimarlar için yapay zeka destekli tek sayfa uygulama: tüm çizimler, tasarımlar, 3D, maliyet, enerji, BIM, yarışma konsepti ve daha fazlası tek yerde.

## Özellikler

- **Proje sihirbazı**: Tip (villa, ofis, otel, kafe…), alan, kat, oda, lokasyon, bütçe, stil, malzeme, sürdürülebilirlik
- **Doğal dil (NLP)**: Türkçe cümle ile proje parametrelerini otomatik doldurma
- **Çizimler & tasarımlar**:
  - Konsept (AI özet)
  - Kat planı (Blueprint modu)
  - Moodboard (renk paleti, dokular)
  - 3D bina (Three.js, sürükleyerek döndürme)
  - İnşaat animasyonu
  - Cephe tasarımı
  - Kesit
  - Peyzaj planı
  - Yangın tahliye planı
  - Teknik çizim (ölçek, aks)
  - Erişilebilirlik (skor + kontrol listesi)
- **Hesaplamalar & raporlar**:
  - Maliyet (min/max, m², dağılım)
  - Enerji simülasyonu (EKB sınıfı, aylık tüketim/üretim)
  - Karbon ayak izi (malzeme bazlı, ağaç denkleştirme)
  - ROI / geri dönüş
  - İnşaat takvimi (fazlar)
- **AI modülleri** (Claude API):
  - Mimar stili analizi (Zaha Hadid, Tadao Ando, Le Corbusier…)
  - Parametrik form alternatifleri
  - Yarışma projesi üretici (tema, konsept, jüri özeti, MJ prompt)
  - AI eleştiri (güçlü/zayıf, öneriler, not)
  - Alternatif varyasyonlar (lüks, eko, minimal, bütçe)
  - Maliyet müzakere chat
  - Genel mimari danışman chat
- **Diğer**: BIM Lite (aks/kolon), şehir ölçeği planlama, iklim analizi, güneş simülasyonu, mobilya yerleşimi, deprem riski

## Kurulum

```bash
npm install
```

## Ortam değişkeni (AI özellikleri için)

AI ile üretim, mimar stili, yarışma, eleştiri, chat vb. için [Anthropic](https://console.anthropic.com/) API anahtarı gerekir.

Proje kökünde `.env` oluşturun:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Anahtarı asla repoya eklemeyin; `.env` dosyası `.gitignore` içinde olmalıdır. İsterseniz anahtarı uygulama içinde (üstteki alandan) bir kez girip kaydedebilirsiniz; tarayıcıda saklanır.

## Çalıştırma

```bash
npm run dev
```

Tarayıcıda `http://localhost:5173` açılır.

## Build

```bash
npm run build
```

Çıktı: `dist/`. Önizleme: `npm run preview`.

## Teknolojiler

- React 18, TypeScript
- Vite
- Three.js (3D)
- Recharts (grafikler)

## Lisans

MIT.
