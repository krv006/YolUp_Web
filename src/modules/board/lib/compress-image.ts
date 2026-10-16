const MAX_CHARS = 440_000; // serverdagi chegara (450 000) dan biroz kam
const SIDES = [1200, 1000, 800, 640];
const QUALITIES = [0.8, 0.65, 0.5];

export interface CompressedImage {
  src: string;
  width: number;
  height: number;
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Rasmni o'qib bo'lmadi"));
    };
    image.src = url;
  });
}

/** Rasmni doskaga mos siqadi: JPEG, uzun tomoni <= 1200 px; hajm chegaradan oshsa sifat/o'lcham kamaytiriladi. */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Faqat rasm fayli");
  const image = await load(file);
  for (const side of SIDES) {
    const scale = Math.min(1, side / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Rasmni qayta ishlab bo'lmadi");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    for (const quality of QUALITIES) {
      const src = canvas.toDataURL("image/jpeg", quality);
      if (src.length <= MAX_CHARS) return { src, width, height };
    }
  }
  throw new Error("Rasm juda katta — kichikroq rasm tanlang");
}
