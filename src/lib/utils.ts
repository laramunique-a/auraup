export async function compressImage(file: File, maxWidth = 640, quality = 0.5): Promise<string> {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.readAsDataURL(file)
    reader.onload = async (e) => {
      try {
        const result = await compressBase64(e.target?.result as string, maxWidth, quality)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
  })
}

export async function compressBase64(base64: string, maxWidth = 640, quality = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = base64
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)

      const compressed = canvas.toDataURL('image/jpeg', quality)
      resolve(compressed)
    }
    img.onerror = reject
  })
}
