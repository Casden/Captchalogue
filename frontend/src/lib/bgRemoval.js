import { removeBackground } from "@imgly/background-removal";

function isModuleLoadError(message) {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("error loading dynamically imported module") ||
    text.includes("failed to fetch dynamically imported module") ||
    text.includes("importing a module script failed")
  );
}

export async function removeImageBackground(file) {
  try {
    const blob = await removeBackground(file);
    const baseName = (file?.name || "artifact").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.png`, { type: "image/png" });
  } catch (err) {
    if (isModuleLoadError(err?.message)) {
      throw new Error(
        "Background-removal assets did not load correctly (likely due to a cached older build). Refresh the page and try again."
      );
    }
    throw err;
  }
}
