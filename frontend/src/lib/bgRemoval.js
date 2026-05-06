export async function removeImageBackground(file) {
  const { removeBackground } = await import("@imgly/background-removal");
  const blob = await removeBackground(file);
  const baseName = (file?.name || "artifact").replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.png`, { type: "image/png" });
}
