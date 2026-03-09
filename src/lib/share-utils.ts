/**
 * Share a file using Web Share API when available, otherwise trigger download.
 * @returns true if shared successfully, false if fell back to download
 */
export async function shareOrDownloadFile(
  blob: Blob,
  filename: string,
  title?: string
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title ?? filename,
        });
        return true;
      }
    } catch (err) {
      // User cancelled or share failed - fall through to download
      if ((err as Error).name === 'AbortError') return false;
    }
  }

  // Fallback: trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return false;
}
